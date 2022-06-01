/*
■ファイル名
DopingItemAvailability_isItemAllowed_add.js

■SRPG Studio対応バージョン
ver.1.237

■プラグインの概要
対象ユニットがアイテムに設定された「レベル以下」の時のみドーピングアイテムを使用可能にする
アイテム情報欄に「LV:XX以下のみ使用可能」という文字列を表示する(文字列の設定は、100行の処理)
ドーピングアイテムに使用時の経験値が設定されている場合(1以上)、アイテム情報欄に取得経験値を表示する

■使用方法
このプラグインをpluginフォルダに入れる
ドーピングアイテムのカスタムパラメータに{dopingLevelCapped: 数値}を記入

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

*/

(function() {
/*
// カスタム条件に合致しないコンディションの時は使用不可とする処理。
// この処理を実行する場合はItemMessenger.isUsableを変更する必要はなくなる
var _ItemControl_isItemUsable = ItemControl.isItemUsable;
ItemControl.isItemUsable = function(unit, item){
	var result = _ItemControl_isItemUsable.call(this, unit, item);
	
	if (result === true && !item.isWeapon() && item.getItemType() === ItemType.DOPING){
		return DopingItemAvailability.isItemAvailableCondition(unit, item);
	}
	
	return result;
};
*/

//----------------------------------------------------------
// カスタムパラメータで設定したLV以下の場合のみ使用可能
//----------------------------------------------------------
var _DopingItemAvailability_isItemAllowed = DopingItemAvailability.isItemAllowed;
DopingItemAvailability.isItemAllowed = function(unit, targetUnit, item) {
	var result = _DopingItemAvailability_isItemAllowed(this, unit, targetUnit, item);
	var lvcap = item.custom.dopingLevelCapped;
	
	if (typeof lvcap === 'number' && lvcap > 0) {
		result = targetUnit.getLv() <= lvcap;
	}

	return result;
};

// 戦闘準備シーンの「アイテムの使用」コマンドにおける処理
var _ItemMessenger_isUsable = ItemMessenger.isUsable;
ItemMessenger.isUsable = function(unit, item) {
//	return ItemControl.isItemUsable(unit, item) && item.getTargetAggregation().isCondition(unit);
	var result = _ItemMessenger_isUsable.call(this, unit, item);
	if (result === false) return false;
	
	if (item.getItemType() === ItemType.DOPING){
		// 「アイテムの使用」で使用可能なドーピングアイテムは射程が「単体」のみなのでunitとtargetUnitは同値
		result = DopingItemAvailability.isItemAllowed(unit, unit, item);
	}
	
	return result;
};

//----------------------------------------------------------
// アイテム情報欄に取得経験値を表示する
//----------------------------------------------------------
var _DopingItemInfo_drawItemInfoCycle = DopingItemInfo.drawItemInfoCycle;
DopingItemInfo.drawItemInfoCycle = function(x, y) {
//	ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_Doping));
//	y += ItemInfoRenderer.getSpaceY();
//	ItemInfoRenderer.drawDoping(x, y, this._item, false);
	_DopingItemInfo_drawItemInfoCycle.call(this, x, y);
	
	var textui = ItemInfoRenderer.getTextUI();
	var color = textui.getColor();
	var font = textui.getFont();
	var item = this._item;
	var exp = item.getExp();
	var lvcap = typeof item.custom.dopingLevelCapped === 'number' ? item.custom.dopingLevelCapped : 0;
	var text;
	var dx = 0;
	
	y += ItemInfoRenderer.getSpaceY() * _DopingItemInfo_getInfoPartsCount.call(this);
	
	if (exp > 0) {
		text = 'EXP';
		TextRenderer.drawKeywordText(x, y, text, -1, color, font);
		dx += TextRenderer.getTextWidth(text, font) + 5;
		TextRenderer.drawSignText(x  + dx, y, ' + ');
		dx += DefineControl.getNumberSpace() + 10;
		NumberRenderer.drawRightNumber(x  + dx, y, exp);
		y += ItemInfoRenderer.getSpaceY();
	}
	
	dx = 0;
	if (lvcap > 0) {
		text = 'Lv:' + lvcap + '以下のみ使用可能';
		TextRenderer.drawKeywordText(x + dx, y, text, -1, color, font);
	}
};

var _DopingItemInfo_getInfoPartsCount = DopingItemInfo.getInfoPartsCount;
DopingItemInfo.getInfoPartsCount = function() {
//	return 1 + ItemInfoRenderer.getDopingCount(this._item, false);
	var count = _DopingItemInfo_getInfoPartsCount.call(this);
	var lvcap = this._item.custom.dopingLevelCapped;
	
	if (this._item.getExp() > 0) count++;
	if (typeof lvcap === 'number' && lvcap > 0) count++;
	
	return count;
};

})();