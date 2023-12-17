// ver1.288で能力値が1つも上昇しない場合はドーピングアイテムが使用不可になるように仕様変更になった
// この問題を雑に回避する手段として、経験値を入手できる設定であれば強制的に使用可能にする

(function() {

var _DopingItemControl_isItemAllowed = DopingItemControl.isItemAllowed;
DopingItemControl.isItemAllowed = function(targetUnit, item) {
	// 経験値を入手できるなら使用可能
	if (item.getExp() > 0) return true;
	
	return _DopingItemControl_isItemAllowed.call(this, targetUnit, item);
};

})();


