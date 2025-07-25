/*
■プラグイン内容
ユニットコマンド経由で使用した鍵アイテムが破損した際、「破損時アイテム」が設定されていると経験値が「破損時アイテム」の値になる問題を修正
元アイテムの経験値を予め保存しておいて使用するように処理を置き換える

■更新
2025/07/25 新規作成

*/

(function() {

var _KeyEventChecker_buildKeyDataItem = KeyEventChecker.buildKeyDataItem;
KeyEventChecker.buildKeyDataItem = function(item, requireFlag) {
	var keyData = _KeyEventChecker_buildKeyDataItem.call(this, item, requireFlag);
	
	if (keyData !== null) {
		keyData.exp = item.getExp();
	}
	
	return keyData;
};

var _KeyExpFlowEntry__completeMemberData = KeyExpFlowEntry._completeMemberData;
KeyExpFlowEntry._completeMemberData = function(keyNavigator) {
	var generator, exp;
	var unit = keyNavigator.getUnit();
	var keyData = keyNavigator.getKeyData();
	var isSkipMode = false;
	
	if (keyData.item === null) {
		return _KeyExpFlowEntry__completeMemberData.call(this, keyNavigator);
//		return EnterResult.NOTENTER;
	}

	if (typeof keyData.exp !== 'number') {
		exp = ExperienceCalculator.getBestExperience(unit, keyData.item.getExp());
	}
	else {
		exp = ExperienceCalculator.getBestExperience(unit, keyData.exp);
	}
	
	if (exp === 0) {
		return EnterResult.NOTENTER;
	}
		
	generator = this._dynamicEvent.acquireEventGenerator();
	generator.experiencePlus(unit, exp, isSkipMode);
		
	return this._dynamicEvent.executeDynamicEvent();
};

})();
