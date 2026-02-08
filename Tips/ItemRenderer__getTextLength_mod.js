/*-----------------------------------------------------
// アイテム名が長い場合に枠からはみ出す問題に雑に対応する方法
// 改変しないメソッドは、消すかコメントアウトしてください
// フォントによっては上手く行かない場合もあります
-----------------------------------------------------*/

(function() {

// 雑な対策1 アイテム名を表示できる幅を減らす
// 幅を小さくすると文字の大きさをゲームエンジン側が調節してくれる
// 注意点。幅に対して文字が長すぎる（フォントが大きすぎる）と表示が消える
/*
var alias01 = ItemRenderer._getTextLength;
ItemRenderer._getTextLength = function() {
//	return this.getItemWidth() - 15;
	// 設定した数値分、幅を減らします
	return alias01.call(this) - 20;
};
*/

// 雑な対策2 アイテム欄の幅を調節する
// 発生する問題。アイテムウィンドウの幅も変わるのでレイアウト（ステータス画面その他アイテム描画している画面全般）が崩れる
/* 
var alias02 = ItemRenderer.getItemWidth;
ItemRenderer.getItemWidth = function() {
//	return 220;
	// 設定した数値の分、幅が広がります
	return alias02.call(this) + 0;
};
*/

// 対策3．長い名前のアイテムはフォントを変更する
// 1．の方法はフォントによっては縮小が上手く行かないみたいです

// 長い名前を表示できるサイズに調整したフォントを設定して、idを記述してください
var FONT_ID = 11;

// フォントを切り替えるアイテム名の文字数。（設定値より長ければ小さいサイズに切り替えます）
var NAME_LENGTH = 10;

var alias03 = ItemRenderer.drawItemAlpha;
ItemRenderer.drawItemAlpha = function(x, y, item, color, font, isDrawLimit, alpha) {
	// 設定した文字数より長い名前ならfontを変更する
	if (item.getName().length > NAME_LENGTH) {
		var font = root.getBaseData().getFontList().getDataFromId(FONT_ID);
		
		// フォント不正(id間違いなどの）場合はリストの一番上を取得する
		if (font === null) {
			font = root.getBaseData().getFontList().getData(0);
		}
	}
	
	alias03.call(this, x, y, item, color, font, isDrawLimit, alpha);
};

})();
