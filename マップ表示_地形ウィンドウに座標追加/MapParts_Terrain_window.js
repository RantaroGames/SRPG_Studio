/*
■ファイル
MapParts_Terrain_window.js

■SRPG Studio対応バージョン:1.248

■プラグインの概要
マップの地形情報に地形の座標を表示

■使用方法
1.このファイルをpluginフォルダに入れる

※ウィンドウ上で座標の描画位置を調整したい場合はプラグイン内のdx,dyの数値を任意に変更してください
※座標の文字色を変更したい場合は、colorの値を16進数のカラーコードで任意に指定してください

■作成者
ran
*/

(function() {

var alias1 = MapParts.Terrain._drawContent;
MapParts.Terrain._drawContent = function(x, y, terrain) {
	if (terrain === null) return;	
	alias1.call(this, x, y, terrain);
	
	//座標描画
	var xCursor = this.getMapPartsX();
	var yCursor = this.getMapPartsY();
	var textui = this._getWindowTextUI();
	var font = textui.getFont();
	var color = 0xf9f09d; //16進数カラーコードで色を指定することも可能
	var coord = '(' + xCursor + ',' + yCursor + ')';
	var dx = 70; //x軸補正
	var dy = 0; //ｙ軸補正
	
	TextRenderer.drawText(x + dx, y + dy, coord, -1, color, font);
};

})();