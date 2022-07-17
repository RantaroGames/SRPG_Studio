/*
■ファイル
BonusInputWindow__isExperienceValueAvailable.js

■SRPG Studio対応バージョン:1.262

■プラグインの概要
拠点の「経験値配分」でボーナスを割り振れるユニットを指定したレベルで制限します。
ユニットのレベルが指定したレベル上限「以上の場合」は、ボーナスを割り振ることができなくなります。

■使用方法
1.このファイルをpluginフォルダに入れる
2.エディタ上でレベルキャップの値を設定するための変数を作成する
2-1.下記コード内の値を作成した変数に合わせて変更する
※変数指定が不正だった場合は、table:0, index:0の値が返る

  
■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2022/07/11 新規作成
2022/07/17 レベルキャップの上限値を表示するウィンドウを追加
2022/07/18 現在レベルが(上限-1)の時は、レベルアップまでの不足分のみ経験値配分可能なように調整

*/

(function() {

// レベルキャップの値を取得するための（エディタ上の）変数を設定する
var LevelCapValue = {
	// 変数テーブル(タブ)のページ数（左端から0~5。5はid変数のタブ)
	VariablePage: 5,
	// 下級クラスのレベルキャップ値を格納する変数のID
	LowerClassId: 0,
	// 上級クラスのレベルキャップ値を格納する変数のID
	UpperClassId: 1
};	

BonusInputWindow._isLevelCapped = false;

var _BonusInputWindow__isExperienceValueAvailable = BonusInputWindow._isExperienceValueAvailable;
BonusInputWindow._isExperienceValueAvailable = function() {
	var result = _BonusInputWindow__isExperienceValueAvailable.call(this);
	
	this._isLevelCapped = this._getLevelCap(this._unit);
//	root.log(this._unit.getName() + this._unit.getLv() + this._isLevelCapped);

	if (this._isLevelCapped) return false; 
	
	return result;
};

// ユニットのレベルがレベルキャップ値以上の場合は経験値配分できない
BonusInputWindow._getLevelCap = function(unit) {
	var lvcap = this._getLevelCapValue(unit);

	return unit.getLv() >= lvcap;
};

// レベルキャップ値(指定した変数から取得する)
BonusInputWindow._getLevelCapValue = function(unit) {
	var lvcap = f_getVariable_value(LevelCapValue.VariablePage, LevelCapValue.LowerClassId);
	var rank = unit.getClass().getClassRank();
	
	if (rank > 0) {
		// 上級クラスのレベルキャップ値(指定した変数から取得する)
		lvcap = f_getVariable_value(LevelCapValue.VariablePage, LevelCapValue.UpperClassId);
	}
	
	return lvcap;
};

BonusInputWindow._getMessage = function() {
//	return this._isMaxLv ? StringTable.ExperienceDistribution_CannotLevelup : StringTable.ExperienceDistribution_BonusShortage;
	if (this._isMaxLv) {
		return StringTable.ExperienceDistribution_CannotLevelup;
	}
	else if (this._isLevelCapped) {
		return '経験値配分の上限Lvに達しています';
	}
	
	return StringTable.ExperienceDistribution_BonusShortage;
};



//変数指定エラー時は、table:0, index:0の値が返る
function f_getVariable_value(page, id)
{
	var table = root.getMetaSession().getVariableTable(page);
	var index = table.getVariableIndexFromId(id);
	
	return table.getVariable(index);
}


ExperienceDistributionScreen._levelCaptWindow = null;

var _ExperienceDistributionScreen__prepareScreenMemberData = ExperienceDistributionScreen._prepareScreenMemberData;
ExperienceDistributionScreen._prepareScreenMemberData = function(screenParam) {
	_ExperienceDistributionScreen__prepareScreenMemberData.call(this, screenParam);
	this._levelCaptWindow = createWindowObject(LevelCapWindow, this);
};

var _ExperienceDistributionScreen_drawScreenCycle = ExperienceDistributionScreen.drawScreenCycle;
ExperienceDistributionScreen.drawScreenCycle = function() {
	_ExperienceDistributionScreen_drawScreenCycle.call(this);
	
	var width = this._levelupUnitWindow.getWindowWidth() + this._itemUserWindow.getWindowWidth();
	var height = this._itemUserWindow.getWindowHeight();
	var x = LayoutControl.getCenterX(-1, width);
	var y = LayoutControl.getCenterY(-1, height);
	
	var xInfo = (x + width) - this._bonusPointWindow.getWindowWidth() - this._levelCaptWindow.getWindowWidth();
	var yInfo = y - this._levelCaptWindow.getWindowHeight();
	this._levelCaptWindow.drawWindow(xInfo, yInfo);
};

var LevelCapWindow = defineObject(BaseWindow,
{
	moveWindowContent: function() {
		return MoveResult.END;
	},
	
	drawWindowContent: function(x, y) {
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var lvcapL = f_getVariable_value(LevelCapValue.VariablePage, LevelCapValue.LowerClassId);
		var lvcapH = f_getVariable_value(LevelCapValue.VariablePage, LevelCapValue.UpperClassId);
		
		TextRenderer.drawKeywordText(x, y - 16, 'LevelCap', -1, ColorValue.KEYWORD, font);
		
		TextRenderer.drawKeywordText(x, y, '(下級)', -1, color, font);
		NumberRenderer.drawNumber(x + 60, y, lvcapL);
		TextRenderer.drawKeywordText(x　+ 90, y, '(上級)', -1, color, font);
		NumberRenderer.drawNumber(x + 150, y, lvcapH);
	},
	
	getWindowWidth: function() {
		return 200;
	},
	
	getWindowHeight: function() {
		return 50;
	}
}
);

// 現在レベルが(上限-1)LVの場合はレベルアップに必要な残りexp分しか変換できないようにする
// 上限20レベルで現在レベルが19(exp 18)の時は82expを最大配分量とする
var _BonusInputWindow_setUnit = BonusInputWindow.setUnit;
BonusInputWindow.setUnit = function(unit) {
	_BonusInputWindow_setUnit.call(this, unit);
	
	var lvcap = this._getLevelCapValue(unit);
	var maxLv = Miscellaneous.getMaxLv(unit);
	if (lvcap < maxLv) maxLv = lvcap;

	var nextToLast = maxLv - unit.getLv() === 1 ? true : false;
	var gaps = DefineControl.getBaselineExperience() - unit.getExp();
	
	if (this._isExperienceValueAvailable() && nextToLast) {
		// (ボーナス/変換レート)点より小さい場合は、レベルアップへの不足分を入手可能とする
		if (gaps < this._max) {
			this._max = gaps;
		}
	}
};


})();
