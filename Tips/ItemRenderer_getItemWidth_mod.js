/*-----------------------------------------------------
// アイテム名が長い場合に枠からはみ出す問題に雑に対応する方法
// 改変しないメソッドは、消すかコメントアウトしてください
-----------------------------------------------------*/

(function() {

// 雑な対策1 アイテム名を表示できる幅を減らす
// 幅を小さくすると文字の大きさをゲームエンジン側が調節してくれる
// 注意点。幅に対して文字が長すぎる（フォントが大きすぎる）と表示が消える
var alias01 = ItemRenderer._getTextLength;
ItemRenderer._getTextLength = function() {
//	return this.getItemWidth() - 15;
	// 設定した数値分、幅を減らします
	return alias01.call(this) - 0;
};

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
	
})();
