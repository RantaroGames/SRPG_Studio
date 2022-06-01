/*
■ファイル
window-unitsentence_add.js

■SRPG Studio対応バージョン:1.248

■プラグインの概要
装備している武器が物理攻撃か魔法攻撃かを判別するアイコンをユニットセンテンスウィンドウに描画します

■使用方法
1.このファイルをpluginフォルダに入れる
2.プラグインにアイコンhandle用の設定する

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2021/12/01 新規作成
2021/12/14　iconhandleの取得をdrawメソッドではなく、setCalculatorValueメソッドで取得する処理に変更
2022/04/06 武器を装備していない場合の不具合を修正

*/

(function() {

/*--------------------------------------
物理攻撃か魔法攻撃かのアイコンhandle用設定

isRuntime: ランタイムのアイコンを使用する場合true / オリジナルの場合false,
id  : アイコンのリソースid,
xSrc: リソース上のx座標(左から0,1,2,3...),
ySrc: リソース上のy座標(上から0,1,2,3...)
--------------------------------------*/

// 物理攻撃のアイコン
var Icon_isPhysics = {
	isRuntime : true,
	id        : 10,
	xSrc      : 5,
	ySrc      : 4
}

// 魔法攻撃のアイコン
var Icon_isMagic = {
	isRuntime : true,
	id        : 10,
	xSrc      : 2,
	ySrc      : 4
}


//-----------------------------------
// ユニットセンテンスウィンドウの処理
//-----------------------------------

// 武器が物理属性か魔法属性かiconhandleのフラグ
UnitSentence.Power._iconhandle = null;

var alias001 = UnitSentence.Power.setCalculatorValue
UnitSentence.Power.setCalculatorValue = function(unit, weapon, totalStatus) {
	alias001.call(this, unit, weapon, totalStatus);
	
	this._iconhandle = null;
	if (weapon !== null) {
		// root.createResourceHandle(isRuntime, id, colorIndex, xSrc, ySrc)
		if (Miscellaneous.isPhysicsBattle(weapon) === true) {
			this._iconhandle = root.createResourceHandle(Icon_isPhysics.isRuntime, Icon_isPhysics.id, 0, Icon_isPhysics.xSrc, Icon_isPhysics.ySrc);
		}
		else {
			this._iconhandle = root.createResourceHandle(Icon_isMagic.isRuntime, Icon_isMagic.id, 0, Icon_isMagic.xSrc, Icon_isMagic.ySrc);
		}
	}
};

// 攻撃の値を描画する処理
var alias002 = UnitSentence.Power.drawUnitSentence;
UnitSentence.Power.drawUnitSentence = function(x, y, unit, weapon, totalStatus) {
	var handle;
	var scaling_x = 1;
	var scaling_y = 1;
	var dx = 25;
	var dy = 0;
	
	alias002.call(this, x, y, unit, weapon, totalStatus);
	
	// 物理・魔法攻撃をアイコンで表示
//	if (this._iconhandle === null) root.log('アイコンhandleの指定が不正です');
	if (weapon !== null && this._iconhandle !== null) {
		GraphicsRenderer.drawImage(x + dx, y + dy, this._iconhandle, GraphicsType.ICON);
	}
};

})();