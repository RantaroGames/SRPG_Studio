/*
■ファイル
AutoUse-StateRecoveryItem.js

■SRPG Studio対応バージョン:1.323

■プラグインの概要
所属勢力のターン開始時にリスト（※）内のユニットを対象としてステート回復アイテムを自動で使用する処理を実装する
※プレイヤーリスト（「生存」&&「フュージョンされていない」&&「出撃」）
※敵、同盟リスト（「生存」&&「フュージョンされていない」）

■使用方法
1.このファイルをpluginフォルダに入れる
2.ステート回復アイテムの範囲を「単体」に設定し、カスタムパラメータに以下を記述する
{
  autoStateRecovery: true
}

■ステート回復アイテムの使用に関する仕様
・ユニットの所持品リストの上から順番に使用可否を判定します
・一度に使用するアイテムは一つだけです
・該当アイテムを使用できない状況（「アイテム封印」等）では自動回復しません
・バッドステートオプション「行動不能」時は自動回復しません
（ただし、プラグイン内の設定を変更することで使用可能にできます）
・一連のターン遷移開始時処理の最後に本プラグインの処理を実行します
（HP回復処理やステート持続ターン減少処理の後に実行することを想定。他のプラグインの導入具合によって処理順が異なる場合もあります）
・フュージョンされているユニットは対象外です

■自動回復処理に関する設定
本プラグイン内の設定（AUTO_HEAL_RULES）の項目を変更することでカスタマイズできます

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2026/07/10 新規作成

*/

(function() {

var AUTO_HEAL_RULES = {
	// 自動回復アイテム使用にカスタムスキル所持が必須か
	// true: スキル所持者のみ使用可能, false: 誰でも使用可能
	ONLY_SKILL_HOLDERS: false,
	
	// カスタムスキルのキーワード
	SKILL_KEYWORD: 'stateRecoveryItem_autoUse',
	
	// 行動不能時に使用を制限するか
	DISABLE_IF_BADOPTION_NOACION: true,
	
	// アイテム使用時アニメをスキップするか否か
	// true: 表示をスキップ, false: アニメ表示する(通常のスキップ操作でスキップ可能)
	ANIMATION_SKIP: false,
	
	// 敵、同盟ユニットがターン開始時に自動ステート回復アイテムを使用するか
	// falseなら後述の ALLOW_NPC_SELF_RECOVERY_ITEM を無視します
	ENABLE_NPC_STATE_RECOVERY: true
};

/*
 他のプラグインとの互換用設定
*/

// 「自分にも使える回復アイテム.js」（作：名前未定（仮）氏）との互換用
// ※注意点
// ※厳密には、本プラグインでは「自分にも使える回復アイテム.js」の射程操作処理を通していません。
// ※（USE_PLUGIN_RCOVERY_ITEM_TARGET_SELF === true && tyepof item.custom.isSelfOK === 'number')であれば
// ※「自分にも使える回復アイテム.js」を実際に導入していなくても、「範囲：単体」以外のステート回復アイテムも自動使用の候補になります
var RCOVERY_ITEM_TARGET_SELF = {
	// trueにした場合、範囲が単体ではないアイテムも使用候補になります
	USE_PLUGIN: false,

// 敵、同盟ユニットも(カスタムパラメータに{isSelfOK：1}を設定した）範囲：射程の回復アイテムを自分自身を対象として使用可能にするか
// ※「自分にも使える回復アイテム.js」の isSelfHealEnemy と同じ値に設定してください
	ALLOW_NPC_SELF_RECOVERY_ITEM: false
};

//---------------------------------------------------------------------
// ターン開始時にステート回復アイテムを自動で使用する処理
//---------------------------------------------------------------------
var UseStateRecoveryItemFlowEntry = defineObject(BaseFlowEntry,
{
	_dynamicEvent: null,
	
	enterFlowEntry: function(turnChange) {
		if (!AUTO_HEAL_RULES.ENABLE_NPC_STATE_RECOVERY &&
			root.getCurrentSession().getTurnType() !== TurnType.PLAYER
		) {
			return EnterResult.NOTENTER;;
		}
		
		this._prepareMemberData(turnChange);
		return this._completeMemberData(turnChange);
	},
	
	moveFlowEntry: function() {
		return this._dynamicEvent.moveDynamicEvent();
	},
	
	_prepareMemberData: function(turnChange) {
		this._dynamicEvent = createObject(DynamicEvent);
	},
	
	_completeMemberData: function(turnChange) {
		var i, unit, item;
		var commandCount = 0;
		var isSkipMode = AUTO_HEAL_RULES.ANIMATION_SKIP ? true : CurrentMap.isTurnSkipMode();
		var generator = this._dynamicEvent.acquireEventGenerator();
		var list = TurnControl.getActorList();
		var count = list.getCount();

		for (i = 0 ; i < count; i++) {
			unit = list.getData(i);
			if (!this._isRecoveryAllowed(unit)) {
				continue;
			}
			
			item = this.getItemFromUnit(unit);
			if (item === null) {
				continue;
			}
			// trueを指定することでカーソル表示は常にスキップする
			generator.locationFocus(unit.getMapX(), unit.getMapY(), true); 
			generator.itemUse(unit, unit, item, unit.getMapX(), unit.getMapY(), isSkipMode);
			commandCount++;
		}
		
		if (commandCount === 0) {
			return EnterResult.NOTENTER;
		}

		return this._dynamicEvent.executeDynamicEvent();
	},
	
	// ユニットの状態で自動ステート回復するか否かを判定する
	_isRecoveryAllowed: function(unit) {
		if (unit === null) {
			return false;
		}

		// TurnControl.getActorList()は、「生存」かつ「フュージョンされていない」かつ「出撃」(プレイヤー）ユニットを取得するので下のif文は現状では不要
		// if (FusionControl.getFusionParent(unit) !== null) return false;

		if (this._isNoActionBlocked(unit)) {
			return false;
		}

		if (this._requiresSkill(unit)) {
			return false;
		}

		return true;
	},

	_isNoActionBlocked: function(unit) {
		return AUTO_HEAL_RULES.DISABLE_IF_BADOPTION_NOACION &&
			StateControl.isBadStateOption(unit, BadStateOption.NOACTION);
	},

	_requiresSkill: function(unit) {
		return AUTO_HEAL_RULES.ONLY_SKILL_HOLDERS &&
			!SkillControl.getPossessionCustomSkill(unit, AUTO_HEAL_RULES.SKILL_KEYWORD);
	},
	
	getItemFromUnit: function(unit) {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(unit);
			
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			
			if (item === null || item.isWeapon()) {
				continue;
			}
			
			if (!this._isAutoStateRecoveryItem(item)) {
				continue;
			}
			
			if (!this._isItemAllowed(unit, item)) {
				continue;
			}
			
			if (!this._isValidTargetRange(unit, item)) {
				continue;
			}
			
			if (!ItemControl.isItemUsable(unit, item)) {
				continue;
			}
			
			return item;
		}
		
		return null;
	},
	
	// 自動ステート回復アイテムであるかを確認する
	_isAutoStateRecoveryItem: function(item) {
		return item.custom.autoStateRecovery === true;
	},
	
	_isItemAllowed: function(unit, item) {
		if (item.getItemType() !== ItemType.STATERECOVERY) {
			return false;
		}
		// ユニットに設定されているステートをstateGroupが回復できるか調べる
		return StateControl.isStateRecoverable(unit, item.getStateRecoveryInfo().getStateGroup());
	},
	
	_isValidTargetRange: function(unit, item) {
		// 「自分にも使える回復アイテム」を導入していない or 該当アイテムではない場合は、範囲「単体」以外は使用不可
		if (!RCOVERY_ITEM_TARGET_SELF.USE_PLUGIN || typeof item.custom.isSelfOK !== 'number') {
			return item.getRangeType() === SelectionRangeType.SELFONLY;
		}

		// 「自分にも使える回復アイテム」を敵、同盟ユニットは使用できない場合
		if (!RCOVERY_ITEM_TARGET_SELF.ALLOW_NPC_SELF_RECOVERY_ITEM && unit.getUnitType() !== UnitType.PLAYER) {
			return false;
		}
		
		return true;
	}
}
);

// ターン遷移開始時に自動ステート回復アイテム使用イベントを組みこむ
// straightFlowは以下を先に実行することを想定している。他プラグインによる挿入処理は読み込み順に左右される
// TurnAnimeFlowEntry or TurnMarkFlowEntry
// RecoveryAllFlowEntry
// MetamorphozeCancelFlowEntry
// BerserkFlowEntry
// StateTurnFlowEntry
var _TurnChangeStart_pushFlowEntries = TurnChangeStart.pushFlowEntries;
TurnChangeStart.pushFlowEntries = function(straightFlow) {
	_TurnChangeStart_pushFlowEntries.call(this, straightFlow);
	
	straightFlow.pushFlowEntry(UseStateRecoveryItemFlowEntry);
};

})();