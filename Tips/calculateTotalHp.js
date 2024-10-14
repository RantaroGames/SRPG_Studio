/*
■ファイル
calculateTotalHp.js

■SRPG Studio対応バージョン:1.302

■プラグインの概要
総HPをイベント（戦闘やアイテム使用など）に合わせて計算し、結果を変数で受け取る

■使用方法
1.このファイルをpluginフォルダに入れる

2.結果を受け取る変数を作成する

3-1.下記コード内の項目（123行付近）で数値を指定する
VariablePage : 作成した変数のテーブル番号(左端を0として数える）
VariableIds  : 変数のid配列 [自軍用id, 敵軍用id, 友軍用id]

3-2.必要に応じて(※)イベントコマンド<スクリプトの実行>を設定する
※主にイベントでユニットを登場させたり消去させた場合に再計算する目的で使用する

・使用方法
 スクリプトの実行>コード実行>コード欄に以下のように記述(引数の指定は後述)
 
 Fnc_TotalHP(unitType, isDefault);
 
 (引数の説明)
   unitType:  数値   0 自軍 1 敵軍 2 友軍
   isDefault: 真偽値 true フュージョンされているユニットも考慮する false フュージョンされているユニットは除く 通常は trueで良い
 
 戻り値を変数で受け取る


※※競合対策※※
o-to氏の範囲攻撃アイテムを使用している場合、このプラグインだけではダメージアイテムに対応できません
このファイル内の末尾に競合対策を書いてありますので必要ならコピペして該当箇所を上書きしてください

■作成者
ran

■更新履歴
2024/10/14 新規作成

*/

/*

出撃かつ生存しているユニットの現在HPの総和を求める関数
主にイベントでユニットを登場させたり消去させた場合に<スクリプトの実行>で再計算させるために使用する

*/

function Fnc_TotalHP(unitType, isDefault)
{
	var list, i, count, unit;
	var result = 0;
	
	if (typeof isDefault !== 'boolean') isDefault = true;
	
	if (root.getBaseScene() === SceneType.REST) {
		if (unitType === 0) {
			// 拠点では生存ユニットのリストを取得
			list = PlayerList.getAliveList();
		} else {
			// 拠点では敵、友軍リストは無いので0を返す
			return 0;
		}
	}
	else {
		switch (unitType) {
			case 0 : 
				list = isDefault ? PlayerList.getSortieDefaultList() : PlayerList.getSortieList();
				break;
			case 1 : 
				list = isDefault ? EnemyList.getAliveDefaultList() : EnemyList.getAliveList();
				break;
			case 2 : 
				list = isDefault ? AllyList.getAliveDefaultList() : AllyList.getAliveList();
				break;
			default: 
				return 0;
		}
	}
	
	count = list.getCount();
	for (i = 0; i < count; i++) {
		unit = list.getData(i);
		if (unit === null) continue;

		// 非表示状態のユニットのHPも加算したい場合は以下のif分をコメントアウト
		if (unit.isInvisible() === true) continue;
		
		if (unitType !== 0) {
			// 敵、友軍ユニットで出撃状態にないユニットのHPも加算したい場合は下のif分をコメントアウト
			if (unit.getSortieState() !== SortieType.SORTIE) continue;
		}		
		
		result += unit.getHp();
//		root.log(unit.getName() + ': ' + unit.getHp());
	}
	
	return result;
}

/*

総HPをイベント（戦闘やアイテム使用など）に合わせて計算する処理

※取得した値を格納する変数を指定するため下記のVariablePage、VariableIdsの数値を設定すること

※自動で計算されるタイミングは以下の６つ
・戦闘準備シーンが終わってマップが開始した時点で総HPを計算する
・戦闘が終了して経験値を得る時
・増援が出現した時（イベントで出現させたときは除く）
・イベントやアイテムでダメージを与えた時
・イベントやアイテムでHPを回復した時
・全体回復アイテムでHPを回復した時

*/

(function() {

// 総HPを格納した変数のテーブル番号(左から0, 1, 2, 3, 4, 5 ※5はid変数)
var VariablePage = 0;

// 総HPを格納した変数id [自軍, 敵軍, 友軍]
var VariableIds = [0, 1, 2];

// 指定した変数の値を取得したり設定したりする関数
var FncVariableControl = {
	getVariable: function(page, id) {
		var table = root.getMetaSession().getVariableTable(page);
		var index = table.getVariableIndexFromId(id);
	
		return table.getVariable(index);
	},
	
	setVariable: function(page, id, value) {
		var table = root.getMetaSession().getVariableTable(page);
		var index = table.getVariableIndexFromId(id);
	
		table.setVariable(index, value);
	}
};
	
// 戦闘準備シーン（SceneType.BATTLESETUP)を終了して戦闘マップ（SceneType.FREE）へ移行するタイミングで総HPを求める
// マップ開始時までに登場しているユニットが算出対象
// マップ開始後にイベントでユニットを登場させたり消去した場合は手動で変数を操作すること
var _BattleSetupScene__changeFreeScene = BattleSetupScene._changeFreeScene;
BattleSetupScene._changeFreeScene = function() {
	var value, i;
	
	for (i = 0; i < 3; i++) {
		value = Fnc_TotalHP(i, true);
		FncVariableControl.setVariable(VariablePage, VariableIds[i], value);
	}
	
	return _BattleSetupScene__changeFreeScene.call(this);
};

// 敵増援が出現した際に総HPを加算して指定の変数へ格納する
var _ReinforcementChecker__appearUnit = ReinforcementChecker._appearUnit;
ReinforcementChecker._appearUnit = function(pageData, x, y) {
	var unit = _ReinforcementChecker__appearUnit.call(this, pageData, x, y);
	var unitType, value;
	
	if (unit !== null) {
		unitType = unit.getUnitType();
		value = FncVariableControl.getVariable(VariablePage, VariableIds[unitType]);
		value += unit.getHp();
		FncVariableControl.setVariable(VariablePage, VariableIds[unitType], value);
	}
	
	return unit;
};


// 戦闘が終了して経験値を獲得する処理に入った時に受けたダメージを格納していた総HPから減算する
var _NormalAttackOrderBuilder__calculateExperience = NormalAttackOrderBuilder._calculateExperience;
NormalAttackOrderBuilder._calculateExperience = function(virtualActive, virtualPassive) {
	var unitSrc = this._attackInfo.unitSrc;
	var unitDest = this._attackInfo.unitDest;
	var unitType, value;
	
	// 攻撃を仕掛けた側
	if (virtualActive.damageTotal !== 0) {
		unitType = unitSrc.getUnitType();
		value = FncVariableControl.getVariable(VariablePage, VariableIds[unitType]);
		value -= virtualActive.damageTotal;
		FncVariableControl.setVariable(VariablePage, VariableIds[unitType], value);
	}
	
	// 攻撃を受けた側
	if (virtualPassive.damageTotal !== 0) {
		unitType = unitDest.getUnitType();
		value = FncVariableControl.getVariable(VariablePage, VariableIds[unitType]);
		value -= virtualPassive.damageTotal;
		FncVariableControl.setVariable(VariablePage, VariableIds[unitType], value);
	}
	
	return _NormalAttackOrderBuilder__calculateExperience.call(this, virtualActive, virtualPassive);
};


// アイテムやイベントコマンドで「ダメージ」を与えた場合に総HPから減算する
var _DamageHitEventCommand__getHp = DamageHitEventCommand._getHp;
DamageHitEventCommand._getHp = function(damageData) {
	var targetUnit = damageData.targetUnit;
	var hp = targetUnit.getHp();
	var result = _DamageHitEventCommand__getHp.call(this, damageData);
	// 不死身の場合HPが1残るのでdamageData.damageをそのままは使えない
	var damage = hp - result;
	if (damage < 1) {
		return result;
	}
	
	var unitType = targetUnit.getUnitType();
	var value = FncVariableControl.getVariable(VariablePage, VariableIds[unitType]);
	
	value -= damage;
	FncVariableControl.setVariable(VariablePage, VariableIds[unitType], value);
	
	return result;
};


// アイテムやイベントコマンドで「HP回復」させた場合に総HPに加算する
var _HpRecoveryEventCommand_mainEventCommand = HpRecoveryEventCommand.mainEventCommand;
HpRecoveryEventCommand.mainEventCommand = function() {
	var unit = this._targetUnit;
	var hp = unit.getHp();
	var maxMhp = ParamBonus.getMhp(unit);
	var recovery = maxMhp - hp;
	
	recovery = recovery < this._recoveryValue ? recovery : this._recoveryValue;
	if (recovery < 1) {
		return _HpRecoveryEventCommand_mainEventCommand.call(this);
	}
	
	var unitType = unit.getUnitType();
	var value = FncVariableControl.getVariable(VariablePage, VariableIds[unitType]);
	value += recovery;
	FncVariableControl.setVariable(VariablePage, VariableIds[unitType], value);

	return _HpRecoveryEventCommand_mainEventCommand.call(this);
};


// アイテム「全体回復」を使用した時に総HPに加算する
var _EntireRecoveryItemUse__recoveryHp = EntireRecoveryItemUse._recoveryHp;
EntireRecoveryItemUse._recoveryHp = function(unit) {
	var hp = unit.getHp();
	var maxMhp = ParamBonus.getMhp(unit);
	var recovery = maxMhp - hp;
	var recValue = this._getValue(unit);
	recovery = recovery < recValue ? recovery : recValue;
	
	if (recovery > 0) {
		var unitType = unit.getUnitType();
		var value = FncVariableControl.getVariable(VariablePage, VariableIds[unitType]);
		
		value += recovery;
		FncVariableControl.setVariable(VariablePage, VariableIds[unitType], value);
	}
	
	_EntireRecoveryItemUse__recoveryHp.call(this, unit);	
};


})();



/*
o-to氏の範囲攻撃アイテムを使用している場合
EffectRangeDamage.jsファイルにあるOT_ItemEffectRangeUseクラスのオブジェクトを上書きして変数用の数値を設定してください
（外部から呼び出せない記述なので382行付近の _setDamage の部分を直に上書きするしかない）

// ↓ここから

	_setDamage: function(unit, damage) {
		var hp;
		var page = 0; // 変数テーブルの番号(左端を0)
		var ids = [0, 1, 2]; // 変数id[自軍, 敵軍, 友軍]
		var value, n, unitType, table, index;
		
		if (damage < 1) {
			return;
		}
		
		// ダメージ分だけユニットのhpを減らす
		hp = unit.getHp() - damage;
		if (hp <= 0) {
			n = unit.getHp();
			
			// ユニットが不死身である場合は、hpを1でとどめる
			if (unit.isImmortal()) {
				unit.setHp(1);
				
				n--;
			}
			else {
				unit.setHp(0);
				// 状態を死亡に変更する
				DamageControl.setDeathState(unit);
			}
		}
		else {
			unit.setHp(hp);
			
			n = damage;
		}
		
		if (n > 0) {
			unitType = unit.getUnitType();
			table = root.getMetaSession().getVariableTable(page);
			index = table.getVariableIndexFromId(ids[unitType]);
			value = table.getVariable(index);
			value -= n;
			table.setVariable(index, value);
		}
	},

// ↑ここまで

*/
