/*
■ファイル
EasyAttackWindow_drawAttackStatus.js

■プラグインの概要
　簡易戦闘時、マップ上のウィンドウに「攻撃/命中/必殺値」を表示します

■使用方法
　このファイルをpluginフォルダに入れる

■SRPG Studio対応バージョン:1.248

■作成者
ran

■更新履歴
2021/11/19 作成
2022/04/10 変数宣言ミスの修正

*/


(function() {

//簡易戦闘表示ウィンドウの高さを増やす
EasyAttackWindow.getWindowHeight = function() {
	return 110;//100;
};

// 簡易戦闘ウィンドウに表示する戦闘数値を保存する配列
EasyAttackWindow._attackStatusArr = null;

EasyAttackWindow._setAttackStatus = function(arr) {
	this._attackStatusArr = arr;
};

var alias_001EAW = EasyAttackWindow.drawWindowContent;
EasyAttackWindow.drawWindowContent = function(x, y) {
	alias_001EAW.call(this, x, y - 8);
	this._drawAttackInfoArea(x - 10, y + 64);
};

EasyAttackWindow._drawAttackInfoArea = function(x, y) {
	var color = ColorValue.KEYWORD;
	var font = TextRenderer.getDefaultFont();
	var space = 12;

	StatusRenderer.drawAttackStatus(x, y, this._attackStatusArr, color, font, space);
};

//-------------------------------
//簡易戦闘画面で攻撃/命中/必殺表示
//-------------------------------
EasyAttackMenu._statusSrc = null;
EasyAttackMenu._statusDest = null;

var alias_EasyAttackMenu = EasyAttackMenu.setMenuUnit;
EasyAttackMenu.setMenuUnit = function(unitSrc, unitDest) {
	alias_EasyAttackMenu.call(this, unitSrc, unitDest);
	
	var isLeft = Miscellaneous.isUnitSrcPriority(unitSrc, unitDest);
	
	this._statusSrc = f_getAttackStatus(unitSrc, unitDest, true);
	this._statusDest = f_getAttackStatus(unitSrc, unitDest, false);
	
	if (isLeft) {
		this._leftWindow._setAttackStatus(this._statusSrc);
		this._rightWindow._setAttackStatus(this._statusDest);
	} else {
		this._leftWindow._setAttackStatus(this._statusDest);
		this._rightWindow._setAttackStatus(this._statusSrc);
	}
};


// AttackStatusを取得する関数
// UIBattleLayout._getAttackStatus関数とほぼ同じ
function f_getAttackStatus(unit, targetUnit, isSrc)
{
	var arr, weapon, isCounterattack;
	
	if (isSrc) {
		weapon = BattlerChecker.getRealBattleWeapon(unit);
		arr = AttackChecker.getAttackStatusInternal(unit, weapon, targetUnit);
	}
	else {
		isCounterattack = AttackChecker.isCounterattack(unit, targetUnit);
		if (isCounterattack) {
			weapon = BattlerChecker.getRealBattleWeapon(targetUnit);
			arr = AttackChecker.getAttackStatusInternal(targetUnit, weapon, unit);
		}
		else {
			arr = AttackChecker.getNonStatus();
		}
	}
	
	return arr;
}


})();
