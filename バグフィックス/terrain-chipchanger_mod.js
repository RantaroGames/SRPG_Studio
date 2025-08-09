
/*--------------------------------------------------------------------------
  
  ユニットが通行したコースのマップチップを変更します。
  
  使用方法:
  isTargetEnabledでtrueを返すことで、マップチップが変更されます。
  _getChipHandleメソッドの4つの変数を調整することで、変更するマップチップを任意にできます。
  
  作成者:
  サファイアソフト
  https://srpgstudio.com/
  
  更新履歴:
  2024/01/22 ユニットを移動させずにコマンドをキャンセルした場合の不具合を修正
  2024/01/17 使用方法を記載
  2024/01/11 公開
  

  _改変(改変者ran)
  改変元プラグイン terrain-chipchanger.js
  2025/08/29 移動キャンセル時のマップチップリセットの処理を変更（レイヤーチップも戻せるように修正した）
  
--------------------------------------------------------------------------*/

(function() {

var MapChipChanger = {
	_chipArray: null,
	
	changeChip: function(x, y, targetUnit) {
		var obj;
		var handle = this._getChipHandle(targetUnit);
		var session = root.getCurrentSession();
		var terrain = session.getTerrainFromPos(x, y, true);
		var terrain_b = session.getTerrainFromPos(x, y, false);
		
		if (terrain !== terrain_b) {
			obj = {x: x, y: y, handle: session.getMapChipGraphicsHandle(x, y, false), isLayer: false};
			this._chipArray.push(obj);
			
			obj = {x: x, y: y, handle: session.getMapChipGraphicsHandle(x, y, true), isLayer: true};
			this._chipArray.push(obj);
		}
		else {
			obj = {x: x, y: y, handle: session.getMapChipGraphicsHandle(x, y, false), isLayer: false};
			this._chipArray.push(obj);
		}

		root.getCurrentSession().setMapChipGraphicsHandle(x, y, false, handle);
	},
	
	restoreChip: function(targetUnit) {
		var i, obj;
		var count = this._chipArray.length;
		
		for (i = 0; i < count; i++) {
			obj = this._chipArray[i];
			root.getCurrentSession().setMapChipGraphicsHandle(obj.x, obj.y, obj.isLayer, obj.handle);
		}
		
		this.reset();
	},
	
	isTargetEnabled: function(targetUnit) {
		// targetUnitの条件に応じて、trueを返すようにする
		return true;
	},
	
	reset: function() {
		this._chipArray = [];
	},
	
	_getChipHandle: function(targetUnit) {
		var isRuntime = true;
		var id = 0;
		var xSrc = 0;
		var ySrc = 1;
		
		return root.createResourceHandle(isRuntime, id, 0, xSrc, ySrc);
	}
};

var alias1 = SimulateMove.startMove;
SimulateMove.startMove = function(unit, moveCource) {
	alias1.call(this, unit, moveCource);
	MapChipChanger.reset();
};

var alias2 = SimulateMove.moveUnit;
SimulateMove.moveUnit = function() {
	var result = alias2.call(this);
	var chipWidth = GraphicsFormat.MAPCHIP_WIDTH;
	var chipHeight = GraphicsFormat.MAPCHIP_HEIGHT;
	
	if (MapChipChanger.isTargetEnabled(this._unit)) {
		if ((this._xPixel % chipWidth) === 0 && (this._yPixel % chipHeight) === 0) {
			MapChipChanger.changeChip(this._xPixel / chipWidth, this._yPixel / chipHeight, this._unit);
		}
	}
		
	return result;
};

var alias3 = MapSequenceCommand._moveCommand;
MapSequenceCommand._moveCommand = function() {
	var result = alias3.call(this);
	
	if (MapChipChanger.isTargetEnabled(this._targetUnit)) {
		if (result === MapSequenceCommandResult.CANCEL) {
			MapChipChanger.restoreChip(this._targetUnit);
		}
	}
	
	return result;
};

var alias4 = SimulateMove.skipMove;
SimulateMove.skipMove = function(unit, moveCource) {
	var i, direction;
	var count = moveCource.length;
	var x = unit.getMapX();
	var y = unit.getMapY();
		
	alias4.call(this, unit, moveCource);
	
	if (!MapChipChanger.isTargetEnabled(unit)) {
		return;
	}
	
	for (i = 0; i < count; i++) {
		direction = moveCource[i];
		x += XPoint[direction];
		y += YPoint[direction];
		MapChipChanger.changeChip(x, y, unit);
	}
};

var alias5 = CurrentMap.prepareMap;
CurrentMap.prepareMap = function() {
	alias5.call(this);
	MapChipChanger.reset();
};

})();
