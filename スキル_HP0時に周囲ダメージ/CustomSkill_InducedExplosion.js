/*
■ファイル名
CustomSkill_InducedExplosion.js

■SRPG Studio対応バージョン
ver.1.252

■プラグインの概要
以下の効果を持つカスタムスキルを実装する
スキル効果：ダメージを受けたユニットがHP0になった時、隣接地点にいる別ユニットに指定したダメージを与える

(例1)
スキル所持ユニット(下図:S0)のHPが0になると、隣接する4ユニットに指定ダメージを与える
順番は、T1→T2→T3→T4(左上右下)
   T2
T1 S0 T3
   T4

(例2)
複数のスキル所持ユニットが居た場合(S0, S1, S2)、連鎖的に効果が発揮される
順番は、T1→T1→S1→S2→T3→T4	→T5→T6→T7
   T2    T3
T1 S0 S1 S2 T4
   T7 T6 T5


■使用方法
1.このスクリプトをpluginフォルダに入れる

2.カスタムスキルを作成する
2.1.キーワード:　InducedExplosion
2.2.以下のカスタムパラメータを設定する
  InducedExplosionData:
{
    damage: 数値 {ダメージ値} 省略時:10
,   damageType: 数値 {ダメージタイプ, 0:固定, 1:物理, 2:魔法}　または　{DamageType.FIXED,　DamageType.PHYSICS,　DamageType.MAGIC}も可 省略時:0
,   effect: {isRuntime: 真偽値 id: 数値} 周囲へのダメージイベントのアニメ {true:ランタイムエフェクト/ false:オリジナル, id:エフェクトのid}　省略時:ランタイムエフェクトid:0(火柱)
,   skillanime: {isRuntime: 真偽値, id: 数値}　起点のスキル効果アニメ 省略時:ランタイムエフェクトid:0(火柱)
,   isFinish: 真偽値 {true: イベントダメージでとどめを刺せる / false: HPを1残す}　省略時:true
}

(例)
{
  InducedExplosionData: {
    damage: 25
,   damageType: DamageType.PHYSICS
,   effect: {isRuntime: true, id: 8}
,   skillanime: {isRuntime: true, id: 10}
  }
}

■仕様
・デフォルトスキル効果について
不死身：イベントダメージにも有効
ダメージガード:イベントダメージには無効
無効処理[スキル]：無効化されません

・支援効果について
damageTypeが1or2の時、地形効果込みの防御力(物理/魔法)が適用されます
ただし、支援効果は考慮されません

・カスタムスキルの発動率
スキルの有無のみ判定し、発動率を考慮しません
発動時のエフェクトはカスタムパラメータで指定し、アニメエフェクトとして便宜的に表示されます

■既知の不具合
スキル効果でダメージを与える際、エフェクトアニメーションが加速して実行される場合がある
(イベントコマンド(アイテム)でダメージを与えてスキルを発動させた場合に顕著)


■作成者
ran

■更新履歴
2022/02/01 新規作成

*/

(function() {

// カスタムスキルのキーワード
var CUSTOMSKILL_KEYWORD = 'InducedExplosion';

// 戦闘終了時に処理追加
var _PreAttack__pushFlowEntriesEnd = PreAttack._pushFlowEntriesEnd;
PreAttack._pushFlowEntriesEnd = function(straightFlow) {
	_PreAttack__pushFlowEntriesEnd.call(this, straightFlow);
	straightFlow.pushFlowEntry(InducedExplosionFlowEntry);
};

// イベントコマンドによるダメージを与えた後の処理に追加
var _DamageHitFlow__pushFlowEntries = DamageHitFlow._pushFlowEntries;
DamageHitFlow._pushFlowEntries = function(straightFlow) {
	_DamageHitFlow__pushFlowEntries.call(this, straightFlow);
	straightFlow.pushFlowEntry(InducedExplosionFlowEntry);
};

// イベントコマンドでダメージを与えてユニットを撃破した場合にStraightFlow.setStraightFlowData(flowData)を実行せずに処理が終了することでエラーが生じてしまう
// 該当スキル持ちのユニット2体からダメージを受ける状況でユニットが片方のスキル効果で撃破されると他方のスキル効果のイベントを実行しようとするタイミングでエラーが発生する
// (エラー例）StraightFlow._entryArrayが、配列ではなくnullのままになる
// このエラーを回避するためにDamageHitEventCommandオブジェクトでtargetUnitの値を判定するタイミングでStraightFlow.setStraightFlowData()を実行しておく処置を取った
var _DamageHitEventCommand__checkEventCommand = DamageHitEventCommand._checkEventCommand;
	DamageHitEventCommand._checkEventCommand = function() {
	var result = _DamageHitEventCommand__checkEventCommand.call(this);
	
	if (result === false) {
		this._straightFlow.setStraightFlowData(null);
	}
	
	return result;
	
	//  元の処理。falseを返した場合、DamageHitEventCommand.enterEventCommandCycle()で以降の処理実行せずに終了する
/* 	var targetUnit = root.getEventCommandObject().getTargetUnit();
	if (targetUnit === null || targetUnit.getAliveState() !== AliveType.ALIVE) {
		return false;
	}
	return true;
*/
};


// HPが0になった時に周囲のユニットにダメージを与える処理
var InducedExplosionFlowEntry = defineObject(BaseFlowEntry,
{	
	_dynamicEvent: null,
	_damageData: null,
	
	enterFlowEntry: function(preAttack) {
		this._prepareMemberData(preAttack);
		
		var result = this._completeMemberData(preAttack);
		if (result === EnterResult.NOTENTER) {
			return MoveResult.END;
		}
		
		return result;
	},
	
	moveFlowEntry: function() {
		return this._dynamicEvent.moveDynamicEvent();
	},
	
	_prepareMemberData: function(preAttack) {
		this._dynamicEvent = createObject(DynamicEvent);
		this._damageData = null;
	},
	
	_completeMemberData: function(preAttack) {
		var targetUnit, i, generator, isRuntime, id;
		var passiveUnit = preAttack.getPassiveUnit();

		// 起点ユニットが「生存」or「消去」の場合は、この時点で処理を終了する
		if (passiveUnit.getAliveState() === AliveType.ALIVE || passiveUnit.getAliveState() === AliveType.ERASE) {
			return EnterResult.NOTENTER;
		}
				
		root.log('passiveUnit:' + passiveUnit.getName());
		
		var skill = this._getSkill(passiveUnit);
		if (skill === null) {
			//root.log('skill === nullにより処理終了');
			return EnterResult.NOTENTER;
		}
		
		// ダメージデータ(damate値、effectなど)設定
		this._damageData = this._getDamageData(skill);
		if (this._damageData === null) {
			root.log('skillのカスタムパラメータ不正により処理終了');
			return EnterResult.NOTENTER;
		}
		
		var posX = passiveUnit.getMapX();
		var posY = passiveUnit.getMapY();
		
		generator = this._dynamicEvent.acquireEventGenerator();
		
		// 起点のアニメ再生
		var anime = this._getEffectAnime(skill, true);
		if (anime !== null) {
			var pos = LayoutControl.getMapAnimationPos(LayoutControl.getPixelX(posX), LayoutControl.getPixelY(posY), anime);
			// animationPlay(anime, x, y, isCenterShow, option, id)
			generator.animationPlay(anime, pos.x, pos.y, false, AnimePlayType.SYNC, 0);
		}
		
		// 起点の周囲を探索[左, 上, 右, 下]
		// constants-enumeratedtype.js var XPoint = [-1, 0, 1, 0];var YPoint = [0, -1, 0, 1];
		for (i = 0; i < 4; i++) {
			targetUnit = PosChecker.getUnitFromPos(posX + XPoint[i], posY + YPoint[i]);
		
			if (targetUnit !== null) {
				root.log('t' + i + ': ' + targetUnit.getName());
				this._setDynamicEvent(passiveUnit, targetUnit, generator);
			}
		}

		return this._dynamicEvent.executeDynamicEvent();
	},

	_setDynamicEvent: function(unit, targetUnit, generator) {
		var damage = this._damageData.damage;
		var effect = this._damageData.effect;
		var damageType = this._damageData.damagetype;
		var isSkipMode = false;
		var curHp, def;
		
		//　effectの取得に失敗している時はダメージアニメをスキップする
		if (effect === null) isSkipMode = true;
		
		// イベントダメージでとどめを刺せない設定
		if (this._damageData.isFinishAllowed === false) {
			curHp = targetUnit.getHp();
			
			switch (damageType) {
				case DamageType.FIXED  : def = 0; break;
				case DamageType.PHYSICS: def = RealBonus.getDef(targetUnit); break;
				case DamageType.MAGIC  : def = RealBonus.getMdf(targetUnit); break;
				default: def = 0; break;
			}
			// damageを現在HP+防御-1に調整
			damage = curHp + def - damage <= 0 ? curHp + def - 1 : damage;
		}
		
		generator.locationFocus(targetUnit.getMapX(), targetUnit.getMapY(), true); 
		generator.damageHit(targetUnit,	effect,	damage,	damageType,	unit, isSkipMode);
	},
	
	_getDamageData: function(skill) {
		var obj = {};
		var customData = skill.custom.InducedExplosionData;
		if (typeof customData === 'undefined') return this._damageData = null;
	
		obj.damage = typeof customData.damage === 'number' ? customData.damage : 10;
		obj.damagetype = typeof customData.damageType === 'number' ? customData.damageType : DamageType.FIXED;
		obj.effect = this._getEffectAnime(skill, false);
		obj.isFinishAllowed = typeof customData.isFinish === 'boolean' ? customData.isFinish : true;
		
		return obj;
	},
	
	// EffectAnimeを取得する。isStart {true:起点 / false:誘爆対象}
	_getEffectAnime: function(skill, isStart) {
		var isRuntime, id, skillanime, effect;
		
		if (isStart) {
			skillanime = skill.custom.InducedExplosionData.skillanime;
			if (typeof skillanime !== 'undefined') {
				isRuntime = skillanime.isRuntime;
				id = skillanime.id;
			}
		} else {
			effect = skill.custom.InducedExplosionData.effect;
			if (typeof effect !== 'undefined') {
				isRuntime = effect.isRuntime;
				id = effect.id;
			}
		}
		
		if (typeof isRuntime !== 'boolean') isRuntime = true;
		if (typeof id !== 'number') id = 0;
		
		return root.getBaseData().getEffectAnimationList(isRuntime).getDataFromId(id);
	},
	
	_getSkill: function(unit) {
		return SkillControl.getPossessionCustomSkill(unit, CUSTOMSKILL_KEYWORD);
	}
}
);


//---------------------
// スキル情報ウィンドウ
//---------------------
var _SkillInfoWindow_drawWindowContent = SkillInfoWindow.drawWindowContent;
SkillInfoWindow.drawWindowContent = function(x, y) {
	if (this._skill === null) return;
	
	var length = this._getTextLength();
	var textui = this.getWindowTextUI();
	var color = ColorValue.KEYWORD;//textui.getColor();
	var font = textui.getFont();
	var text = '';
		
	_SkillInfoWindow_drawWindowContent.call(this, x, y);
	y += _SkillInfoWindow_getWindowHeight.call(this) - ItemInfoRenderer.getSpaceY();
	
	if (this._skill.getCustomKeyword() === 'InducedExplosion') {
		text = 'ダメージ';
		var customData = this._skill.custom.InducedExplosionData;
		if (typeof customData === 'undefined') return;
		var damage = typeof customData.damage === 'number' ? customData.damage : 10;
		var damagetype = typeof customData.damageType === 'number' ? customData.damageType : DamageType.FIXED;
		
		function f_type(type) {
			var text = '';
			switch (type) {
				case 0 : text = '(固定) '; break;
				case 1 : text = '(物理) '; break;
				case 2 : text = '(魔法) '; break;
				default: text = '(固定) '; break;
			}
			return text;
		}
		
		text += f_type(damagetype) + damage;
		
		TextRenderer.drawKeywordText(x, y, text, length, color, font);
		y += ItemInfoRenderer.getSpaceY();
		
		if (customData.isFinish === false) {
			text = 'このダメージではHPを0にしない';
			TextRenderer.drawKeywordText(x, y, text, length, ColorValue.INFO, font);
			y += ItemInfoRenderer.getSpaceY();
		}
	}
};

var _SkillInfoWindow_getWindowHeight = SkillInfoWindow.getWindowHeight;
SkillInfoWindow.getWindowHeight = function() {
	var height = _SkillInfoWindow_getWindowHeight.call(this);
	var objecttype = this._objecttype;
	var spaceY = ItemInfoRenderer.getSpaceY();
	var skilltype;
	
	if (this._skill === null) return height;
	
	if (this._skill.getCustomKeyword() === 'InducedExplosion') {
		var customData = this._skill.custom.InducedExplosionData;
		if (typeof customData !== 'undefined') {
			height += spaceY;
			
			if (customData.isFinish === false) {
				height += spaceY;
			}
		}
	}
		
	return height;
};

})();
