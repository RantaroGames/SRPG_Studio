
// ver1.288で能力値が1つも上昇しない場合はドーピングアイテムが使用不可になるように仕様変更になった
// この問題を雑に回避する手段として、経験値のみを入手するドーピングアイテムにカスタムパラメータ { expgain: true } を設定する

(function() {

var _DopingItemControl_isItemAllowed = DopingItemControl.isItemAllowed;
DopingItemControl.isItemAllowed = function(targetUnit, item) {
	if (typeof item.custom.expgain === 'boolean') {
		return item.custom.expgain;
	}
	
	return _DopingItemControl_isItemAllowed.call(this, targetUnit, item);
};

})();


