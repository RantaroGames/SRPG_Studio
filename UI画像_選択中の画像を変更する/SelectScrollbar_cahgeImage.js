/*
■ファイル
SelectScrollbar_cahgeImage.js

■SRPG Studio対応バージョン:1.259

■プラグインの概要
イベントコマンド <選択肢の表示> で選択中の項目の画像を任意の物に置き換えます。
これにより、現在選択中の項目を視認し易くなることが期待できます。

■使用方法
1.このファイルをpluginフォルダに入れる

2.Materialフォルダに変更画像用のフォルダとファイルを作成する

フォルダ名とファイル名を任意に設定した場合は、下記コード内の
(フォルダ名) 'SelectScrollbarTitle'　と　(ファイル名) '巨大_offitial改変.png'　を書き換えてください。(名前は''で括ります)

本プラグインで用意したフォルダと画像を使用する場合は、$SelectScrollbarTitleの$を外してMaterialフォルダにコピーしてください
(画像は公式UIの画像「巨大.png」を改変しています。この画像のみの再配布は避けてください)

■UIの画像規格について
公式ユーザー・マニュアルの素材規格ページから引用
『
Title
テキストを強調して表示するための見出し画像です。1つの画像のサイズは90×60であり、パーツのサイズは30×60です。文字の長さだけ中央の画像が表示される回数が増えます。
』

独自の画像を用意する場合は、上記の規格に則った形式で画像を作成してください。
この画像は、「30×60」のパーツ３つで構成され(□■□)、中央のパーツが繰り返されます。(例：□■■■■□)

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2022/05/25 新規作成
*/

(function() {

// Materialフォルダーに作成したフォルダ名とファイル名(拡張子付き)を記述する
var GetMaterialImage = {
	Folder: 'SelectScrollbarTitle',
	File:  '巨大_offitial改変.png'
};

// 選択中の項目は、画像をMaterialフォルダに作成した物に置き換える
var _SelectScrollbar_drawScrollContent = SelectScrollbar.drawScrollContent;
SelectScrollbar.drawScrollContent = function(x, y, object, isSelect, index) {
	
	if (!isSelect) {
		// 選択中以外の項目は、元の処理
		_SelectScrollbar_drawScrollContent.call(this, x, y, object, isSelect, index);
	}
	else {
		// 以下は、本来の処理でpicの取得処理を変更している
		var dx, dy;
		var textui = this.getScrollTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
//		var pic = textui.getUIImage();
		var count = this._getCount();
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		var textWidth = TextRenderer.getTextWidth(object.text, font);
		var textHeight = TextRenderer.getTextHeight(object.text, font);
		
		// Materialフォルダに作成したファイルから画像を取得する
		// 画像の取得に失敗した場合は、元の画像(リソース使用箇所>テキストUI>選択肢見出し)を使用する
		var pic = root.getMaterialManager().createImage(GetMaterialImage.Folder, GetMaterialImage.File);
		if (pic === null) pic = textui.getUIImage();
		
		TitleRenderer.drawTitle(pic, x, y, width, height, count);
		
		if (!object.handle.isNullHandle()) {
			dx = Math.floor((this.getObjectWidth() - (textWidth + GraphicsFormat.ICON_WIDTH + 4)) / 2);
			dy = Math.floor((height - GraphicsFormat.ICON_HEIGHT) / 2);
			GraphicsRenderer.drawImage(x + dx, y + dy, object.handle, GraphicsType.ICON);
			
			dx += GraphicsFormat.ICON_WIDTH + 4;
		}
		else {
			dx = Math.floor((this.getObjectWidth() - textWidth) / 2);
		}
		
		dy = Math.floor((height - textHeight) / 2);
		TextRenderer.drawText(x + dx, y + dy, object.text, -1, color, font);
	}
};

})();
