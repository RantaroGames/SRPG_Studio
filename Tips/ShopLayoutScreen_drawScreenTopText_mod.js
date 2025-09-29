/*-------------------------------------------------------------------------------------------
ショップレイアウトの上フレーム画像の表示位置を変更する
対応しているショップ画面は（戦闘準備、マップ内、拠点）とショップ一覧（拠点で複数ショップを設定している場合）

フレームとテキストの描画位置を変更するには、下プラグイン内設定項目の数値を記述する
-------------------------------------------------------------------------------------------*/

(function() {

/*---------------------------------
 設定項目
---------------------------------*/
// フレーム画像描画開始x座標
var FRAME_POSX = 0;
// フレーム画像y座標
var FRAME_POSY = 0;
// フレーム内テキストの描画開始x座標
var TEXT_POSX = 105;
// テキストｙ座標
var TEXT_POSY = 0;
	
/*-------------------------------------------------------------------------------------------
 スクリーンの上フレームの画像とテキスト描画用メソッド
 元のメソッドではフレーム画像の幅を基に中央表示していた処理を任意の数値で描画開始座標を指定するようにしている
-------------------------------------------------------------------------------------------*/
TextRenderer.drawScreenTopTextEX = function(text, textui) {
	var range;
	var x = FRAME_POSX; //LayoutControl.getCenterX(-1, UIFormat.SCREENFRAME_WIDTH);
	var y = FRAME_POSY;
	var color = textui.getColor();
	var font = textui.getFont();
	var pic = textui.getUIImage();
	
	if (pic !== null) {	
		pic.draw(x, y);
		
		// テキスト描画の範囲を開始指定座標と上フレーム画像の幅（UIFormat.SCREENFRAME_WIDTH = 640）と任意の高さ（45）から求める
		range = createRangeObject(x + TEXT_POSX, y + TEXT_POSY, UIFormat.SCREENFRAME_WIDTH, 45);
		// 範囲内に左詰めでテキストを描画する処理
		TextRenderer.drawRangeText(range, TextFormat.LEFT, text, -1, color, font);
	}
};


/*-----------------------------------------------------------------------------------
 ショップスクリーンの上フレームの表示を独自のものに変更する
 ShopLayoutScreenクラスを変更している他のスクリプトと競合する場合は、以下の処理をマージすること
-----------------------------------------------------------------------------------*/
ShopLayoutScreen.drawScreenTopText = function(textui) {
	if (textui === null) {
		return;
	}
	
	// フレーム画像の描画位置を任意に指定できるようにしたメソッド
	TextRenderer.drawScreenTopTextEX(this.getScreenTitleName(), textui);
	
	// 本来の表示用メソッド
//	TextRenderer.drawScreenTopText(this.getScreenTitleName(), textui);
};


/*-----------------------------------------------------------------------------------
 ショップ一覧スクリーン（拠点）の上フレーム表示を独自のものに変更する（不要な場合は削除またはコメントアウト）
 ShopListScreenクラスを変更している他のスクリプトと競合する場合は、以下の処理をマージすること
-----------------------------------------------------------------------------------*/
ShopListScreen.drawScreenTopText = function(textui) {
	if (textui === null) {
		return;
	}
	
	// フレーム画像の描画位置を任意に指定できるようにしたメソッド
	TextRenderer.drawScreenTopTextEX(this.getScreenTitleName(), textui);
	
	// 本来の表示用メソッド
//	TextRenderer.drawScreenTopText(this.getScreenTitleName(), textui);
};

})();
