/*
■ファイル名
AbilityCalculator_getAgility_mod.js

■プラグインの概要
敏捷(攻速)の減少値を計算する際に装備品(武器と道具)の総重量を考慮する

■使用方法
1.このスクリプトをpluginフォルダに入れる

※重量による敏捷減算式に応じて使用する処理を選択する
AbilityCalculator.getAgilityの処理をコメントアウト/解除してください
または、各ゲームの計算式に応じてAbilityCalculator.getAgilityの処理を変更してください

・減算方式1
 所持品の総重量を敏捷から減算する

・減少方式2
 本来の処理(武器の重さ-体格)を実行し、更に武器以外の所持品の重量合計を減少値(体格等)で除算した値を減算する

■作成者
ran

■更新履歴
2022/01/27 新規作成

*/

(function() {

// 所持品の重さを加算して総重量を求める処理(新規作成)
AbilityCalculator._getPossesionItemGrossWeight　= function(unit) {
	var i, item, count;
	var value = 0;
	
	count = UnitItemControl.getPossessionItemCount(unit);
	
	for (i = 0; i < count; i++) {
		item = UnitItemControl.getItem(unit, i);
		if (item !== null) {
			value += item.getWeight();
		}
	}
	
	return value;
};


// 敏捷(戦速)を取得する処理(本来の処理をオーバーライド)
// 元処理では、武器の重さを体格(または力or魔力)で軽減した値が0より大きい場合のみ、速さから減算して敏捷を取得する
// call関数で元処理を呼ぶ処理方法だと所持品の重さを考慮する時、武器の重さを二重計算したり軽減値(体格等)が十分に考慮されない場合がでてくる

// 減算方式1 所持品の総重量を敏捷から減算
// この方式では、ユニットが複数の武器および道具を所持することを前提にするゲーム(恐らく大多数のゲームが該当する)では重量が敏捷に与える負荷が大きくなりがち
/* AbilityCalculator.getAgility = function(unit, weapon) {
	var agi, value, param;
	var spd = RealBonus.getSpd(unit);
	
	// 通常、敏捷は速さと同一
	agi = spd;
	
	// 武器が指定されてない場合、または重さを考慮しない場合は、敏捷は変わらない
	if (weapon === null || !DataConfig.isItemWeightDisplayable()) {
		return agi;
	}
	
	// 体格が有効な場合は体格で判定し、そうでない場合は力(魔力)で判定する
	if (DataConfig.isBuildDisplayable()) {
		param = ParamBonus.getBld(unit);
	}
	else {
		if (Miscellaneous.isPhysicsBattle(weapon)) {
			param = ParamBonus.getStr(unit);
		}
		else {
			param = ParamBonus.getMag(unit);
		}
	}
		
//	value = weapon.getWeight() - param;
	// 所持品の重さを全て加算する処理で総重量を求める
	value = this._getPossesionItemGrossWeight(unit) - param;
		
	if (value > 0) {
		// パラメータが重さより低い場合は、その差分だけ敏捷を下げる
		agi -= value;
	}
		
	return agi;
};
 */

// 減少方式2
// 敏捷の減少値を本来の処理(武器の重さ-体格)から更に
// 武器以外の所持品の重量合計を減少値(体格等)で除算した値を減算する方式
// この処理方式では、重量の異なる装備武器を変更しても敏捷が変化しない場合があるためプレイヤーが混乱する恐れもある
AbilityCalculator.getAgility = function(unit, weapon) {
	var agi, value, param, weight;
	var spd = RealBonus.getSpd(unit);
	
	// 通常、敏捷は速さと同一
	agi = spd;
	
	// 武器が指定されてない場合、または重さを考慮しない場合は、敏捷は変わらない
	if (weapon === null || !DataConfig.isItemWeightDisplayable()) {
		return agi;
	}
	
	// 体格が有効な場合は体格で判定し、そうでない場合は力(魔力)で判定する
	if (DataConfig.isBuildDisplayable()) {
		param = ParamBonus.getBld(unit);
	}
	else {
		if (Miscellaneous.isPhysicsBattle(weapon)) {
			param = ParamBonus.getStr(unit);
		}
		else {
			param = ParamBonus.getMag(unit);
		}
	}
	
	// 武器の重さ-軽減値
	value = weapon.getWeight() - param;
	
	// 装備品の総重量-装備武器の重量
	weight = this._getPossesionItemGrossWeight(unit) - weapon.getWeight();
	
	// 装備武器以外の所持品の総重量を軽減値で除算(端数切り上げ)
	value += Math.ceil(weight / param);
	//root.log('減少値:'　+ value + '　総重量(武器以外):' + weight + ' 武器重量:' + weapon.getWeight());
	
	// 敏捷から減算
	if (value > 0) {
		agi -= value;
	}
	
	return agi;
};

})();
