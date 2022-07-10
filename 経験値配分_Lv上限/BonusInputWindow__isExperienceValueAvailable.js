/*
■ファイル
BonusInputWindow__isExperienceValueAvailable.js

■SRPG Studio対応バージョン:1.262

■プラグインの概要
拠点の「経験値配分」でボーナスを割り振れるユニットを指定したレベルで制限します。
ユニットのレベルが指定したレベル上限「より大きい場合」は、ボーナスを割り振ることができなくなります。

初期設定では、
　下級クラスの上限値は10
　上級クラスの上限値は0　(上級クラスは経験値配分でのレベルアップ不可)

■使用方法
1.このファイルをpluginフォルダに入れる
2．レベルキャップの値を変更したい場合は下記コード内の対応する数値を書き換えてください

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2022/07/11 新規作成
*/

(function() {
	
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
	// レベルキャップ値(0以上の整数)
	var lvcap = 10;
	var rank = unit.getClass().getClassRank();
	
	if (rank > 0) {
		// 上級クラスのレベルキャップ値(0以上の整数)
		lvcap = 0;
	}
	
	// ユニットのレベルがレベルキャップ値より大きい場合は経験値配分できない
	return unit.getLv() > lvcap;
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

})();
