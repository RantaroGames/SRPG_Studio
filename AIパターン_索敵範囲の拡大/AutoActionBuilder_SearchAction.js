/*
■ファイル名
AutoActionBuilder_SearchAction.js

■SRPG Studio対応バージョン
ver.1.231

■プラグインの概要
・AIの行動パターンにカスタムを選択した時、移動力×係数(小数点以下切り上げ)を基準に索敵する
・索敵範囲は、そのユニットが補正した移動力で踏破できる距離＋武器の射程
(例)移動力7、射程2、カスタムパラメータ{searchrange:1.5}のユニットの場合
  7*1.5=11(切り上げ)で移動コスト11以内の地点から射程2で攻撃可能な対象が存在していれば行動する
  ※平地(コスト1)であれば、歩数11、森(コスト2)であれば歩数5となる場合がある
・壁を挟んだ場合は回り込んだ経路で計算する。(壁越しに攻撃できる場合は攻撃する)

■使用方法
このプラグインをpluginフォルダに入れる
ユニットのAI行動パターンでカスタムを選択してキーワードに「EstimateApproach」と記述する
ユニットのカスタムパラメータに「searchrange:数値」と記述する
（記述が無い/数値でない場合は、係数に2を設定。小数点を含む値を記述しても良い）

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

*/


(function() {

// 移動力×カスパラで指定した値で検索範囲を限定する
var alias_001 = AutoActionBuilder.buildCustomAction;
AutoActionBuilder.buildCustomAction = function(unit, autoActionArray, keyword) {
	if (keyword === 'EstimateApproach') {
		return this._buildSearchAction(unit, autoActionArray);
	} 
	else {
		return alias_001.call(this, unit, autoActionArray, keyword);
	}
};

AutoActionBuilder._buildSearchAction = function(unit, autoActionArray) {
	var combination;
	var limitrange = (typeof unit.custom.searchrange === 'number' && unit.custom.searchrange < 1) ? true : false;
	
	if (limitrange) {
		// 係数を1未満を指定していた場合、移動力以下の距離に検索範囲を限定
		combination = CombinationManager.getEstimateCombination_Ex(unit);
	}
	else {
		// 移動力の範囲内で検索
		combination = CombinationManager.getApproachCombination(unit, true);
	}
	
	if (combination === null) {
		if (limitrange) {
			// 移動力以下に限定した範囲で敵を見つけられなかった場合は何もしない
			return this._buildEmptyAction();
		}
		else {
			// 現在位置から攻撃できるユニットは存在しないため、範囲を広げて相手を探すことになる。
			// MAP全域ではなく移動力×係数で検索範囲を限定
			combination = CombinationManager.getEstimateCombination_Ex(unit);
		}
		
		if (combination === null) {
			return this._buildEmptyAction();
		}
		else {
			this._pushMove(unit, autoActionArray, combination);
			this._pushWait(unit, autoActionArray, combination);
		}
	}
	else {
		this._pushGeneral(unit, autoActionArray, combination);
	}
	
	return true;
};

CombinationManager.getEstimateCombination_Ex = function(unit) {
	var combinationArray, combinationIndex, combination;
	var simulator = root.getCurrentSession().createMapSimulator();
	var misc = CombinationBuilder.createMisc(unit, simulator);
	
	//検索範囲を移動力×カスパラで限定
	var unitmov = ParamBonus.getMov(unit);
	var simulateRange = unitmov * 2;
	if (typeof unit.custom.searchrange === 'number') {
		simulateRange = Math.ceil(unitmov * unit.custom.searchrange);
	}
	
	var mapSize = CurrentMap.getWidth() * CurrentMap.getHeight();
	if (simulateRange > mapSize) simulateRange = mapSize;
	if (simulateRange < 1) simulateRange = 0;

	misc.simulator.startSimulation(unit, simulateRange);
	
	// 移動に関する組み合わせの配列を作成する
	combinationArray = CombinationBuilder.createMoveCombinationArray(misc);
	if (combinationArray.length === 0) {
		combinationArray = this._getChaseCombinationArray(misc);
		if (combinationArray.length === 0) {
			return null;
		}
	}
	
	combinationIndex = CombinationSelectorEx.getEstimateCombinationIndex(unit, combinationArray);
	if (combinationIndex < 0) {
		return null;
	}
	
	combination = combinationArray[combinationIndex];
	
	combination.cource = CourceBuilder.createExtendCource(unit, combination.posIndex, simulator);
	
	return combination;
};

})();
