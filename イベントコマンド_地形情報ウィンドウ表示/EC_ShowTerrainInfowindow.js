/*
■ファイル名
EC_ShowItemInfowindow.js

■SRPG Studio対応バージョン
var.1.249

■プラグインの概要
イベントコマンド〈プラグインの実行〉を使用して
プロパティで設定した地形の情報ウィンドウを表示する

※注意点
テロップウィンドウのようにイベントコマンドを実行した時のみ表示される(キー押下でイベントを進めると表示は消える)

■使用方法
1.このプラグインをpluginフォルダに入れる

2.イベントコマンド〈プラグインの実行〉を使用する

・イベントの種類(イベントコマンド呼出し)

・オブジェクト名
OriginalEC_ShowTerrainInfoWindow

・プロパティ(省略可)
{
  isLayer: true // true:レイヤー地形, false:下層地形, 省略または不正な値の時：false扱い
, terrainX:0 // 地形のx座標
, terrainY:0 //　地形のy座標　(ｘ,y)座標指定が不正で地形情報が取得できない場合、何もせず処理を終了する
, isCenterShow: true // Boolean値、ture:中央表示、false:座標指定、略または不正な値の時：true扱い
, x: 0 //　pixelX座標、isCenterShowがfalse以外の時は無効
, y: 0 //　pixelY座標　isCenterShowがfalse以外の時は無効 infowindowを基準に描画するためタイトルの高さ(60)未満の値を指定するとタイトル上部が見切れる
}

・オリジナルデータ
表示したいアイテムまたはスキルを指定する

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2021/12/22 新規作成

*/

(function() {

var alias1 = ScriptExecuteEventCommand._configureOriginalEventCommand;
ScriptExecuteEventCommand._configureOriginalEventCommand = function(groupArray) {
	alias1.call(this, groupArray);
	
	groupArray.appendObject(EC_ShowTerrainInfoWindow);
};

var INFOWINDOW_TYPE  = {
	ITEM   : 0,
	SKILL  : 1
};

var EC_ShowTerrainInfoWindow = defineObject(BaseEventCommand, 
{
	_terrain: null,
	_terrainInfoWindow: null,

	_isCenterShow: true,
	_posX: 0,
	_posY: 0,
	
	_waitCounter: null,
	_isForceWait: true,

	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
	
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		if (!this._isForceWait) {
			if (InputControl.isSelectAction()) {
				return MoveResult.END;
			}
		}
		else if (this._waitCounter.moveCycleCounter() !== MoveResult.CONTINUE) {
			this._isForceWait = false;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawEventCommandCycle: function() {
		var pos = this._getBasePos(this._terrain);
		var x, y;
		
		if (this._isCenterShow) {
			x = pos.x;
			y = pos.y;
			//root.log('x:' + x + ', y:' + y);
		}
		else {
			x = this._posX;
			y = this._posY;
		}
		
		this._drawTerrainInfoWindow(x, y, this._terrain);
	},
	
	getEventCommandName: function() {
		return 'OriginalEC_ShowTerrainInfoWindow';
	},
	
	_prepareEventCommandMemberData: function() {
		var eventcommandObject = root.getEventCommandObject();
		var arg = eventcommandObject.getEventCommandArgument();
		
		if (typeof arg.terrainX === 'number' && typeof arg.terrainY === 'number') {
			if (arg.isLayer === true) {
				this._terrain = PosChecker.getTerrainFromPos(arg.terrainX, arg.terrainY);
			}
			else {
				this._terrain = PosChecker.getTerrainFromPosEx(arg.terrainX, arg.terrainY);
			}
		}
		
		if (this._terrain === null) {
			return  EnterResult.NOTENTER;
		}
		
		this._isCenterShow = (typeof arg.isCenterShow === 'boolean') ? arg.isCenterShow : true;
		
		if (this._isCenterShow === false) {
			this._posX = (typeof arg.x === 'number') ? arg.x : 0;
			this._posY = (typeof arg.y === 'number') ? arg.y : 0;
		}
		
		this._waitCounter = createObject(CycleCounter);
		this._isForceWait = true;
	},
	
	_checkEventCommand: function() {
		return this.isEventCommandContinue();
	},
	
	_completeEventCommandMemberData: function() {
		if (this._terrain === null) {
			return  EnterResult.NOTENTER;
		}
		
		this._waitCounter.disableGameAcceleration();
		this._waitCounter.setCounterInfo(30);
		
		return EnterResult.OK;
	},
	
	_drawTerrainInfoWindow: function(x, y) {
		var width = this._getWindowWidth();
		var height = this._getWindowHeight(this._terrain);
		var textui = this._getWindowTextUI();
		var pic = textui.getUIImage();
		
		WindowRenderer.drawStretchWindow(x, y, width, height, pic);
		
		x += this._getWindowXPadding();
		y += this._getWindowYPadding();
		this._drawContent(x, y, this._terrain);
	},
	
	_drawContent: function(x, y, terrain) {
		var text;
		var textui = this._getWindowTextUI();
		var font = textui.getFont();
		var color = textui.getColor();
		var length = this._getTextLength();
		
		if (terrain === null) {
			return;
		}
		
		x += 2;
		TextRenderer.drawText(x, y, terrain.getName(), length, color, font);
		
		y += this.getIntervalY();
		this._drawKeyword(x, y, root.queryCommand('avoid_capacity'), terrain.getAvoid());
		
		if (terrain.getDef() !== 0) {
			text = ParamGroup.getParameterName(ParamGroup.getParameterIndexFromType(ParamType.DEF));
			y += this.getIntervalY();
			this._drawKeyword(x, y, text, terrain.getDef());
		}
		
		if (terrain.getMdf() !== 0) {
			text = ParamGroup.getParameterName(ParamGroup.getParameterIndexFromType(ParamType.MDF));
			y += this.getIntervalY();
			this._drawKeyword(x, y, text, terrain.getMdf());
		}
		
		if (terrain.getAutoRecoveryValue() !== 0) {
			y += this.getIntervalY();
			text = 'HP回復';
			this._drawKeyword(x, y, text, terrain.getAutoRecoveryValue());
		}
	},
	
	_drawKeyword: function(x, y, text, value) {
		ItemInfoRenderer.drawKeyword(x, y, text);
		
		x += 45;
		if (value !== 0) {
			TextRenderer.drawSignText(x, y, value > 0 ? ' + ': ' - ');
			if (value < 0) {
				// drawNumberにマイナスは指定できないため、ここで調整
				value *= -1;
			}
		}
		x += 40;
		
		NumberRenderer.drawNumber(x, y, value);
	},
	
	_getPartsCount: function(terrain) {
		var count = 0;
		
		count += 3;
		if (terrain.getDef() !== 0) {
			count++;
		}
		
		if (terrain.getMdf() !== 0) {
			count++;
		}
		
		if (terrain.getAutoRecoveryValue() !== 0) {
			count++;
		}
		
		return count;
	},
	
	_getTextLength: function() {
		return this._getWindowWidth() - DefineControl.getWindowXPadding();
	},
	
	_getWindowWidth: function() {
		return MapParts.Terrain._getWindowWidth();
	},
	
	_getWindowHeight: function(terrain) {
		if (terrain === null) {
			return 0;
		}
		
		return 12 + (this._getPartsCount(terrain) * this.getIntervalY());
	},
	
	_getWindowTextUI: function() {
		return root.queryTextUI('default_window');
	},
	
	_getWindowXPadding: function() {
		return DefineControl.getWindowXPadding();
	},
	
	_getWindowYPadding: function() {
		return DefineControl.getWindowYPadding();
	},
	
	getIntervalY: function() {
		return 20;
	},
	
	_getBasePos: function(terrain) {
		var x = LayoutControl.getCenterX(-1, this._getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._getWindowHeight(terrain));
		
		return createPos(x, y);
	}
}
);

})();
