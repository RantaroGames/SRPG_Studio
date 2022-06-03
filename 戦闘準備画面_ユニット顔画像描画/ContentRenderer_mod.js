/*
■ファイル
ContentRenderer_mod.js

■SRPG Studio対応バージョン:1.260

■プラグインの概要
顔画像を任意のサイズで描画する処理を実装します。
さらに、この機能を利用して戦闘準備画面で表示されるユニット一覧に顔画像を描画します。

■使用方法
1.このファイルをpluginフォルダに入れる


■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2022/06/03 新規作成
*/


(function() {

//-------------------------------------------------
// 顔画像を任意のサイズで描画する処理
// 素材規格の比率は1：1なのでサイズはヨコタテ同じ長さで描画する
//-------------------------------------------------
ContentRenderer.drawStretchUnitFace = function(x, y, unit, isReverse, alpha, size) {
	var handle = unit.getFaceResourceHandle();
	var pic = GraphicsRenderer.getGraphics(handle, GraphicsType.FACE);
	
	if (pic === null) {
		return;
	}
	
	pic.setReverse(isReverse);
	pic.setAlpha(alpha);
	
	this._drawShrinkFace2(x, y, handle, pic, size);
};

ContentRenderer._drawShrinkFace2 = function(xDest, yDest, handle, pic, size) {
	var xSrc, ySrc;
	var destWidth = size;//GraphicsFormat.FACE_WIDTH;
	var destHeight = size;//GraphicsFormat.FACE_HEIGHT;
	var srcWidth = GraphicsFormat.FACE_WIDTH;//destWidth;
	var srcHeight = GraphicsFormat.FACE_HEIGHT;//destHeight;

	if (root.isLargeFaceUse() && pic.isLargeImage()) {
		srcWidth = root.getLargeFaceWidth();
		srcHeight = root.getLargeFaceHeight();
	}
	
	xSrc = handle.getSrcX() * srcWidth;
	ySrc = handle.getSrcY() * srcHeight;
	pic.drawStretchParts(xDest, yDest, destWidth, destHeight, xSrc, ySrc, srcWidth, srcHeight);
};


// プラグインの競合が発生している場合、本プラグインのUnitSelectScrollbar.drawScrollContentオブジェクトをコメントアウトして
// UnitSelectScrollbar.drawScrollContentを変更しているプラグインにマージしてください。
UnitSelectScrollbar.drawScrollContent = function(x, y, object, isSelect, index) {
	var range;
	var unit = object;
	var unitRenderParam = StructureBuilder.buildUnitRenderParam();
	var alpha = 255;
	var dx = Math.floor((this.getObjectWidth() - GraphicsFormat.CHARCHIP_WIDTH) / 2) + 16;
	var length = this._getTextLength();
	var textui = this.getParentTextUI();
	var color = textui.getColor();
	var font = textui.getFont();
	
	// 「戦闘準備画面でクラスチェンジを有効にする」場合にCC可能なユニット以外はalpha値を変更している
	if (this._selectableArray !== null && !this._selectableArray[index]) {
		alpha = 128;
	}
	
	// キャラチップの描画開始座標を調節している(dx = (130-64)/2+16 = 49)
	x += dx;
	y += 10;
	unitRenderParam.alpha = alpha;
	
	// 本来の処理（キャラチップ画像を描画する) 不要なら下記メソッドをコメントアウトしてください。
	// キャラチップも並べて描画するためにx座標を調整している(-dxの部分を追記)
	UnitRenderer.drawDefaultUnit(unit, x　- dx, y, unitRenderParam);

	// ユニット顔画像を描画する処理
	// 戦闘準備画面で描画するオブジェクトの高さは規定で80(UnitSelectScrollbar.getObjectHeight())
	// 96*96だとはみ出るので縮小して描画する。
	// dx, dyの値を変更すると顔画像の描画位置を調整できます。
	var size = 72;
	var dy = -8;
		dx = -8;

	ContentRenderer.drawStretchUnitFace(x　+ dx, y + dy, unit, false, alpha, size);
	
	// 名前を指定した範囲に描画する処理
	// 下記コードの数値(50, 30)を変更すると名前を描画する範囲の開始地点を調整できます。
	// 40は、範囲（高さ）を指定する値
	range = createRangeObject(x - 50, y + 30, length, 40);
	TextRenderer.drawRangeAlphaText(range, TextFormat.CENTER, unit.getName(), length, color, alpha, font);
};

})();
