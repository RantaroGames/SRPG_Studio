/*
■ファイル
messageview_add.js

■プラグインの概要
　以下は、2つのスクリプトが含まれます
　不要なものは、コメントアウトか記述を削除してください
　
　1.メッセージウィンドウの名前(タイトル)の表示方法を変更する
　2.メッセージウィンドウの顔画像の表示方法を変更する

■使用方法
　このファイルをpluginフォルダに入れる

■SRPG Studio対応バージョン:1.220
*/


(function() {

//------------------------------------------------
//1.メッセージウィンドウの名前表示変更
//名前が8文字より多い場合、タイトルの長さを文字に合わせて延長
//------------------------------------------------
BaseMessageView.drawName = function(x, y) {
	var text = this._name;
	var textui, color, font, pic;
	
	if (text === '' || !this._isNameDisplayable) {
		return;
	}
	
	textui = this._messageLayout.getNameTextUI();
	color = textui.getColor();
	font = textui.getFont();
	pic = textui.getUIImage();
	
	if (text.length > 8) {
		TextRenderer.drawTitleText(x, y, text, color, font, TextFormat.CENTER, pic);
	} else {
		TextRenderer.drawFixedTitleText(x, y, text, color, font, TextFormat.CENTER, pic, 4);
	}
};

//------------------------------------------------
//2.メッセージウィンドウの顔画像表示変更
//「大きい顔画像を使用する」時
//素材が大きいサイズ(ファイル名に！が付くもの)と規定サイズ(96*96)が混在する場合
//規定サイズの画像を拡大せずに等倍表示して、描画位置も補正する
//------------------------------------------------
BaseMessageView.drawFace = function(xDest, yDest, isActive) {
		var pic, xSrc, ySrc;
		var destWidth = GraphicsFormat.FACE_WIDTH;
		var destHeight = GraphicsFormat.FACE_HEIGHT;
		var srcWidth = destWidth;
		var srcHeight = destHeight;
		var handle = this._faceHandle;
		var facialExpressionId = this._faceId;
		
		if (handle === null) {
			return;
		}
		
		pic = GraphicsRenderer.getGraphics(handle, GraphicsType.FACE);
		if (pic === null) {
			return;
		}
		
		var dx = 0, dy = 0;
		
		if (root.isLargeFaceUse()) {
			if (pic.isLargeImage()) {
				destWidth = root.getLargeFaceWidth();
				destHeight = root.getLargeFaceHeight();
//			if (pic.isLargeImage()) {
				srcWidth = destWidth;
				srcHeight = destHeight;
			}
			else {
				//96*96サイズの画像を等倍表示する際に表示する位置を補正する値
				//「大きい顔画像サイズ－既定の顔画像サイズ」で補正している
				//微調整したい時は、この部分を変更してください
				 dx = root.getLargeFaceWidth() - GraphicsFormat.FACE_WIDTH;
				 dy = root.getLargeFaceHeight() - GraphicsFormat.FACE_HEIGHT;
			}
		}
		
		if (facialExpressionId === 0) {
			xSrc = handle.getSrcX();
			ySrc = handle.getSrcY();
		}
		else {
			xSrc = Math.floor(facialExpressionId % 6);
			ySrc = Math.floor(facialExpressionId / 6);
		}
		
		if (this._messageLayout.isFaceReverse()) {
			pic.setReverse(true);
		}
		
		if (!isActive) {
			pic.setColor(this._getNonActiveColor(), this._getNonActiveAlpha());
		}
		
		xSrc *= srcWidth;
		ySrc *= srcHeight;
		pic.drawStretchParts(xDest + dx, yDest + dy, destWidth, destHeight, xSrc, ySrc, srcWidth, srcHeight);
	};

})();
