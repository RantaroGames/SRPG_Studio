  //(改変者追記)：改変元プラグイン「window-mapthumbnail.js」のコメント
  /*--------------------------------------------------------------------------
  MapCommandに「マップ縮小図」という項目を追加します。
  
  作成者:
  サファイアソフト
  http://srpgstudio.com/
  
  更新履歴:
  2015/04/08 公開
  
--------------------------------------------------------------------------*/

/*
■ファイル名
window-mapthumnail_add.js

■SRPG Studio対応バージョン
ver.1.225

■改変内容
・マップコマンド(戦闘マップ内)にも「マップ縮小図」コマンドを追加
・ユニットの位置を示すマークを表示(セーブ・ロード画面に表示されるものと同一の機能)

■使用方法
このプラグインをpluginフォルダに入れる
※ただし、公式追加プラグイン「window-mapthumbnail.js」と同時に使用しないこと

■改変者
ran

■改変履歴
2023/03/07 現在、表示中のマップ範囲を半透明の白色で(color: 0xffffff, alpha: 128）塗りつぶす処理を追加
*/

(function() {

//サムネイルのサイズ
var MapThumbnailWidth = 600;
var MapThumbnailHeight = 440;


var alias1 = SetupCommand.configureCommands;
SetupCommand.configureCommands = function(groupArray) {
	alias1.call(this, groupArray);
	
	groupArray.insertObject(SetupCommand.MapThumbnail, groupArray.length - 1);//数値を変更することでコマンドの位置を調整できる
};

SetupCommand.MapThumbnail = defineObject(BaseListCommand,
{
	_mapThumbnailWindow: null,

	openCommand: function() {
		this._mapThumbnailWindow = createWindowObject(MapThumbnailWindow);
	},
	
	moveCommand: function() {
		return this._mapThumbnailWindow.moveWindow();
	},
	
	drawCommand: function() {
		var x = LayoutControl.getCenterX(-1, this._mapThumbnailWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._mapThumbnailWindow.getWindowHeight());
		
		this._mapThumbnailWindow.drawWindow(x, y);
	},
	
	getCommandName: function() {
		return 'マップ縮小図';
	}
}
);

var MapThumbnailWindow = defineObject(BaseWindow,
{
	_picCache: null,
	_obj: null,
	
	initialize: function() {
		this._obj = this._setPositionSettings();
	},
	
	moveWindowContent: function() {
		if (InputControl.isSelectAction() || InputControl.isCancelAction()) {
			this._playCancelSound();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawWindowContent: function(x, y) {
		var session = root.getCurrentSession();
		if (session === null) return;
		
		var cacheWidth = CurrentMap.getWidth() * GraphicsFormat.MAPCHIP_WIDTH;
		var cacheHeight = CurrentMap.getHeight() * GraphicsFormat.MAPCHIP_HEIGHT;
		var width = this.getWindowWidth() - (DefineControl.getWindowXPadding() * 2);
		var height = this.getWindowHeight() - (DefineControl.getWindowYPadding() * 2);
		var graphicsManager = root.getGraphicsManager();
		var scrollpixelX = session.getScrollPixelX();
		var scrollPixelY = session.getScrollPixelY();
		
		if (this._picCache !== null) {
			if (this._picCache.isCacheAvailable()) {
				this._picCache.drawStretchParts(x, y, width, height, 0, 0, cacheWidth, cacheHeight);
				return;
			}
		}
		else {
			this._picCache = graphicsManager.createCacheGraphics(cacheWidth, cacheHeight);
		}
		
		graphicsManager.setRenderCache(this._picCache);
		root.drawMapAll(session.getCurrentMapInfo());
		
		// 現在、表示中のマップ範囲を白く塗りつぶす
		graphicsManager.fillRange(scrollpixelX, scrollPixelY, root.getGameAreaWidth(), root.getGameAreaHeight(), 0xffffff, 128);
		
		this._drawUnitMark();
		graphicsManager.resetRenderCache();

		this._picCache.drawStretchParts(x, y, width, height, 0, 0, cacheWidth, cacheHeight);
	},
	
	getWindowWidth: function() {
		return MapThumbnailWidth;
	},
	
	getWindowHeight: function() {
		return MapThumbnailHeight;
	},
	
	_playCancelSound: function() {
		var soundHandle = root.querySoundHandle('commandcancel');
		MediaControl.soundPlay(soundHandle);
	},
	
	_setPositionSettings: function() {
		var obj = {}; 
		
		obj.playerArrayX = [];
		obj.playerArrayY = [];
		obj.enemyArrayX = [];
		obj.enemyArrayY = [];
		obj.allyArrayX = [];
		obj.allyArrayY = [];
		
		var session = root.getCurrentSession();
		if (session === null) return obj;
		
		// マップが開かれているシーン以外でmapInfoなどを取得しようとするとゲームの起動ができなくなる
		if (!f_checkSceneType()) return obj;
		
		this._setPositionSettingsInternal(PlayerList.getSortieList(), obj.playerArrayX, obj.playerArrayY);
		this._setPositionSettingsInternal(EnemyList.getAliveList(), obj.enemyArrayX, obj.enemyArrayY);
		this._setPositionSettingsInternal(AllyList.getAliveList(), obj.allyArrayX, obj.allyArrayY);
		
		return obj;
	},
	
	_setPositionSettingsInternal: function(list, arrayX, arrayY) {
		var i, unit;
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			if (unit.isInvisible()) {
				continue;
			}
			
			arrayX.push(unit.getMapX());
			arrayY.push(unit.getMapY());
		}
	},
	
	_drawUnitMark: function() {
		var obj = this._obj;
		var colorArray = this._getMarkColor();
		
		if (typeof obj.playerArrayX === 'undefined' || obj.playerArrayX === null) {
			return;
		}
		
		this._drawUnitMarkInternal(obj.playerArrayX, obj.playerArrayY, colorArray[0]);
		this._drawUnitMarkInternal(obj.enemyArrayX, obj.enemyArrayY, colorArray[1]);
		this._drawUnitMarkInternal(obj.allyArrayX, obj.allyArrayY, colorArray[2]);
	},
	
	_drawUnitMarkInternal: function(arrayX, arrayY, color) {
		var i;
		var count = arrayX.length;
		var canvas = root.getGraphicsManager().getCanvas();
		var width = GraphicsFormat.MAPCHIP_WIDTH;
		var height = GraphicsFormat.MAPCHIP_HEIGHT;
		
		canvas.setFillColor(color, 210);
		canvas.setStrokeInfo(color, 210, 1, true);
		
		for (i = 0; i < count; i++) {
			canvas.drawEllipse(arrayX[i] * width, arrayY[i] * height, width, height);
		}
	},
	
	_getMarkColor: function() {
		return [0x12fcee, 0xef3242, 0x08f511];
	}
}
);


//マップコマンドに追加
var alias02 = MapCommand.configureCommands;
MapCommand.configureCommands = function(groupArray) {
	alias02.call(this, groupArray);
	
	groupArray.insertObject(MapCommand.MapThumbnail, groupArray.length - 1);//数値を変更することでコマンドの位置を調整できる
};

MapCommand.MapThumbnail = defineObject(BaseListCommand,
{
	_mapThumbnailWindow: null,

	openCommand: function() {
		this._mapThumbnailWindow = createWindowObject(MapThumbnailWindow);
	},
	
	moveCommand: function() {
		return this._mapThumbnailWindow.moveWindow();
	},
	
	drawCommand: function() {
		var x = LayoutControl.getCenterX(-1, this._mapThumbnailWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._mapThumbnailWindow.getWindowHeight());
		
		this._mapThumbnailWindow.drawWindow(x, y);
	},
	
	getCommandName: function() {
		return 'マップ縮小図';
	}
}
);

//mapが開かれているシーンを確認
function f_checkSceneType()
{
	return root.getBaseScene() === SceneType.FREE || root.getBaseScene() === SceneType.BATTLESETUP || root.getBaseScene() === SceneType.BATTLERESULT;
}

})();
