/*
■ファイル名
screen-unitsummary_mod.js

■SRPG Studio対応バージョン
ver.1.295

■プラグインの概要
スクリーン：ユニット概要に情報を追加します
主にテストプレイ時にユニットの状態を確認したい時に利用することを念頭に置いています

追加されるユニット情報
・map座標
・現在HP
・フュージョン情報（救出/捕獲 している/されている 親（子）の座標）

■使用方法
1.このプラグインをpluginフォルダに入れる
2.ツールバー > ゲームレイアウト > コマンドレイアウト > 「ユニット概要」の項目を表示させる

■作成者
ran
	
■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2024/06/09 新規作成

*/

(function() {
	
// 一行の高さを大きくしたのでウィンドウ全体のレイアウトを上書きしている
UnitSummaryWindow.setSummaryWindowData = function() {
	var count = LayoutControl.getObjectVisibleCount(60, 7);//(50, 8);
	
	this._scrollbar = createScrollbarObject(UnitSummaryScrollbar, this);
	this._scrollbar.setScrollFormation(1, count);
	this._scrollbar.setActive(true);
};

// 行の高さを大きくしている
var _UnitSummaryScrollbar_getObjectHeight = UnitSummaryScrollbar.getObjectHeight;
UnitSummaryScrollbar.getObjectHeight = function() {
	return _UnitSummaryScrollbar_getObjectHeight.call(this) + 10;//50;
};

// 座標等を描画する処理を追加
var _UnitSummaryScrollbar_drawScrollContent = UnitSummaryScrollbar.drawScrollContent;
UnitSummaryScrollbar.drawScrollContent = function(x, y, object, isSelect, index) {
	_UnitSummaryScrollbar_drawScrollContent.call(this, x, y -12, object, isSelect, index);

	this._drawExContent(x, y + 30, object, isSelect, index);
};

// 座標と現在HPを描画する処理
UnitSummaryScrollbar._drawExContent = function(x, y, unit, isSelect, index) {
	var textui = this.getParentTextUI();
	var color = textui.getColor();
	var font = textui.getFont();

	TextRenderer.drawKeywordText(x + 10, y, 'x:' + unit.getMapX() + ' y:' + unit.getMapY(), -1, color, font);
	TextRenderer.drawKeywordText(x + 70, y, '現在HP: ' + unit.getHp(), -1, ColorValue.KEYWORD, font);
	
	this._drawFusionData(x + 160, y, unit, color, font);
};

// フュージョンに関する状態を描画する処理
UnitSummaryScrollbar._drawFusionData = function(x, y, unit, color, font) {
	var fusionData = FusionControl.getFusionData(unit);
	var fusionChild, fusionParent;
	var text = '';
	
	if (fusionData !== null) {
		fusionChild = FusionControl.getFusionChild(unit);
		if (fusionChild !== null) {
			text = fusionChild.getName() + 'を' + fusionData.getName() + 'している' + ' (子x:' + fusionChild.getMapX() + ' 子y:' + fusionChild.getMapY() + ')';
			TextRenderer.drawKeywordText(x, y, text, -1, color, font);
		}
				
		fusionParent = FusionControl.getFusionParent(unit);
		if (fusionParent !== null) {
			text = fusionParent.getName() + 'に' + fusionData.getName() + 'されている' + ' (親x:' + fusionParent.getMapX() + ' 親y:' + fusionParent.getMapY() + ')';
			TextRenderer.drawKeywordText(x, y, text, -1, color, font);
		}
	}
//	else {
//		TextRenderer.drawKeywordText(x, y, 'フュージョン無し', -1, color, font);
//	}
};
	
	
})();
