/*
■ファイル名
MapParts_MapThumbnail.js

■SRPG Studio対応バージョン
ver.1.278

■プラグインの概要
マップ攻略中にミニマップを表示します
(マップ全景とユニットの位置を示すシンボルを描画する)

ゲーム開始後、環境設定でミニマップの表示サイズ[大, 小, なし]を選ぶことができます
Cキー(オプション1)を押下することでミニマップを一時的に非表示にできます

■使用方法
1．このファイルをpluginフォルダに入れる

※ミニマップの表示形式(サイズ等)を変更したい場合は、下記コード内で設定項目の値を調整してください


■ミニマップ処理について
LoadSaveScreenEx および SaveFileDetailWindow クラスの処理を参考にしています

マップ全景をミニマップサイズに縮小表示する処理のため
あまりにもマップが広すぎる場合やユニット数が膨大になる場合は、画像が潰れて判別し難くなってしまいます
また処理時間が掛かってゲームが重くなる恐れもあります


■作成者
ran

■更新履歴
2023/03/08 新規作成

*/

(function() {

//--------------------------------------
// 設定項目
//--------------------------------------
//　ミニマップのサイズ
var MiniMapSetting = {
	// 幅(環境設定の値[大、小、なし]に対応する配列)
	  MapWidth: [320, 240, 0]
	// 高さ(環境設定の値に対応する配列)
	, MapHeight: [240, 180, 0]
	// アルファ値
	, MapAlpha: 160
	
	// ユニット位置を示すシンボルの色[自軍, 敵軍, 友軍]
	, UnitColor: [0x12fcee, 0xef3242, 0x08f511]
	
	// ミニマップの下地として描画する四角形設定
	// 輪郭の設定[color, alpha, size]
	, StrokeInfo: [0x000033, 255, 4]
	// 塗りつぶしの設定[color, alpha]
	, FillColor: [0x000080, 200]
};


// マップパーツにミニマップを描画する処理を追加する
// マップのスクロール位置によって地形情報ウィンドウがミニマップの上に描画される場合もあるが、ミニマップの視認性は重要度が低いと考えて特に表示位置を調整する処理は加えていない
var _MapPartsCollection__configureMapParts = MapPartsCollection._configureMapParts;
MapPartsCollection._configureMapParts = function(groupArray) {
	groupArray.appendObject(MapParts.MapThumbnail);
	
	_MapPartsCollection__configureMapParts.call(this, groupArray);

};

MapParts.MapThumbnail = defineObject(BaseMapParts,
{
	_picCache: null,
	_obj: null,
	_scrollPos: null,
	_currentPos: null,
	
	setMapCursor: function(object) {
		this._mapCursor = object;
		this._init();
		
		if (this.getConfigFlagValue() !== 2) {
			this._obj = this._setPositionSettings();
			this._scrollPos = this._getScrollPos();
			this._currentPos = this._getCurrentPos();
		}
	},
	
	_init: function() {
		this._picCache = null;
		this._obj = null;
		this._scrollPos = null;
		this._currentPos = null;
	},
	
	// ユニットが設定されたらキャッシュを破棄して画像を再取得する(カーソルを合わせたユニット位置を白丸で表示するため)
	setUnit: function(unit) {
		if (this.getConfigFlagValue() === 2) {
			return;
		}
		
		this._picCache = null;
		this._obj = this._setPositionSettings();
		this._scrollPos = this._getScrollPos();
		this._currentPos = this._getCurrentPos();
	},
	
	moveMapParts: function() {
		if (this.getConfigFlagValue() === 2) {
			return MoveResult.END;
		}
		
		// (スクロール値が異なる || 位置座標の記憶とユニット数が異なる)場合、キャッシュを破棄して画像を再取得する
		if (!this._checkScroll() || !this._checkUnitCount()) {
			this._picCache = null;
			this._obj = this._setPositionSettings();
		}
		
		this._currentPos = this._getCurrentPos();
		
		return MoveResult.END;
	},
	
	// スクロール値が記憶と異なった場合を検知する
	_checkScroll: function() {
		var pos = this._getScrollPos();
		
		if (this._scrollPos === null) return false;
		if (this._scrollPos.x !== pos.x || this._scrollPos.y !== pos.y) {
			this._scrollPos = pos;
			return false;
		}
		return true;
	},
	
	// ユニットの死亡や消去、登場、援軍の出現などの理由でユニット数が変化した場合を検知する
	// getSortieListは「出撃・生存・フュージョンされていない」ユニットを格納している
	// getAliveListは「生存・フュージョンされていない」ユニットを格納している
	_checkUnitCount: function() {
		var obj = this._obj;
		var playerList = PlayerList.getSortieList();
		var enemyList = EnemyList.getAliveList();
		var allyList = AllyList.getAliveList();
		
		if (playerList.getCount() !== obj.playerArrayX.length ||
			enemyList.getCount() !== obj.enemyArrayX.length ||
			allyList.getCount() !== obj.allyArrayX.length
		) {
			return false;
		}
		
		return true;
	},
	
	// ピクセル単位のスクロール値を取得する
	_getScrollPos: function() {
		var session = root.getCurrentSession();
		if (session === null) return null;
		
		var pos = {};
		pos.x = session.getScrollPixelX();
		pos.y = session.getScrollPixelY();

		return pos;
	},
	
	drawMapParts: function() {
		var x, y, unit;
		
		// 環境設定でミニマップを非表示にしている
 		if (this.getConfigFlagValue() === 2) {
			return;
		}
		
		// オプションキー(Cキー)押下時はミニマップを描画しない 
		if (root.isInputState(InputType.BTN3)) {
			return;
		}
		
		// ユニットを選択した(向きが正面では無い)時は、ミニマップを描画しない
		unit = this.getMapPartsTarget();
		if (unit !== null && unit.getDirection() !== DirectionType.NULL) {
			return;
		}
		
		// ミニマップを描画する原点座標
		x = root.getGameAreaWidth() - this.getWindowWidth() - 20;
		y = root.getGameAreaHeight() - this.getWindowHeight() - 20;
		
		this._drawMain(x, y);
	},
	
	_drawMain: function(x, y) {
		this.drawWindowContent(x, y);
	},
	
	drawWindowContent: function(x, y) {
		var session = root.getCurrentSession();
		if (session === null) return;
		
		var cacheWidth = CurrentMap.getWidth() * GraphicsFormat.MAPCHIP_WIDTH;
		var cacheHeight = CurrentMap.getHeight() * GraphicsFormat.MAPCHIP_HEIGHT;
		var width = this.getWindowWidth();
		var height = this.getWindowHeight();
		var graphicsManager = root.getGraphicsManager();
		var scrollpixelX = session.getScrollPixelX();
		var scrollPixelY = session.getScrollPixelY();
		
		// ミニマップの下地を描画する
		this._drawWindowInternal(x, y, width, height);
		
		if (this._picCache !== null) {
			// キャッシュが有効であれば、アルファ値を指定してからミニマップサイズで描画する
			if (this._picCache.isCacheAvailable()) {
				this._picCache.setAlpha(MiniMapSetting.MapAlpha);
				this._picCache.drawStretchParts(x, y, width, height, 0, 0, cacheWidth, cacheHeight);
				return;
			}
		}
		else {
			this._picCache = graphicsManager.createCacheGraphics(cacheWidth, cacheHeight);
		}
		
		//　ミニマップとして描画する画像を指定したキャッシュを設定する
		graphicsManager.setRenderCache(this._picCache);
		
		// マップのサムネイル画像を描画する
		root.drawMapAll(session.getCurrentMapInfo());
		
		// スクロールしている範囲を白で半透明に塗りつぶす
		graphicsManager.fillRange(scrollpixelX, scrollPixelY, root.getGameAreaWidth(), root.getGameAreaHeight(), 0xffffff, 120);
		
		// ユニット位置を描画する
		this._drawUnitMark();
		
		// 描画先の指定をキャッシュから通常に戻す
		graphicsManager.resetRenderCache();
		
		// ミニマップを半透明で描画したいのでアルファ値を変更する
		this._picCache.setAlpha(MiniMapSetting.MapAlpha);
		this._picCache.drawStretchParts(x, y, width, height, 0, 0, cacheWidth, cacheHeight);
	},
	
	getWindowWidth: function() {
		var index = this.getConfigFlagValue();
		
		if (typeof index !== 'number' || index < 0 || index > 2) {
			return 0;
		}
		if (Object.prototype.toString.call(MiniMapSetting.MapWidth) !== '[object Array]') {
			return 0;
		}
		
		return MiniMapSetting.MapWidth[index];
	},
	
	getWindowHeight: function() {
		var index = this.getConfigFlagValue();
		
		if (typeof index !== 'number' || index < 0 || index > 2) {
			return 0;
		}
		if (Object.prototype.toString.call(MiniMapSetting.MapHeight) !== '[object Array]') {
			return 0;
		}
		
		return MiniMapSetting.MapHeight[index];
	},
		
	getWindowTextUI: function() {
		return root.queryTextUI('default_window');
	},
	
	// ウィンドウ画像を描画する代わりにgetCanvas()で四角形を描画する
	_drawWindowInternal: function(x, y, width, height) {
		var graphicsManager = root.getGraphicsManager();			
		var canvas = graphicsManager.getCanvas();
		var strokeInfo = MiniMapSetting.StrokeInfo;
		var fillColor = MiniMapSetting.FillColor;
		
		canvas.setStrokeInfo(strokeInfo[0], strokeInfo[1], strokeInfo[2], true);
		canvas.setFillColor(fillColor[0], fillColor[1]);
		canvas.drawRectangle(x, y, width, height);
		
		var color = 0x000066;
		var font = TextRenderer.getDefaultFont();
		TextRenderer.drawKeywordText(x + this.getWindowWidth() - 150,  y + this.getWindowHeight(), 'C：ミニマップ非表示', -1, color, font);
	},
	
	// ユニットの位置座標を取得して配列に格納する
	_setPositionSettings: function() {
//		root.watchTime();
		var session = root.getCurrentSession();
		if (session === null) return null;
		
		// マップが開かれているシーンでなければ取得しない
		if (!f_checkSceneType()) return null;

		var obj = {};
		obj.playerArrayX = [];
		obj.playerArrayY = [];
		obj.enemyArrayX = [];
		obj.enemyArrayY = [];
		obj.allyArrayX = [];
		obj.allyArrayY = [];
		
		this._setPositionSettingsInternal(PlayerList.getSortieList(), obj.playerArrayX, obj.playerArrayY);
		this._setPositionSettingsInternal(EnemyList.getAliveList(), obj.enemyArrayX, obj.enemyArrayY);
		this._setPositionSettingsInternal(AllyList.getAliveList(), obj.allyArrayX, obj.allyArrayY);

//		root.log('_setPositionSettings:' + root.getElapsedTime());
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

	// カーソルを合わせているユニットが存在していれば、その座標を記憶しておく
	_getCurrentPos: function() {
		var pos = null;
		var unit = this.getMapPartsTarget();
		
		if (unit !== null) {
			pos = {
				x: unit.getMapX(),
				y: unit.getMapY()
			};
		}
		return pos;
	},
	
	_drawUnitMark: function() {
		var obj = this._obj;
		var colorArray = this._getMarkColor();

		if (obj === null) return;
		
		this._drawUnitMarkInternal(obj.playerArrayX, obj.playerArrayY, colorArray[0]);
		this._drawUnitMarkInternal(obj.enemyArrayX, obj.enemyArrayY, colorArray[1]);
		this._drawUnitMarkInternal(obj.allyArrayX, obj.allyArrayY, colorArray[2]);
			
		if (this._currentPos === null) return;
		if (typeof this._currentPos.x === 'number' && typeof this._currentPos.y === 'number') {
			this._drawCurrentPosMark(this._currentPos.x, this._currentPos.y);
		}
	},
	
	_drawUnitMarkInternal: function(arrayX, arrayY, color) {
		var i;
		var count = arrayX.length;
		var canvas = root.getGraphicsManager().getCanvas();
		var width = GraphicsFormat.MAPCHIP_WIDTH;
		var height = GraphicsFormat.MAPCHIP_HEIGHT;
		
		canvas.setFillColor(color, 210);
//		canvas.setStrokeInfo(color, 210, 1, true);
		
		for (i = 0; i < count; i++) {
			canvas.drawEllipse(arrayX[i] * width, arrayY[i] * height, width, height);
		}
	},
	
	// カーソルが合っているユニットの位置を白丸で塗りつぶす
	_drawCurrentPosMark: function(x, y) {
		var canvas = root.getGraphicsManager().getCanvas();
		var width = GraphicsFormat.MAPCHIP_WIDTH;
		var height = GraphicsFormat.MAPCHIP_HEIGHT;
		
		canvas.setFillColor(0xffffff, 255);
		canvas.drawEllipse(x * width, y * height, width, height);
	},
	
	_getMarkColor: function() {
		return MiniMapSetting.UnitColor;
	},
	
	// 環境設定のミニマップ表示形式の値を取得する[大、小、なし]
	getConfigFlagValue: function() {
		return ConfigItem.MapParts_MiniMap.getFlagValue();
	}
}
);

// mapが開かれているシーンを確認する。SceneType.BATTLERESULではマップ攻略が終了しているので除外している
function f_checkSceneType()
{
	var baseScene = root.getBaseScene();
	return baseScene === SceneType.FREE || baseScene === SceneType.BATTLESETUP;
}


//----------------------------
// コンフィグ設定コマンド追加
//----------------------------
var alias_001 = ConfigWindow._configureConfigItem;
ConfigWindow._configureConfigItem = function(groupArray) {
	alias_001.call(this, groupArray);
	
	groupArray.appendObject(ConfigItem.MapParts_MiniMap);
};

ConfigItem.MapParts_MiniMap = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getExternalData().env.MapParts_MiniMap = index;
	},
	
	getFlagValue: function() {
		if (typeof root.getExternalData().env.MapParts_MiniMap !== 'number') {
			return 2;
		}
	
		return root.getExternalData().env.MapParts_MiniMap;
	},
	
	getFlagCount: function() {
		return 3;
	},
	
	getConfigItemTitle: function() {
		return 'ミニマップ表示';
	},
	
	getConfigItemDescription: function() {
		return 'マップ全景とユニット位置を示した縮小図を表示します';
	},
	
	getObjectArray: function() {
		return ['大', '小', 'なし'];
	}
}
);

})();
