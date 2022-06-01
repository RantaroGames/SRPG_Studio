/*
■ファイル
TurnLogo_isTurnGraphicsDisplayable.js

■SRPG Studio対応バージョン:1.248

■プラグインの概要
任意のグローバルスイッチが「オン」の場合、ターン開始時の画像（リソース使用箇所>UI>自軍ターンで指定する画像等）を表示しないようにします
イベントマップなどでターン開始時の画像を表示させたくない場合などにスイッチを操作してください

■使用方法
1.このファイルをpluginフォルダに入れる
2.変数「GLOBALSWITCH_ID」に数値（＝画像表示を制御するためのグローバルスイッチid)を設定する

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

*/

(function() {

// ターン開始表示を制御するグローバルスイッチのid
// idの指定が不正の場合、エディタのリスト上で一番上(index0)のスイッチが判定対象になります（isSwitchOn（index）関数の仕様である模様）
var GLOBALSWITCH_ID = 0;


// グローバルスイッチが「オン」の場合、ターン開始時の画像(またはアニメ)を表示しない
// 元の処理は、ターン勢力のユニット数が0(および、アニメ未設定)の場合に画像処理を行わないようになっています
var alias_001 = BaseTurnLogoFlowEntry._isTurnGraphicsDisplayable;
BaseTurnLogoFlowEntry._isTurnGraphicsDisplayable = function() {
	var result = alias_001.call(this);
	var table, index;
	
	// 元処理でfalseの場合＝開始ターンの勢力がユニット数0である場合
	if (!result) return result;
	
	table = root.getMetaSession().getGlobalSwitchTable();
	index = table.getSwitchIndexFromId(GLOBALSWITCH_ID);
	
	return !table.isSwitchOn(index);
};

})();