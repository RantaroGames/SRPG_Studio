/*
■ファイル
UnitCommand_MetamorphozeCancel_add.js

■プラグインの概要
形態変化を手動キャンセルする場合、「本来のクラスで進入不可の地形にいる時」はキャンセルコマンドを許可しない
※本プラグインでは「進入できる条件」を正しく考慮できない場合がある

・現バージョンにおける判定の仕様
PosChecker.getMovePointFromUnit(x, y, unit)は、現在(形態変化中)のクラスの進入コストを返すため
元のクラスで進入不可になる地形を判定する目的では使用できない
同様にterrain.getPassableAggregation().isCondition(unit)も現在のクラスを基に判定するため、この場合は利用できない

そのためterrain.getMovePointFromMoveTypeId(moveTypeId)で元のクラスの移動タイプから進入コストを取得している
ただし、このメソッドでは「進入できる/できない条件」を考慮できないためエディタでコスト1以上の値が設定されていると進入可能と判定される
(スキルやクラスタイプ等で進入可否を区別している地形を正しく判定できない)

■使用方法
このファイルをpluginフォルダに入れる

■SRPG Studio対応バージョン:1.240

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

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
