/*
■ファイル
UnitCommand_MetamorphozeCancel_add.js

■プラグインの概要
形態変化を手動キャンセルする場合、「本来のクラスで進入不可の地形にいる時」はキャンセルコマンドを許可しない
※本プラグインでは「進入できる条件」を正しく考慮できない場合がある
(getMovePointFromMoveTypeIdメソッドは「進入できる条件」を考慮せずエディタの設定値(移動コスト)を返してくるため)

■使用方法
このファイルをpluginフォルダに入れる

■SRPG Studio対応バージョン:1.240

■作成者
ran
*/

(function() {

var alias001 = UnitCommand.MetamorphozeCancel.isCommandDisplayable;
UnitCommand.MetamorphozeCancel.isCommandDisplayable = function() {
	var result = alias001.call(this);
	if (result === false ) return false;
	
	var unit = this.getCommandTarget();
	if (unit === null) return false;
	
	var sourceClass = unit.getUnitStyle().getSourceClass();
	var moveTypeId  = sourceClass.getClassType().getMoveTypeId();
	var x = unit.getMapX();
	var y = unit.getMapY();
	var terrain = PosChecker.getTerrainFromPos(x, y);
	if (terrain === null) return false;
	
	var movePoint = terrain.getMovePointFromMoveTypeId(moveTypeId);
	if (movePoint === 0) return false;
	
	return result;
};

})();
