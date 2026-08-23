/*
■ファイル
TrophyStateControl_RG.js

■SRPG Studio対応バージョン:1.326

■プラグインの概要
ドロップトロフィーが設定された敵にユニットに指定したステートを付与する
例：「薬草」をドロップする敵に目印となるステートを付与する

トロフィーが消失した場合、ステートが自動で解除される
例：敵からドロップアイテムを盗んだ時

■使用方法
1.このファイルをpluginフォルダに入れる
2.ドロップトロフィー(アイテム, ゴールド, ボーナス）に対応したステートを作成する
3.2で作成したステートのidを本プラグイン内に記述する

■ステート付与に関する仕様

ステートが付与されるタイミング
・ユニットがマップに登場する際（初期配置の敵、イベントで出現した敵、増援の敵）
・敵が宝箱やイベントコマンドでトロフィーを追加された際

ステートが解除されるタイミング
・ドロップアイテムに設定された品が消失（耐久減少で破損など）した時
・敵の持ち物からドロップアイテムが盗まれたことでトロフィーが消失した時
・イベントコマンドでトロフィーが解除された時

付与されるステート
トロフィーでチェックの入ったドロップ内容に応じてステートが選定される
一つのトロフィーに複数チェックが入っていた場合は、アイテム,ゴールド、ボーナスの順にステートが決まる
（[薬草、100G]のトロフィーであれば、DropStateId.ITEMで指定したステートを付与する）

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2026/08/23 新規作成

*/

var RantaroGames = RantaroGames || {};

(function() {

// トロフィーを区別しなくても良いなら、ステートは一つだけでも問題ない
// 作成したステートのidを記述する
var DropStateId = {
	ITEM: 0
,   GOLD: 0
,   BONUS: 0
};


// ユニットがマップに登場する際に呼ばれる
// 以下で使用される
// ScriptCall_AppearEventUnit イベントでユニットが登場する際に呼ばれる
// ReinforcementChecker._appearUnit 援軍ユニットの登場時に呼ばれる
// OpeningEventFlowEntry._resetUnit オープニングイベント開始前に、初期配置ユニットをマップへ再配置する処理
var _UnitProvider_setupFirstUnit = UnitProvider.setupFirstUnit;
UnitProvider.setupFirstUnit = function(unit) {
	_UnitProvider_setupFirstUnit.call(this, unit);

	RantaroGames.StateControl.applyDropState(unit);
};

// イベントコマンドで耐久減少や武器の消耗などでトロフィーが消失する処理
// itemと同じidのアイテムがドロップトロフィーに含まれるため削除する処理が実行されていれば trueが返っている
var _ItemControl_deleteTrophy = ItemControl.deleteTrophy;
ItemControl.deleteTrophy = function(unit, item) {
	var result = _ItemControl_deleteTrophy.call(this, unit, item);
	
	if (result) {
		RantaroGames.StateControl._updateDropState(unit);
	}
	
	return result;
};

// 自軍ユニットが敵アイテムを盗んだ際の処理
// 現行(ver.1.326)の処理ではトロフィーにアイテムとゴールドなど複数設定していた場合、アイテムの消失でトロフィー全体が削除される
// [薬草、 100G]がトロフィーに設定されている敵の薬草を盗んだ場合、100Gを含めたトロフィーが削除される
var _UnitItemStealScreen__checkDropTrophy = UnitItemStealScreen._checkDropTrophy;
UnitItemStealScreen._checkDropTrophy = function(unit) {
	_UnitItemStealScreen__checkDropTrophy.call(this, unit);
	
	RantaroGames.StateControl._updateDropState(unit);
};

// 敵にトロフィーが設定された時の処理（宝箱やイベントコマンドで追加された）
var _TrophyCollector__addDrop = TrophyCollector._addDrop;
TrophyCollector._addDrop = function(trophy) {
	_TrophyCollector__addDrop.call(this, trophy);
	
	RantaroGames.StateControl.applyDropState(this._unit);
};

// 敵のトロフィーが消失した時の処理(イベントコマンドでトロフィーを解除した)
var _TrophyCollector__deleteDrop = TrophyCollector._deleteDrop;
TrophyCollector._deleteDrop = function(trophy) {
	_TrophyCollector__deleteDrop.call(this, trophy);
	
	RantaroGames.StateControl._updateDropState(this._unit);
};

//----------------------------------------------------------------
// ドロップトロフィーが設定された敵ユニットに対応するステートを付与する
//----------------------------------------------------------------
RantaroGames.StateControl = {
	// 敵ユニットにドロップトロフィーが設定されていればステートを付与する
	applyDropState: function(unit) {
		var i, trophyList, trophy, stateId;

		if (unit.getUnitType() !== UnitType.ENEMY) {
			return;
		}

		trophyList = unit.getDropTrophyList();

		for (i = 0; i < trophyList.getCount(); i++) {
			trophy = trophyList.getData(i);

			if (trophy === null) {
				continue;
			}

			stateId = this._getDropStateId(trophy);

			if (stateId !== -1) {
				this._arrangeDropState(
					unit,
					stateId,
					IncreaseType.INCREASE
				);
			}
		}
	},
	
	_arrangeDropState: function(unit, stateId, type) {
		var state = this._getStateFromId(stateId);
		if (state) {
			StateControl.arrangeState(unit, state, type);
		}
	},
	
	_updateDropState: function(unit) {
		this._arrangeDropState(unit, DropStateId.ITEM, IncreaseType.DECREASE);
		this._arrangeDropState(unit, DropStateId.GOLD, IncreaseType.DECREASE);
		this._arrangeDropState(unit, DropStateId.BONUS, IncreaseType.DECREASE);
		
		this.applyDropState(unit);
	},
	
	_getStateFromId: function(stateId) {
		return root.getBaseData().getStateList().getDataFromId(stateId);
	},

	_getDropStateId: function(trophy) {
		var flag = trophy.getFlag();
		var item = trophy.getItem();

		if ((flag & TrophyFlag.ITEM) !== 0 && item !== null) {
			return DropStateId.ITEM;
		}

		if ((flag & TrophyFlag.GOLD) !== 0 && trophy.getGold() !== 0) {
			return DropStateId.GOLD;
		}

		if ((flag & TrophyFlag.BONUS) !== 0 && trophy.getBonus() !== 0) {
			return DropStateId.BONUS;
		}

		return -1;
	}
};

})();
