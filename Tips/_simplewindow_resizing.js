/*
■ファイル名
_simplewindow_resizing.js

■SRPG Studio対応バージョン
ver.1.318

■プラグインの概要
ユニットシンプルウィンドウとマップ上に表示されるユニット情報ウィンドウの大きさを変更します

■使用方法
1.このプラグインをpluginフォルダに入れる
2.本プラグイン内の設定項目で該当する数値を変更する

■変更されない場合は？
他のプラグインと競合している可能性があります。
ファイル名を変えて読み込み順を変更するか、
競合プラグインと処理をまとめることで対応してください。

■作成者
ran

■更新履歴
2026/01/18 新規作成


*/


(function() {
	
//-----------------------------------------------------
// 設定項目
//-----------------------------------------------------	

var WindowSizeSetting = {
	// マップ上のユニット情報ウィンドウの幅 	// 本来の値:252(220+16*2)
	UNITINFOWIDTH: 252
	// マップ上のユニット情報ウィンドウの高さ	// 本来の値: 104
,	UNITINFOHEIGHT: 104

	// ユニットシンプルウィンドウの幅 // 本来の値:252(220+16*2)
,	UNITSIMPLEWIDTH: 252
	// ユニットシンプルウィンドウの高さ // 本来の値: 104
,	UNITSIMPLEHEIGHT: 104
};

//-----------------------------------------------------	
// マップ上に表示されるユニット情報のウィンドウの大きさを変更する
//-----------------------------------------------------	
MapParts.UnitInfo._getWindowWidth = function() {
//	return ItemRenderer.getItemWindowWidth();

	return WindowSizeSetting.UNITINFOWIDTH;
};
	
MapParts.UnitInfo._getWindowHeight = function() {
//	return DefineControl.getFaceWindowHeight();

	return WindowSizeSetting.UNITINFOHEIGHT;
};

//-----------------------------------------------------	
// ユニットシンプルウィンドウの大きさを変更する
// 主にユニット整理メニューで表示されるウィンドウです
//-----------------------------------------------------	
UnitSimpleWindow.getWindowWidth = function() {
//	return ItemRenderer.getItemWindowWidth();

	return WindowSizeSetting.UNITSIMPLEWIDTH;
};
	
UnitSimpleWindow.getWindowHeight = function() {
//	return DefineControl.getFaceWindowHeight();

	return WindowSizeSetting.UNITSIMPLEHEIGHT;
};
	
})();
