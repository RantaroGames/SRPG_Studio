/*
■ファイル名
CorrectCriticalWeapon.js

■SRPG Studio対応バージョン
ver.1.248

■プラグインの概要
武器のクリティカル値を任意の数値で補正します。
武器の情報ウィンドウには、データ設定の数値をカスタムパラメータで補正した数値が表示されます。

戦闘で計算に使用するクリティカル値は、カスタムパラメータで指定した数値を考慮します。
(ただし、クリティカル値が0未満になった場合は、0として扱います)

■使用方法
1.このプラグインをpluginフォルダに入れる
2.武器のカスタムパラメータに{correctCritical: -10}のように数値を記述する
　-(マイナス)をつけると武器のデータに設定されたクリティカル値からカスタムパラメータの数値分減算されます。
　正の値を指定した場合、データの数値に加算されます。

■競合の注意
AbilityCalculatorオブジェクトの処理を変更している関係上、他のプラグインと競合する可能性が大きいです。
その場合、プラグインのリネーム(ファイル名を変更して読み込む順番を遅くする。ディレクトリを深くしたり、先頭の文字を変更（数字→ABC→かなの順で読み込まれる…はず）)か
マージ(AbilityCalculatorオブジェクトを変更しているプラグインの記述にクリティカル値を補正する処理を組み込む)で対応してください。

■作成者
ran
*/

(function() {

var _AbilityCalculator_getCritical = AbilityCalculator.getCritical;
AbilityCalculator.getCritical = function(unit, weapon) {
	var result = _AbilityCalculator_getCritical.call(this, unit, weapon);

	//クリティカル値を補正する処理	
	if (typeof weapon.custom.correctCritical === 'number') {
		result += weapon.custom.correctCritical;
	}
	
	if (result < 0) result = 0;
	
	return result;
};

// call関数で元処理を呼び出すのではなく上書き処理
ItemSentence.CriticalAndRange.drawItemSentence = function(x, y, item) {
	var text;
	var weaponCrit = item.getCritical();
	
	if (typeof item.custom.correctCritical === 'number') {
		weaponCrit += item.custom.correctCritical;
	}

	text = root.queryCommand('critical_capacity');
	ItemInfoRenderer.drawKeyword(x, y, text);
	x += ItemInfoRenderer.getSpaceX();
	if (weaponCrit < 0) {
		TextRenderer.drawSignText(x - 20, y, ' - ');
		weaponCrit *= -1;
	}
	NumberRenderer.drawRightNumber(x, y, weaponCrit);
	
	x += 42;
	
	text = root.queryCommand('range_capacity');
	ItemInfoRenderer.drawKeyword(x, y, text);
	x += ItemInfoRenderer.getSpaceX();
	this._drawRange(x, y, item);
};

})();
