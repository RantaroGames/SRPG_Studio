// ver1.288で能力値が1つも上昇しない場合はドーピングアイテムが使用不可になるように仕様変更になった
// DopingItemControlクラスが新規に作成されている
// 経験値だけを入手するアイテムを使用できるようにする処理を追加

(function() {

var _DopingItemControl_isItemAllowed = DopingItemControl.isItemAllowed;
DopingItemControl.isItemAllowed = function(targetUnit, item) {
	// 経験値を入手できるなら使用可能
	if (item.getExp() > 0 && targetUnit.getLv() < Miscellaneous.getMaxLv(targetUnit)) {
		return true;
	}
	
	return _DopingItemControl_isItemAllowed.call(this, targetUnit, item);
};

})();

