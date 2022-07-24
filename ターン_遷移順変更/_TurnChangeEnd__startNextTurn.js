/*
■ファイル
_TurnChangeEnd__startNextTurn.js

■SRPG Studio対応バージョン:1.262

■プラグインの概要
ターンサイクルの順番を自軍→同盟軍→敵軍→自軍…に変更します。

■使用方法
1.このファイルをpluginフォルダに入れる

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2022/07/24 新規作成
*/

(function() {
//------------------------------
//ターン順番変更 自軍→同盟→敵→自軍…
//------------------------------
TurnChangeEnd._startNextTurn = function() {
	var nextTurnType;
	var turnType = root.getCurrentSession().getTurnType();
	
	this._checkActorList();
	
	if (turnType === TurnType.PLAYER) {
		nextTurnType = TurnType.ALLY;
	}
	else if (turnType === TurnType.ENEMY) {
		nextTurnType = TurnType.PLAYER;
	}
	else {
		nextTurnType = TurnType.ENEMY;
	}
	
	root.getCurrentSession().setTurnType(nextTurnType);
};

})();
