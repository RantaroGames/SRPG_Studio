/*
■ファイル名
ShowItemLostMassage.js

■SRPG Studio対応バージョン
ver.1.316

■プラグインの概要
アイテム破損時にメッセージを表示する処理を追加します。
例えば、杖タイプのアイテムが壊れた時に破損時メッセージを表示できるようになります。

■使用方法
1.このプラグインをpluginフォルダに入れる

2.「アイテム」または、コンフィグで設定する「武器タイプ」のカスタムパラメータに以下のように記述する
※アイテムに設定されたカスタムパラメータが優先されます
表示する：true / 表示しない:false

{
  itemLostMessage: true
}

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2025/06/30 新規作成
2025/07/08 スキル使用で鍵開けをした時にエラーが出る不具合を修正
2025/07/25 破損前の元アイテムの取得方法を変更

*/

(function() {

//---------------------------------------------------------------------
// 「'が壊れました'」を'任意の文字'(''で文字を囲むこと)にすると表記を変えることができる
//---------------------------------------------------------------------
StringTable.ItemLost = 'が壊れました';

//---------------------------------------------------------------------------
// 破損したアイテムの名前を表示する(メッセージタイトルで画面中央に表示)処理
//---------------------------------------------------------------------------
var ItemLostMessageControl = {
	showMassageTitle: function(unit, item, generator) {
		generator.soundPlay(this._getLostSoundHandle(), 1);
		// messageTitle(message, x, y, isCenterShow)
		generator.messageTitle(item.getName() + StringTable.ItemLost, 0, 0, true);
	},

	_isDisplayable: function(unit, item) {
		var showMessage;
		
		if (item === null) return false;	
		
		// コンフィグで「武器破損時にメッセージを表示する」にチェックが入っていない場合は表示しない
		if (!DataConfig.isWeaponLostDisplayable()) return false;
		
		// スキップモードの時は表示しない
		if (CurrentMap.isCompleteSkipMode()) return false;
				
		// プレイヤーユニット以外は表示しない
		if (unit.getUnitType() !== UnitType.PLAYER) return false;

		// アイテムのカスタムパラメータに真偽値を設定していれば、それに従う
		showMessage = item.custom.itemLostMessage;
		if (typeof showMessage === 'boolean') {
			return showMessage;
		}
		
		// アイテムタイプのカスタムパラメータに真偽値を設定していれば、それに従う
		showMessage = item.getWeaponType().custom.itemLostMessage;
		if (typeof showMessage === 'boolean') {
			return showMessage;
		}
		
		return false;
	},
	
	_getLostSoundHandle: function() {
		return root.querySoundHandle('itemlost');
	}
};

//---------------------------------------------------------------------------
// 使用したアイテムが破損していたらメッセージを表示する処理を追加する
//---------------------------------------------------------------------------

// 使用したアイテムのidを保存するメンバ変数
ItemUseParent._baseItemId = -1;

// アイテム破損時にメッセージを表示する処理に備えて元のアイテムのidを保存しておく
var _ItemUseParent__prepareMemberData = ItemUseParent._prepareMemberData;
ItemUseParent._prepareMemberData = function(itemTargetInfo) {
	_ItemUseParent__prepareMemberData.call(this, itemTargetInfo);
	
	this._baseItemId = this._itemTargetInfo.item.getId();
};

var _ItemUseParent__pushFlowEntries = ItemUseParent._pushFlowEntries;
ItemUseParent._pushFlowEntries = function(straightFlow) {
	_ItemUseParent__pushFlowEntries.call(this, straightFlow);
	
	straightFlow.pushFlowEntry(ItemBrokenFlowEntry);
};
	
var ItemBrokenFlowEntry = defineObject(BaseFlowEntry,
{	
	_itemUseParent: null,
	_dynamicEvent: null,
	
	enterFlowEntry: function(itemUseParent) {
		this._prepareMemberData(itemUseParent);
		return this._completeMemberData(itemUseParent);
	},
	
	moveFlowEntry: function() {
		if (this._itemUseParent.isItemSkipMode()) {
			return MoveResult.END;
		}
		
		return this._dynamicEvent.moveDynamicEvent();
	},
	
	_prepareMemberData: function(itemUseParent) {
		this._itemUseParent = itemUseParent;
		this._dynamicEvent = createObject(DynamicEvent);
	},
	
	_completeMemberData: function(itemUseParent) {
		var generator;
		var itemTargetInfo = this._itemUseParent.getItemTargetInfo();
		var unit = itemTargetInfo.unit;
		var item = itemTargetInfo.item;
		var baseItem = root.getBaseData().getItemList().getDataFromId(this._itemUseParent._baseItemId);
		
		// 先行する処理で既にアイテムが破損している時、「破損時アイテム」が設定されているとitemTargetInfo.itemが置換されてカスタムパラメータが想定通りに取得できない
		// そのためベースデータから取得したアイテムで判定している
		if (!ItemLostMessageControl._isDisplayable(unit, baseItem)) {
			return EnterResult.NOTENTER;
		}
		
		// 本来、アイテムの使用回数を減らす処理はItemUseParentのstraightFlowが全て終わった（またはフローに入らなかった）際に実行される
		// アイテム破損時のメッセージ表示をstraightFlowに追加したので、このタイミングで使用回数を減らす処理を入れる
		if (!this._itemUseParent._isItemDecrementDisabled) {
			this._itemUseParent.decreaseItem();
			
			// アイテムを減らしたのでその旨を記録しておく
			this._itemUseParent.disableItemDecrement();
		}
		
		// 「耐久無限でないアイテムの耐久が0である または 破損状態が設定されている」なら破損時メッセージを表示する
		if (ItemControl.isItemBroken(item) || item.getLimit() === WeaponLimitValue.BROKEN) {
			generator = this._dynamicEvent.acquireEventGenerator();
			
			ItemLostMessageControl.showMassageTitle(unit, baseItem, generator);
			
			return this._dynamicEvent.executeDynamicEvent();
		}
		
		return EnterResult.NOTENTER;
	}
}
);


//---------------------------------------------------------------------------
// ユニットコマンド「扉、宝箱」経由で鍵アイテムを使用した際に破損時のメッセージ処理を追加する
//---------------------------------------------------------------------------
var _KeyNavigator__pushFlowEntries = KeyNavigator._pushFlowEntries;
KeyNavigator._pushFlowEntries = function(straightFlow) {
	_KeyNavigator__pushFlowEntries.call(this, straightFlow);
	
	straightFlow.pushFlowEntry(ItemBrokenFlowEntry_KeyNavigator);
};

var ItemBrokenFlowEntry_KeyNavigator = defineObject(BaseFlowEntry,
{	
	_keyNavigator: null,
	_dynamicEvent: null,
	
	enterFlowEntry: function(keyNavigator) {
		this._prepareMemberData(keyNavigator);
		return this._completeMemberData(keyNavigator);
	},
	
	moveFlowEntry: function() {
		if (CurrentMap.isCompleteSkipMode()) {
			return MoveResult.END;
		}
		
		return this._dynamicEvent.moveDynamicEvent();
	},
	
	_prepareMemberData: function(keyNavigator) {
		this._keyNavigator = keyNavigator;
		this._dynamicEvent = createObject(DynamicEvent);
	},
	
	_completeMemberData: function(keyNavigator) {
		var generator, baseItem;
		var unit = this._keyNavigator.getUnit();
		var keyData = this._keyNavigator.getKeyData();
		var item = keyData.item;
		
		// スキルで鍵開けをした時やそもそも鍵が不要な場合itemはnull
		if (item === null) {
			return EnterResult.NOTENTER;
		}
				
		// 鍵アイテムをユニットコマンド経由で使用する場合は、先行するKeyTrophyFlowEntryで鍵の耐久を減らす処理が実行されている
		// 「破損時アイテム」が設定されているとKeyDataのitemが置換されてカスタムパラメータが想定通りに取得できないのでベースデータから取得したアイテムで判定している
		baseItem = root.getBaseData().getItemList().getDataFromId(keyData.baseId);
		
		if (!ItemLostMessageControl._isDisplayable(unit, baseItem)) {
			return EnterResult.NOTENTER;
		}

		if (ItemControl.isItemBroken(item) || item.getLimit() === WeaponLimitValue.BROKEN) {
			generator = this._dynamicEvent.acquireEventGenerator();
			
			ItemLostMessageControl.showMassageTitle(unit, baseItem, generator);
			
			return this._dynamicEvent.executeDynamicEvent();
		}

		return EnterResult.NOTENTER;
	}
}
);

// 鍵アイテムを使用する際にidを保存しておく
var _KeyEventChecker_buildKeyDataItem = KeyEventChecker.buildKeyDataItem;
KeyEventChecker.buildKeyDataItem = function(item, requireFlag) {
	var keyData = _KeyEventChecker_buildKeyDataItem.call(this, item, requireFlag);
	
	if (keyData !== null) {
		keyData.baseId = item.getId();
	}
	
	return keyData;
};


})();