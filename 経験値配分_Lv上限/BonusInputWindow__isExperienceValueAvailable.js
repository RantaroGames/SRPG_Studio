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
    変数テーブルのページ数と作成した変数のidを記述する
    ※変数指定が不正だった場合は、table:0, index:0の値が返る
  
■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2022/07/11 新規作成
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

BonusInputWindow._getLevelCap = function(unit) {
	// レベルキャップ値(指定した変数から取得する)
	var lvcap = f_getVariable_value(LevelCapValue.VariablePage, LevelCapValue.LowerClassId);
	var rank = unit.getClass().getClassRank();
	
	if (rank > 0) {
		// 上級クラスのレベルキャップ値(指定した変数から取得する)
		lvcap = f_getVariable_value(LevelCapValue.VariablePage, LevelCapValue.UpperClassId);
	}
	
	// ユニットのレベルがレベルキャップ値以上の場合は経験値配分できない
	return unit.getLv() >= lvcap;
};

BonusInputWindow._getMessage = function() {
//	return this._isMaxLv ? StringTable.ExperienceDistribution_CannotLevelup : StringTable.ExperienceDistribution_BonusShortage;
	if (this._isMaxLv) {
		return StringTable.ExperienceDistribution_CannotLevelup;
	}
	else if (this._isLevelCapped) {
		return '経験値配分できるLV上限を超えています';
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

})();
