/*
■ファイル名
AttackEvaluator_HitCritical_add.js

■SRPG Studio対応バージョン
ver.1.236

■プラグインの概要
乱数を用いた判定処理の一部を変更します。某FEで用いられている(らしい)実効命中率に似た動作をします。
本プラグインで操作できる乱数判定は、以下の5つの場合に限られます。
・武器を使用した「戦闘」の命中判定
・「ステート付加アイテム」を使用した場合の命中判定
・武器の「追加ステート」における発動判定
・スキルの発動判定
・クリティカル判定(「戦闘」時の確率による成否判定)

// 本プラグイン導入による影響の大まかな説明
プレイヤーユニットの確率が50％を超える場合、表示値よりも成功率が上昇します。
敵軍ユニットの確率が50%未満の場合、表示値よりも成功率が低下します。

// 本プラグインの処理が作る状況の意図
プレイヤーに有利な乱数処理を行い、味方の命中率80％は表示値よりも命中しやすくなり
敵の必殺率30％は表示値よりも発生しにくくなります。
表示値と実際の試行結果に乖離が生まれますが、プレイの快適性は増すことでしょう（事故率の低下）。

他方、表示値を基に（乱数による展開を読んで）綿密に戦術を練るプレイを阻害することにもなりますが
乱数の影響（特にプレイヤーが望まない結果になること）によるストレスは、制作者が考える以上に大きいと思われます。
表示される数値でハラハラ感を演出しつつ、最終的にプレイヤーの希望する結果に収束させるというエンターテイメント性を重視しています。
ち密な計算を要求する難易度のゲームを作りたいのであれば、乱数要素を可能な限り排除した方がその意図に沿うでしょう。


■使用方法
このプラグインをpluginフォルダに入れる

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

*/

(function() {
/*----------------------------------------------------------
自軍ユニット用の確率成否判定
表示命中値が50以上の場合は、２つの乱数の平均値で判定する
命中(発動)率50％以上であれば表示値より成功確率が大きくなる
50％未満では、表示値通り
----------------------------------------------------------*/
Probability.getProbability_forPlayer = function(percent) {
	var n;
	
	if (percent >= this.getMaxPercent()) return true;
	if (percent <= 0) return false;
	
	if (percent >= 50) {
		n = Math.floor( (this.getRandomNumber() % 100 + this.getRandomNumber() % 100) / 2 );
	}
	else {
		n = this.getRandomNumber() % 100;
	}
	
	return percent > n;
};


/*----------------------------------------------------------
敵軍ユニット用の確率成否判定
表示命中値が50未満の場合は、２つの乱数の平均値で判定する
命中(発動)率50％以上であれば表示値通り
50％未満では、表示値よりも成功確率が小さくなる
----------------------------------------------------------*/
Probability.getProbability_forEnemy = function(percent) {
	var n;
	
	if (percent >= this.getMaxPercent()) return true;
	if (percent <= 0) return false;
	
	if (percent < 50) {
		n = Math.floor( (this.getRandomNumber() % 100 + this.getRandomNumber() % 100) / 2 );
	}
	else {
		n = this.getRandomNumber() % 100;
	}
	
	return percent > n;
};

/*----------------------------------------------------------
自軍と敵軍ユニットは、それぞれ特別な命中判定を使用する
----------------------------------------------------------*/
var _AttackEvaluator_HitCritical_calculateHit = AttackEvaluator.HitCritical.calculateHit;
AttackEvaluator.HitCritical.calculateHit = function(virtualActive, virtualPassive, attackEntry) {
	var percent, unitType;
	var unit = virtualActive.unitSelf;
	
	if (unit !== null) {
		unitType = unit.getUnitType();
	}
	
	if (unitType === UnitType.PLAYER) {
		percent = HitCalculator.calculateHit(virtualActive.unitSelf, virtualPassive.unitSelf, virtualActive.weapon, virtualActive.totalStatus, virtualPassive.totalStatus);
		return Probability.getProbability_forPlayer(percent);
	}
	else if (unitType === UnitType.ENEMY) {
		percent = HitCalculator.calculateHit(virtualActive.unitSelf, virtualPassive.unitSelf, virtualActive.weapon, virtualActive.totalStatus, virtualPassive.totalStatus);
		return Probability.getProbability_forEnemy(percent);
	}
	
	//Probability.getProbability(percent);
	return _AttackEvaluator_HitCritical_calculateHit.call(this, virtualActive, virtualPassive, attackEntry);
};

/*--------------------------------------------------------------
自軍と敵軍ユニットは、それぞれ特別なクリティカル判定を使用する
--------------------------------------------------------------*/
var _AttackEvaluator_HitCritical_calculateCritical = AttackEvaluator.HitCritical.calculateCritical;
AttackEvaluator.HitCritical.calculateCritical = function(virtualActive, virtualPassive, attackEntry) {
	var percent, unitType;
	var unit = virtualActive.unitSelf;
	
	if (unit !== null) {
		unitType = unit.getUnitType();
	}
	
	if (unitType === UnitType.PLAYER) {
		percent = CriticalCalculator.calculateCritical(virtualActive.unitSelf, virtualPassive.unitSelf, virtualActive.weapon, virtualActive.totalStatus, virtualPassive.totalStatus);
		return Probability.getProbability_forPlayer(percent);
	}
	else if (unitType === UnitType.ENEMY) {
		percent = CriticalCalculator.calculateCritical(virtualActive.unitSelf, virtualPassive.unitSelf, virtualActive.weapon, virtualActive.totalStatus, virtualPassive.totalStatus);
		return Probability.getProbability_forEnemy(percent);
	}
	
	//Probability.getProbability(percent);
	return _AttackEvaluator_HitCritical_calculateCritical.call(this, virtualActive, virtualPassive, attackEntry);
};

/*--------------------------------------------------------------------
「ステート付加アイテム」「武器の付加ステート」「スキル発動」時の判定
自軍と敵軍ユニットは、それぞれ特別な発動判定を使用する
--------------------------------------------------------------------*/
var _Probability_getInvocationProbability = Probability.getInvocationProbability;
Probability.getInvocationProbability = function(unit, type, value) {
	var percent, unitType;

	if (unit !== null) { 
		unitType = unit.getUnitType();
	}
	
	if (unitType === UnitType.PLAYER) {
		percent = this.getInvocationPercent(unit, type, value);
		return this.getProbability_forPlayer(percent);
	}
	else if (unitType === UnitType.ENEMY) {
		percent = this.getInvocationPercent(unit, type, value);
		return this.getProbability_forEnemy(percent);
	}
	
	//this.getProbability(percent);
	return _Probability_getInvocationProbability.call(this, unit, type, value);
};

/*----------------------------------------------------------------
stateがnullの場合は発動判定処理を呼ばないように修正
武器の「追加ステート」未設定でも判定が呼ばれている模様※
(※AttackEvaluator.HitCritical._checkStateAttackの処理から推測)
----------------------------------------------------------------*/
var _StateControl_checkStateInvocation = StateControl.checkStateInvocation;
StateControl.checkStateInvocation = function(active, passive, obj) {
	var state = obj.getStateInvocation().getState();
	
	if (state === null) return null;
	
	return _StateControl_checkStateInvocation.call(this, active, passive, obj);
};

})();
