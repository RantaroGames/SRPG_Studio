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


// ゲストユニットのアイテム増減を一時的に許可するカスタムパラメータを設定します
// コンフィグの設定「ゲストユニットのアイテム増減を有効にする」の設定よりも優先されます
// このメソッドを利用する場合は、
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

// 関数F_setUnitCustomParameter(value)と共に導入してください
// エディタのコンフィグ設定をオーバーライドして独自の処理を優先させます
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


// ユニットが持つカスタムパラメータから指定したパラメータの値を取得します
// 使用方法：スクリプトの実行>　コード実行でF_getUnitCustomParameter();を記述し
// オリジナルデータのユニットで指定し、キーワードに取得したいカスタムパラメータの名前を記述します
// 戻り値が数値の場合は、変数で受け取ることができます
function F_getUnitCustomParameter()
{
	var content = root.getEventCommandObject().getOriginalContent();
	var unit = content.getUnit();
	var keyword = content.getCustomKeyword();
	
	if (unit === null || keyword === '') {
		return -1;
	}
	
	return unit.custom[keyword];
}
//----------ここまで


// ユニットが持つカスタムパラメータの中で指定したパラメータに任意の値を設定します
// 使用方法：スクリプトの実行>　コード実行でF_setUnitCustomParameter(value);を記述し
// オリジナルデータのユニットで指定し、キーワードに操作したいカスタムパラメータの名前を記述します
// 引数(value)の値をカスタムパラメータに設定することができます
// 指定した名前のカスタムパラメータが存在しなかった場合、新たに(値と共に)設定されます
function F_setUnitCustomParameter(value)
{
	var content = root.getEventCommandObject().getOriginalContent();
	var unit = content.getUnit();
	var keyword = content.getCustomKeyword();
	
	if (unit === null || keyword === '') {
		return;
	}
	
	unit.custom[keyword] = value;
}
//----------ここまで

