/*
■ファイル
0SkillInfoWindow_drawSettingValue.js

■SRPG Studio対応バージョン:1.319

■プラグインの概要
1.スキル設定に応じた効果を表示するようにします（自動で表示されます）

※非対応スキル※
先制攻撃,
反撃時にクリティカル,
再攻撃,
クリティカル可能,
武器の使用回数が減らない,
反撃,
支援,
パラーメータボーナス,
盗む,
行動回復,
再移動,
カスタム,

2.スキル情報に短い説明文を追加することもできます(全てのスキルタイプに対応しています)
スキルのカスタムパラメータに以下を記述
{
  description: '説明文'	
}

■使用方法
このファイルをpluginフォルダに入れる
説明の文言を変更したい場合は本プラグイン内の各文字列を変更してください

■困った時は
※ウィンドウから文字が食み出てしまう場合※
ウィンドウ幅を拡張してみてください(238行目付近のコメントアウトを外し、widthExpansionに広げたい数値を設定する)

※説明の描画行がずれてしまう場合※
スキル情報の描画処理を変更している他のプラグインと競合している恐れがあります
ファイルの読み込み順を変えるか、本プラグイン内の処理を変更することで調整してください
210行目付近 	var infoY = y + _SkillInfoWindow_getWindowHeight.call(this) - spaceY; の部分


■作成者
ran

■更新履歴
2026/03/07 新規作成

*/

(function() {
//---------------------------------------------------------------------
// スキルごとの設定を定義
//---------------------------------------------------------------------
var SkillConfig = {};

SkillConfig[SkillType.AUTORECOVERY] = { name: 'HP回復:', sign: '' };
SkillConfig[SkillType.BATTLERESTRICTION] = {
	name: '対戦相手への制限:',
	format: function(skill) {
		return [['攻撃半減', '攻撃封じ'][skill.getSkillValue()]];
	}
};
SkillConfig[SkillType.CONTINUOUSATTACK] = {
	name: '連続 ',
	format: function(skill) { return [skill.getSkillValue() + '回攻撃']; }
};
SkillConfig[SkillType.DAMAGEGUARD] = { name: 'ダメージ減少率:', sign: '%' };
SkillConfig[SkillType.DAMAGEABSORPTION] = { name: '吸収率:', sign: '%' };
SkillConfig[SkillType.DISCOUNT] = { name: '値引き率:', sign: '%' };
SkillConfig[SkillType.FUSION] = {
	name: 'フュージョン:',
	format: function(skill) {
		var data = root.getBaseData().getFusionList().getDataFromId(skill.getSkillValue());
		return data ? [data.getName()] : null;
	}
};
SkillConfig[SkillType.GROWTH] = {
	name: '経験値 ×',
	format: function(skill) { return [skill.getSkillValue() / 100]; }
};
SkillConfig[SkillType.INVALID] = {
	name: '無効化:',
	isMultiLine: true, // 複数行表示を強制するフラグ
	format: function(skill) {
		var flag = skill.getSkillValue();
		var lines = [];
		if (flag & InvalidFlag.CRITICAL) lines.push('クリティカル');
		if (flag & InvalidFlag.EFFECTIVE) lines.push('特効');
		if (flag & InvalidFlag.SKILL) lines.push('発動型スキル');
		if (flag & InvalidFlag.BADSTATE) lines.push('バッドステート');
		if (flag & InvalidFlag.HALVEATTACKBREAK) lines.push('攻撃半減');
		if (flag & InvalidFlag.SEALATTACKBREAK) lines.push('攻撃封じ');
		return lines;
	}
};
SkillConfig[SkillType.METAMORPHOZE] = {
	name: '形態変化:',
	isMultiLine: true,
	format: function(skill) {
		var names = [];
		var list = skill.getDataReferenceList();
		var count = list.getTypeCount();
		for (var i = 0; i < count; i++) {
			var data = list.getTypeData(i);
			if (data) names.push(data.getName());
		}
		return names;
	}
};
SkillConfig[SkillType.PICKING] = {
	name: '開錠:',
	format: function(skill) {
		var lines = [];
		var flag = skill.getSkillValue();
		if (flag & KeyFlag.TREASURE) lines.push('宝箱');
		if (flag & KeyFlag.GATE) lines.push('扉');
		return [lines.join(' ')];
	}
};
SkillConfig[SkillType.STATEATTACK] = {
	name: 'ステート付与:',
	format: function(skill) {
		var state = root.getBaseData().getStateList().getDataFromId(skill.getSkillValue());
		return state ? [state.getName()] : null;
	}
};
SkillConfig[SkillType.SURVIVAL] = {
	name: '不死身:',
	format: function(skill) {
		return [['HP1で生き残る', '攻撃回避'][skill.getSkillValue()]];
	}
};
SkillConfig[SkillType.TRUEHIT] = {
	name: '必中:',
	format: function(skill) {
		var arr = ['通常ダメージ', '防御無視', '特効ダメージ', 'HPを1にする', 'とどめを刺す'];
		return [arr[skill.getSkillValue()]];
	}
};
// 再行動skill
SkillConfig[SkillType.REACTION] = {
	name: StringTable.SkillWord_Invocation + ':',
	format: function(skill) {
		var lines = [];
		lines.push(InvocationRenderer.getInvocationText(skill.getInvocationValue(), skill.getInvocationType()));
		var cooltime = skill.getSkillValue();
		if (cooltime > 0) lines.push('クールタイム ' + cooltime + 'ターン');
		return lines;
	}
};

//---------------------------------------------------------------------
// 補助関数: 表示用データの整形
//---------------------------------------------------------------------
var getAdditionalInfo = function(skill) {
	var info = { lines: [], description: '' };
	if (!skill) return info;

	var config = SkillConfig[skill.getSkillType()];
	if (config) {
		var results = typeof config.format === 'function' 
			? config.format(skill) 
			: [skill.getSkillValue() + (config.sign || '')];

		if (results && results.length > 0) {
			// 特殊レイアウト（複数行かつフラグがある場合、または項目が2つ以上）
			if (config.isMultiLine && results.length > 1) {
				info.lines.push(config.name);
				for (var i = 0; i < results.length; i++) {
					info.lines.push(' ' + results[i]);
				}
			} else {
				// 通常レイアウト: 1項目目は名前と連結、2項目目以降は独立行
				for (var j = 0; j < results.length; j++) {
					info.lines.push(j === 0 ? config.name + results[j] : results[j]);
				}
			}
		}
	}

	var desc = skill.custom.description;
	if (typeof desc === 'string' && desc !== '') {
		info.description = desc;
	}

	return info;
};

//---------------------------------------------------------------------
// クラス拡張
//---------------------------------------------------------------------
SkillInfoWindow._skillInfo = null;

var _SkillInfoWindow_setSkillInfoData = SkillInfoWindow.setSkillInfoData;
SkillInfoWindow.setSkillInfoData = function(skill, objecttype) {
	_SkillInfoWindow_setSkillInfoData.call(this, skill, objecttype);
	this._skillInfo = skill ? getAdditionalInfo(skill) : null;
};

var _SkillInfoWindow_drawWindowContent = SkillInfoWindow.drawWindowContent;
SkillInfoWindow.drawWindowContent = function(x, y) {
	_SkillInfoWindow_drawWindowContent.call(this, x, y);

	if (!this._skill || !this._skillInfo) return;

	var info = this._skillInfo;
	var spaceY = ItemInfoRenderer.getSpaceY();
	var infoY = y + _SkillInfoWindow_getWindowHeight.call(this) - spaceY;
	
	var textui = this.getWindowTextUI();
	var color = textui.getColor();
	var font = textui.getFont();
	var length = this._getTextLength();

	// スキル詳細行の描画
	for (var i = 0; i < info.lines.length; i++) {
		TextRenderer.drawKeywordText(x, infoY, info.lines[i], length, color, font);
		infoY += spaceY;
	}

	// カスタム説明文の描画
	if (info.description) {
		TextRenderer.drawKeywordText(x, infoY, info.description, length, color, font);
	}
};

var _SkillInfoWindow_getWindowHeight = SkillInfoWindow.getWindowHeight;
SkillInfoWindow.getWindowHeight = function() {
	var height = _SkillInfoWindow_getWindowHeight.call(this);
	if (!this._skill || !this._skillInfo) return height;

	var count = this._skillInfo.lines.length + (this._skillInfo.description ? 1 : 0);
	return height + (ItemInfoRenderer.getSpaceY() * count);
};

// ウィンドウの幅を拡張したい時は、下5行分のコメントアウトを外してwidthExpansionに広げたい数値を設定してください
//var _SkillInfoWindow_getWindowWidth = SkillInfoWindow.getWindowWidth;
//SkillInfoWindow.getWindowWidth = function() {
//	var widthExpansion = 0;
//	return _SkillInfoWindow_getWindowWidth.call(this) + widthExpansion;
//};

})();