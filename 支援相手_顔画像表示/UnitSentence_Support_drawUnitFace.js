/*
■ファイル
UnitSentence_Support_drawUnitFace.js

■SRPG Studio対応バージョン:1.270

■プラグインの概要
UnitSentenceWindowの「支援相手」表示欄にユニットの顔画像を縮小表示します。

■使用方法
1.このファイルをpluginフォルダに入れる

※画像のサイズや表示位置を変更したい場合は下記コード内「設定項目」の該当箇所を変更してください。

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2022/10/23 新規作成

*/

(function() {

//------------------------------------------
// 設定項目
//------------------------------------------

// 表示する顔画像のサイズ(幅, 高さ)
var FaceImageWidth = 24;
var FaceImageHeight = 24;

// 顔画像の描画開始位置のx座標補正値
var ImagePosX = 12;

// 支援相手の名前表示開始x座標補正
var NamePosX = 20;
	
// 一行当たりの表示域の高さ(規定値は25)
// 顔画像のサイズをICONサイズ(24)より大きくした場合、行の高さを変更しないと画像が重なって表示されます
var UnitSentenceSpaceY = 25; //this._unitSentenceWindow.getUnitSentenceSpaceY();

// センテンスウィンドウの幅を広げたい場合
var WidthExtension = 0;
//------------------------------------------

// 支援相手を表示するオブジェクト(オーバーライド)
UnitSentence.Support.drawUnitSentence = function(x, y, unit, weapon, totalStatus) {
	var i, count, data, targetUnit;
	var textui = this.getUnitSentenceTextUI();
	var color = ColorValue.KEYWORD;
	var font = textui.getFont();
	var length = this._getTextLength();
	
	TextRenderer.drawKeywordText(x, y, StringTable.UnitSentence_Support, length, color, font);
	
	y += this._unitSentenceWindow.getUnitSentenceSpaceY();
	
	count = unit.getSupportDataCount();
	for (i = 0; i < count; i++) {
		data = unit.getSupportData(i);
		targetUnit = data.getUnit();
		if (targetUnit !== null && data.isGlobalSwitchOn() && data.isVariableOn()) {
			// 顔画像を縮小表示する処理
			func_drawShrinkFace(x - ImagePosX, y, targetUnit.getFaceResourceHandle(), FaceImageWidth, FaceImageHeight);
			
			// 支援相手の名前を表示する処理
			TextRenderer.drawKeywordText(x + NamePosX, y, targetUnit.getName(), length, color, font);
			
			// 次の行の描画開始y座標を設定する
			y += UnitSentenceSpaceY;
		}
	}
};

// (描画先のx座標, y座標, リソースハンドル, 描画先の幅, 描画先の高さ)
function func_drawShrinkFace(xDest, yDest, handle, destWidth, destHeight)
{
	var pic = GraphicsRenderer.getGraphics(handle, GraphicsType.FACE);
	if (pic === null) return;
	
	var xSrc, ySrc;
	var srcWidth = GraphicsFormat.FACE_WIDTH;
	var srcHeight = GraphicsFormat.FACE_HEIGHT;
	
	if (root.isLargeFaceUse() && pic.isLargeImage()) {
		srcWidth = root.getLargeFaceWidth();
		srcHeight = root.getLargeFaceHeight();
	}
	
	xSrc = handle.getSrcX() * srcWidth;
	ySrc = handle.getSrcY() * srcHeight;
	
	//　(描画先x, y, 拡大/縮小した幅, 高さ, 描画元のx座標(リソース上のx座標×画像タイプの幅), y座標, 描画元の幅, 高さ)
	pic.drawStretchParts(xDest, yDest, destWidth, destHeight, xSrc, ySrc, srcWidth, srcHeight);
}

// センテンスウィドウの幅を補正する
var _UnitSentenceWindow_getWindowWidth = UnitSentenceWindow.getWindowWidth;
UnitSentenceWindow.getWindowWidth = function() {
	return _UnitSentenceWindow_getWindowWidth.call(this) + WidthExtension;
};

})();
