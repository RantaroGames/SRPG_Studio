/*
■ファイル名
DopingItemAvailability_isItemAllowed_add1288.js

■SRPG Studio対応バージョン
ver.1.288
※ver.1.288以前のスクリプトには対応していません

■プラグインの概要
1.対象ユニットがアイテムに設定された「レベル以下」の時のみドーピングアイテムを使用可能にする
  アイテム情報欄に「LV:XX以下のみ使用可能」という文字列を表示する
  ドーピングアイテムに使用時の経験値が設定されている場合(1以上)、アイテム情報欄に取得経験値を表示する

2.SRPG Studio(ver.1.288)で、能力値が一つも上昇しない場合はドーピングアイテムが使用できない方式に処理が変更になった
  そのため経験値のみを入手するタイプのアイテムが使用不可になってしまう問題を回避するための処理を追加した

■使用方法
このプラグインをpluginフォルダに入れる
ドーピングアイテムのカスタムパラメータに{dopingLevelCapped: 数値}を記入

■作成者
ran

■更新記録
2023/12/18 新規作成

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

*/

(function() {

// 本体ver.1.288対応（能力値が上昇しない場合でも経験値入手できるならアイテム使用可能）
var _DopingItemControl_isItemAllowed = DopingItemControl.isItemAllowed;
DopingItemControl.isItemAllowed = function(targetUnit, item) {
	var unitlv = targetUnit.getLv();
	var maxlv = Miscellaneous.getMaxLv(targetUnit);

	// レベルキャップより高レベルなら使用不可
	if (typeof item.custom.dopingLevelCapped === 'number') {
		if (unitlv > item.custom.dopingLevelCapped) return false;
	}
	
	// 経験値入手可能なら使用可能
	if (item.getExp() > 0 && unitlv < maxlv) return true;
	
	// 能力値が一つでも上昇すれば使用可能
	return _DopingItemControl_isItemAllowed.call(this, targetUnit, item);
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
		text = 'Lv:' + lvcap + '以下なら使用可能';
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