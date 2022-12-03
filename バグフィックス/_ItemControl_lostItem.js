/*
使用方法
アイテムのカスタムパラメータに「破損時のアイテム」のidを設定してください
{
  breakedItemId: id
}

破損時のアイテムは必ず設定してください。そうしないと元アイテムの耐久が無限になってしまいます。
*/

(function() {

var _ItemControl_lostItem = ItemControl.lostItem;
ItemControl.lostItem = function(unit, item) {
	var breakedItemId = -1;

	if (typeof item.custom.breakedItemId === 'number') {
		breakedItemId = item.custom.breakedItemId;
	}
	
	if (breakedItemId >= 0) {
		if (root.getBaseData().getItemList().getDataFromId(breakedItemId) !== null) {
			item.setLimit(WeaponLimitValue.BROKEN);
			return;
		}
	}
	
	_ItemControl_lostItem.call(this, unit, item);
};

})();
