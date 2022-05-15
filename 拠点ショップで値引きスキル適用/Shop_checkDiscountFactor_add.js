/*

※公式プラグインに同等の機能を有するものが公開されています。

other-shopnegotiator.js

上記プラグインの利用を推奨します（本プラグインとの併用は避けてください）

■ファイル
Shop_checkDiscountFactor_add.js

■プラグインの概要
　ストックでの売買でもプレイヤーユニット全体でスキル所持者が居れば値引きを適用する
　値引き率が最も高いスキルが適用される
　適用される店は、拠点内のショップ(ユニットを指定せずに売買する形式の店)に限られる

■使用方法
　このファイルをpluginフォルダに入れる

■SRPG Studio対応バージョン:1.220

■作成者
ran
*/

(function(){ 

var alias001 = ShopLayoutScreen._checkDiscountFactor;
ShopLayoutScreen._checkDiscountFactor = function() {
	var factor = 100;
	var skill, list, count, i, unit, value;
	
	//ユニットを指定する店(戦闘準備画面中やマップ内の店)は本来の処理を呼び出す
	if (this._targetUnit !== null) return alias001.call(this);
	
	list = PlayerList.getAliveList();
	count = list.getCount();
	
	for (i = 0; i < count; i++) {
		unit = list.getData(i);
		skill = SkillControl.getBestPossessionSkill(unit, SkillType.DISCOUNT);
		if (skill !== null) {
			value = 100 - skill.getSkillValue();
			factor = factor > value  ? value : factor;
		}
	}
	
	this._discountFactor = factor / 100;
};

})();

