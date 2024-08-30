/*
■ファイル
SelectScrollbar_cahgeImage.js

■SRPG Studio対応バージョン:1.301

■プラグインの概要
イベントコマンド <選択肢の表示> で選択中の項目の画像を任意の物に置き換えます。
これにより、現在選択中の項目を視認し易くなることが期待できます。

本体スクリプトver.1.301から選択中の項目をハイライト表示する機能が追加されました。
これに伴い、本プラグイン内で設定項目をいくつか追加しています。

■使用方法
1.このファイルをpluginフォルダに入れる

2.Materialフォルダに変更画像用のフォルダとファイルを作成する

フォルダ名とファイル名を任意に設定した場合は、下記コード内の
(フォルダ名) 'SelectScrollbarTitle' と (ファイル名) '巨大_offitial改変.png' を書き換えてください。(名前は''で括ります)

本プラグインで用意したフォルダと画像を使用する場合は、$SelectScrollbarTitleの$を外してMaterialフォルダにコピーしてください
(画像は公式UIの画像「巨大.png」を改変しています。この画像のみの再配布は避けてください)

3.本プラグイン内の設定項目を適宜変更する

■UIの画像規格について
公式ユーザー・マニュアルの素材規格ページから引用
『
Title
テキストを強調して表示するための見出し画像です。1つの画像のサイズは90×60であり、パーツのサイズは30×60です。文字の長さだけ中央の画像が表示される回数が増えます。
』

独自の画像を用意する場合は、上記の規格に則った形式で画像を作成してください。
この画像は、「30×60」のパーツ３つで構成され(□■□)、中央のパーツが文字数に応じて繰り返されます。(例：□■■■■□)

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2022/05/25 新規作成
2024/08/30 本体Ver.1.301対応 および テキスト表示に関する設定項目追加

*/

(function() {

//-------------------------------
// 設定項目
//-------------------------------

// Materialフォルダーに作成したフォルダ名とファイル名(拡張子付き)を記述する
var GetMaterialImage = {
	Folder: 'SelectScrollbarTitle',
	File:  '巨大_offitial改変.png'
};

// 選択中の項目をハイライト表示するか否か
var isHighlightAllowed = true;

// ハイライト表示する際に被せる色(16進数表記のカラーコード）
var HighlightColor = 0xffeeff;

// ハイライト表示のアルファ値(0-255)
var HighlightAlpha = 64;

// 選択中の項目テキストカラー(テキストUIで設定したカラーで良いなら null )
var SelectedTextColor = null; //0xffee00;

//-------------------------------

//---------------------
// キャッシュ画像用
//---------------------
var SelectTitleImage = null;
var ScriptVersion = 0;

// ゲーム開始時に画像データを保持しておく
var _SetupControl_setup = SetupControl.setup
SetupControl.setup = function() {
	_SetupControl_setup.call(this);
	
	ScriptVersion = root.getScriptVersion();
	
	if (SelectTitleImage === null) {
		SelectTitleImage = root.getMaterialManager().createImage(GetMaterialImage.Folder, GetMaterialImage.File);
	}
};

if (ScriptVersion >= 1301) {
	SelectScrollbar._getHighlightColor = function() {
		// 本来の処理	return 0xffeeff;
		return HighlightColor;
	};

	SelectScrollbar._getHighlightAlpha = function() {
		// 本来の処理	return 64;
		return HighlightAlpha;
	};
}

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
		var color = SelectedTextColor !== null ? SelectedTextColor : textui.getColor();
		var font = textui.getFont();
//		var pic = textui.getUIImage();
		var count = this._getCount();
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		var textWidth = TextRenderer.getTextWidth(object.text, font);
		var textHeight = TextRenderer.getTextHeight(object.text, font);
				
		// Materialフォルダに作成したファイルから画像を取得する
		// 画像の取得に失敗した場合は、元の画像(リソース使用箇所>テキストUI>選択肢見出し)を使用する
		var pic = SelectTitleImage !== null ? SelectTitleImage : textui.getUIImage();
		
		// 本体スクリプトバージョン1301未満ならハイライト表示無しでタイトルUI描画
		if (ScriptVersion < 1301) {
			TitleRenderer.drawTitle(pic, x, y, width, height, count);
		}
		else {
			if (isHighlightAllowed) {
				TitleRenderer.drawhHiglightTitle(pic, x, y, width, height, count, this._getHighlightColor(), this._getHighlightAlpha());
			}
			else {
				TitleRenderer.drawTitle(pic, x, y, width, height, count);
			}
		}
		
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
