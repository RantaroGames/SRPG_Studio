/*
■ファイル名
MapSymbolDecorator_mod.js

■SRPG Studio対応バージョン
ver.1.316

■プラグインの概要
マップシンボル（ユニットの所属を示すシンボル）に関する設定項目を追加して調整し易くします。

追加機能
・シンボルに輪郭を描画する

■使用方法
1.本プラグインをpluginフォルダに入れる
2．本プラグイン内の設定項目の任意に変更する

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md


■更新履歴
2025/08/04 新規作成

*/

(function() {

//---------------------------------------------------------------------
// マップシンボルの描画に関する設定
//---------------------------------------------------------------------
var MapSymbol = {
	// 塗り潰し色を指定する配列[自軍カラー, 敵軍カラー, 同盟軍カラー]
	FILLCOLOR_ARRAY: [0x5732ec, 0xf0312d, 0x31e640]
	// 塗り潰し色のアルファ値(0-255の数値)
,	FILLCOLOR_ALHPA: 140
	// 楕円の長軸
,	WIDTH: 32
	// 楕円の短軸
,	HEIGHT: 18
	// 描画位置の調整
,	POS_DX: 0
,	POS_DY: 0

	// クラス(キャラチップ)のサイズがLサイズ以上の場合のシンボルのオフセット（L, LL共通。LLは大きめに調整しないとチップ自体の影に隠れて見えない）
	// x座標の補正
,	LARGESIZE_X: -2
	// y座標の補正
,	LARGESIZE_Y: 0
	// 楕円の長軸の補正
,	LARGESIZE_W: 4
	// 楕円の短軸の補正
,	LARGESIZE_H: 6

	// シンボルに輪郭を描画する true / しない false
,	STROKEDRAW: false
	// 輪郭の色の配列[自軍カラー, 敵軍カラー, 同盟軍カラー]
,	STROKECOLOR_ARRAY: [0x2743d2, 0xe22b30, 0xb4e04b]
	// 輪郭の色のアルファ値(0-255の数値)
,	STROKECOLOR_ALPHA: 255
	// 輪郭のドットサイズ
,	STROKECOLOR_WEIGHT: 1
	// 輪郭を下地より先に描画する true / しない false
,	STROKEFIRST: false
};


//-----------------------------------------------------------------
// シンボルの描画方法を指定してgame.exeに渡す
//-----------------------------------------------------------------
MapSymbolDecorator._setupDecorationFromType = function(type) {
	var obj = root.getSymbolDecoration(type);
	var color = this._getColor(type);
	var alpha = this._getAlpha(type);
	var pos = this._getPos();
	var width = MapSymbol.WIDTH;
	var height = MapSymbol.HEIGHT;
	
	obj.beginDecoration();
	
	if (EnvironmentControl.isMapUnitSymbol()) {
		
		// 塗り潰す色の設定を追加する
		obj.setFillColor(color, alpha);
		
		// 輪郭を描画する指定にしていれば、設定を追加する
		if (MapSymbol.STROKEDRAW) {
			obj.setStrokeInfo(MapSymbol.STROKECOLOR_ARRAY[type], MapSymbol.STROKECOLOR_ALPHA, MapSymbol.STROKECOLOR_WEIGHT, MapSymbol.STROKEFIRST);
		}
		
		// Lサイズ以上のオフセットを追加する
		obj.setLargeSize(MapSymbol.LARGESIZE_X, MapSymbol.LARGESIZE_Y, MapSymbol.LARGESIZE_W, MapSymbol.LARGESIZE_H);
		
		// 楕円を描画する処理を追加する
		obj.addEllipse(pos.x + MapSymbol.POS_DX, pos.y + MapSymbol.POS_DY, width, height);
	}
	
	obj.endDecoration();
};

MapSymbolDecorator._getColor = function(type) {
	return MapSymbol.FILLCOLOR_ARRAY[type];
};
	
MapSymbolDecorator._getAlpha = function(type) {
	return MapSymbol.FILLCOLOR_ALHPA;
};

})();
