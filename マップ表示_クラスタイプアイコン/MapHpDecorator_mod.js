/*
■ファイル名
MapHpDecorator_mod.js

■SRPG Studio対応バージョン
ver.1.316

■プラグインの概要
マップ上でユニットのHPを表示する処理に関する設定項目を追加して調整し易くします。

追加の機能
・大きな数字を使用する
・HPバーを角丸四角で描画する

■使用方法
1.本プラグインをpluginフォルダに入れる
2．本プラグイン内の設定項目の任意に変更する

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md


■更新履歴
2025/08/05 新規作成

*/

(function() {

//--------------------------------------------------------------------
// HPの表示方法を指定する設定項目
//--------------------------------------------------------------------
var MapHpDecoration = {
	// バーの横幅
	WIDTH: 32
	// バーの高さ
,	HEIGHT: 10
	// バーの色を指定する配列[HP満タン, 負傷,	 HP半分, HP四分の一]
,	COLOR: [0x00ffff, 0x00ff00, 0xffff00, 0xff0000]
	// バーのアルファ値(0-255の数値)
,	ALPHA: 204
	// 数字の色を示すインデックス（リソース使用箇所>UI>数字に対応）
,	NUMBERINDEX: 0

	// バーの描画位置補正
,	DX_BAR: 0
,	DY_BAR: 0

	// 数字の描画位置補正
,	DX_NUMBER: 0
,	DY_NUMBER: 0

	// ゲージの長さ(1か2)
,	GAUGELENGTH: 1
	// ゲージの描画位置補正
,	DX_GAUGE: 0
,	DY_GAUGE: 0

	// 輪郭の色
,	STROKE_COLOR: 0xff
	// 輪郭のアルファ値(0-255の数値)
,	STROKE_ALPHA: 255
	// 輪郭のドットサイズ
,	STROKE_SIZE: 1

	// 大きい数字を使用する:true(※1.310以降で有効）/ 従来通り: false
,	USE_BIGNUMBER: false
	// UIデータの使用箇所（ランタイム： true オリジナル: false）
,	ISRUNTIME: true
	// リソースのID
,	ID: 0

	// バーを角丸四角で描画する: true / 従来通り: false
,	USE_ROUNDEDRECTANGLE: false
	// 角を丸める際の半径（X軸、Y軸)
,	RADIUSX: 0
,	RADIUSY: 0

};

//--------------------------------------------------------------------
// HPの表示方法を指定してgame.exeに通知する
//--------------------------------------------------------------------
MapHpDecorator._setupDecorationFromType = function(type) {
	var obj = root.getHpDecoration(type);
	var pos = this._getPos();
	var width = MapHpDecoration.WIDTH;
	var height = MapHpDecoration.HEIGHT;
	var color = this._getColor(type);
	var alpha = this._getAlpha(type);
	var strokeColor = MapHpDecoration.STROKE_COLOR;
	var strokeAlpha = MapHpDecoration.STROKE_ALPHA;
	var hpType = EnvironmentControl.getMapUnitHpType();
	
	obj.beginDecoration();
	
	if (hpType === 0) {
		// addRectangleを呼び出す前に色と輪郭を設定しておく
		obj.setFillColor(color, alpha);
		obj.setStrokeInfo(strokeColor, strokeAlpha, MapHpDecoration.STROKE_SIZE, true);
		
		if (!MapHpDecoration.USE_ROUNDEDRECTANGLE) {
			obj.addRectangle(pos.x + MapHpDecoration.DX_BAR, pos.y + MapHpDecoration.DY_BAR, width, height);
		}
		else {
			obj.addRoundedRectangle(pos.x + MapHpDecoration.DX_BAR, pos.y + MapHpDecoration.DY_BAR, width, height, MapHpDecoration.RADIUSX, MapHpDecoration.RADIUSY);
		}
		
		this._addHp(obj, pos, this._getNumberColorIndex(hpType));
	}
	else if (hpType === 1) {
		obj.addGauge(pos.x + MapHpDecoration.DX_GAUGE, pos.y + MapHpDecoration.DY_GAUGE, MapHpDecoration.GAUGELENGTH);
	}
	
	obj.endDecoration();
};
	
MapHpDecorator._addHp = function(obj, pos, colorIndex) {
	if (!MapHpDecoration.USE_BIGNUMBER) {
		obj.addHp(pos.x + MapHpDecoration.DX_NUMBER, pos.y + MapHpDecoration.DY_NUMBER, colorIndex);
	}
	else {
		var list = root.getBaseData().getUIResourceList(UIType.BIGNUMBER, MapHpDecoration.ISRUNTIME);
		var pic = list.getDataFromId(MapHpDecoration.ID);
		
		if (pic !== null) {
			obj.addHpByBigNumber(pos.x + MapHpDecoration.DX_NUMBER, pos.y + MapHpDecoration.DY_NUMBER, colorIndex, pic);
		}
		else {
			root.msg('HP表示。大きい数字の指定が不正です');
		}
	}
};
	
MapHpDecorator._getColor = function(type) {		
	return MapHpDecoration.COLOR[type];
};
	
MapHpDecorator._getAlpha = function(type) {
	return MapHpDecoration.ALPHA;
};
	
MapHpDecorator._getNumberColorIndex = function(type) {
	return MapHpDecoration.NUMBERINDEX;
};
	
})();
