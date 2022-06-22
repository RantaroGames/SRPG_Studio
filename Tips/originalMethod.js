/*

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

*/

// method--------
// 使用方法： イベントコマンドの実行条件> スクリプトを条件にする

// 指定地点の地形から地形グループidを取得します。
// Parameters
// {number} x: x座標
// {number} y: y座標
// {boolean} isLayer: 透過チップを取得する場合はtrue、そうでない場合はfalse
// Return
// {number} 地形グループid
function F_getTerrainGroupId(x, y, isLayer)
{
	var terrain, terrainGroup

	if (isLayer === true) {
		terrain = PosChecker.getTerrainFromPos(x, y);
	} else {
		terrain = PosChecker.getTerrainFromPosEx(x, y);
	}
	if (terrain === null) return -1;
	
	terrainGroup = terrain.getTerrainGroup();
	if (terrainGroup === null) return -1;
	
	//root.log(terrain.getName() + '(' + x + ', ' + y + ')' +  'groupID: ' + terrainGroup.getId());
	return terrainGroup.getId();
}
//----------ここまで

/* Tips
// 指定座標の地形にユニットが存在しているか否かを判定する方法。　ユニットが存在していればtrueが返る
 PosChecker.getUnitFromPos(x, y) !== null
*/


// 使用方法：スクリプトの実行>　コード実行でF_setItemAccessGuestUnit(value)を記述し、オリジナルデータでゲストユニットを指定する
// ・Parameters
// {boolean} value アイテム増減を許可する場合 true, 許可しない場合 false
function F_setItemAccessGuestUnit(value)
{
	var content = root.getEventCommandObject().getOriginalContent();
	var unit = content.getUnit();
	
	if (unit === null || unit.isGuest() === false)	return;
	
	unit.custom.IsItemAccess = value;
}

// ゲストユニットのアイテム増減を一時的に許可するカスタムパラメータを設定します
// コンフィグの設定「ゲストユニットのアイテム増減を有効にする」の設定よりも優先されます
// このメソッドを利用する場合は
// 関数F_setUnitCustomParameter(value)と共に導入してください
(function(){

var _Miscellaneous_isItemAccess = Miscellaneous.isItemAccess;
Miscellaneous.isItemAccess = function(unit) {
	var result = _Miscellaneous_isItemAccess.call(this, unit);
	
	if (unit.isGuest() === true && typeof unit.custom.IsItemAccess === 'boolean') {
		return unit.custom.IsItemAccess;
	}
	
	return result;
};

})();
//----------ここまで



/*
ユニットが持つカスタムパラメータの中で指定したパラメータに任意の値を取得/設定します

・カスタムパラメータを取得したい
1.スクリプトの実行>　コード実行に以下を記述する
UnitCustomParameterContorol.getUnitCustomParameter();

2.オリジナルデータでユニットを指定し、キーワードに操作したいカスタムパラメータの名前を記述する
  指定したユニットがnullまたはキーワードを指定しなかった場合、カスタムパラメータが存在しなかった場合は、'undefined'が返ります
  
・カスタムパラメータを設定したい
1.スクリプトの実行>　コード実行に以下を記述する
UnitCustomParameterContorol.setUnitCustomParameter(value);

2.オリジナルデータでユニットを指定し、キーワードに操作したいカスタムパラメータの名前を記述する
3.引数(value)をカスタムパラメータに設定したい値を記述する
  value に指定する値は'Boolean', 'Number', 'String'型を推奨します
  指定した名前のカスタムパラメータが存在しなかった場合、新たに(値と共に)設定されます
  
 ・オリジナルデータの数値(1~6)で取得した値をカスタムパラメータに設定したい
1.スクリプトの実行>　コード実行に以下を記述する
UnitCustomParameterContorol.setOriginalDataNumber(index);

2.オリジナルデータでユニットを指定し、キーワードに操作したいカスタムパラメータの名前を記述する
3.引数(index)に0～5の整数を記述する(数値1~6に対応しています)
  indexで指定した数値の値がカスタムパラメータに設定されます(indexが不正な場合は、何もせず処理を終了します)
  指定した名前のカスタムパラメータが存在しなかった場合、新たに(値と共に)設定されます
*/

var UnitCustomParameterContorol = {
	_getOriginalContent: function() {
		return root.getEventCommandObject().getOriginalContent();
	},
	
	_getUnit: function() {
		return this._getOriginalContent().getUnit();
	},
	
	_getKeyWord: function() {
		return this._getOriginalContent().getCustomKeyword();
	},
	
	// 数値1~6を取得する(引数indexは0~5を指定)
	_getValue: function(index) {
		return this._getOriginalContent().getValue(index);
	},
	
	getCustomParameter: function() {
		var unit = this._getUnit();
		var keyword = this._getKeyWord();
		
		if (unit === null || keyword === '') {
			return;
		}
	
		return unit.custom[keyword];
	},
	
	setCustomParameter: function(value) {
		var unit = this._getUnit();
		var keyword = this._getKeyWord();
		
		if (unit === null || keyword === '') {
			return;
		}
		
		unit.custom[keyword] = value;
	},
	
	// indexで指定したオリジナルデータの数値をカスタムパラメータに設定する
	setOriginalDataNumber: function(index) {
		var unit = this._getUnit();
		var keyword = this._getKeyWord();
		var value;
		
		if (unit === null || keyword === '') {
			return;
		}
		
		if (typeof index !== 'number' || index < 0 || index > 5) {
//			root.log('index には 0~5 の整数を指定してください');
			return;
		}
		
		value = this._getValue(index);
		
		unit.custom[keyword] = value;
	}
};
