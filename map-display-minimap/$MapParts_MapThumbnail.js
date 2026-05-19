/*
■ファイル名
MapParts_MapThumbnail.js

■SRPG Studio対応バージョン
ver.1.321

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
2023/03/20 表示切替方式を変更(cキーで大→小→非表示→大...)
2025/01/20 マップカーソルが画面右半分にある時は、ミニマップ表示位置を左側に移動させるようにした
2025/07/13 環境設定で「なし」を設定している際に不要な処理が入っていた問題を修正
2026/05/10 コードのリファクタリング

*/

(function() {

//--------------------------------------
// 設定項目
//--------------------------------------
var MiniMapSetting = {
    // 幅(環境設定の値[大, 小, 非表示, なし]に対応する配列)
    MapWidth: [240, 200, 0, 0],
    // 高さ(環境設定の値に対応する配列)
    MapHeight: [180, 150, 0, 0],
    // ミニマップ自体のアルファ値
    MapAlpha: 160,
    
    // ユニット位置を示すシンボルの色[自軍, 敵軍, 友軍]
    UnitColor: [0x12fcee, 0xef3242, 0x08f511],
    // 選択中のユニット（カーソル位置）を強調する色
    CurrentUnitColor: 0xffffff,
    
    // ミニマップの下地として描画する四角形設定
    // 輪郭の設定[color, alpha, size]
    StrokeInfo: [0x000033, 255, 2],
    // 塗りつぶしの設定[color, alpha]
    FillColor: [0x000080, 160],
    
    // スクロール範囲（カメラ枠）の色と透明度
    ScrollRangeColor: 0xffffff,
    ScrollRangeAlpha: 120,

    // マージン設定
    Margin: 20,
    
    // コンフィグ保存用のキー名
    ConfigKey: 'MapParts_MiniMap'
};

//-------------------------------------------------------------------------
// MapPartsCollection の拡張
//-------------------------------------------------------------------------
var _MapPartsCollection__configureMapParts = MapPartsCollection._configureMapParts;
MapPartsCollection._configureMapParts = function(groupArray) {
    // 標準パーツの前にミニマップを登録（描画順の考慮）
    groupArray.appendObject(MapParts.MapThumbnail);
    _MapPartsCollection__configureMapParts.call(this, groupArray);
};

//-------------------------------------------------------------------------
// MapParts.MapThumbnail オブジェクトの定義
//-------------------------------------------------------------------------
MapParts.MapThumbnail = defineObject(BaseMapParts,
{
    _picCache: null,
    _obj: null,
    _scrollPos: null,
    _currentPos: null,
    
    setMapCursor: function(object) {
        this._mapCursor = object;
        this._init();
        
        if (this.getConfigFlagValue() !== 3) {
            this._refreshData();
        }
    },
    
    _init: function() {
        this._picCache = null;
        this._obj = null;
        this._scrollPos = null;
        this._currentPos = null;
    },
    
    // ユニット情報が更新された際に呼び出される
    setUnit: function(unit) {
        if (this.getConfigFlagValue() === 3) {
            return;
        }
        this._picCache = null;
        this._refreshData();
    },

    _refreshData: function() {
        this._obj = this._setPositionSettings();
        this._scrollPos = this._getScrollPos();
        this._currentPos = this._getCurrentPos();
    },
    
    moveMapParts: function() {
        if (this.getConfigFlagValue() >= 2) {
            return MoveResult.END;
        }
        
        // スクロール位置の変化、またはユニット数の変化を検知してキャッシュを更新
        if (!this._checkScroll() || !this._checkUnitCount()) {
            this._picCache = null;
            this._obj = this._setPositionSettings();
        }
        
        this._currentPos = this._getCurrentPos();
        
        return MoveResult.END;
    },
    
    _checkScroll: function() {
        var pos = this._getScrollPos();
        if (!this._scrollPos) return false;

        if (this._scrollPos.x !== pos.x || this._scrollPos.y !== pos.y) {
            this._scrollPos = pos;
            return false;
        }
        return true;
    },
    
    _checkUnitCount: function() {
        if (!this._obj) return false;

        var playerList = PlayerList.getSortieList();
        var enemyList = EnemyList.getAliveList();
        var allyList = AllyList.getAliveList();
        
        return (
            playerList.getCount() === this._obj.playerArrayX.length &&
            enemyList.getCount() === this._obj.enemyArrayX.length &&
            allyList.getCount() === this._obj.allyArrayX.length
        );
    },
    
    _getScrollPos: function() {
        var session = root.getCurrentSession();
        if (!session) return {x: 0, y: 0};
        
        return {
            x: session.getScrollPixelX(),
            y: session.getScrollPixelY()
        };
    },
    
    drawMapParts: function() {
        // コンフィグで「非表示」または「なし」
        if (this.getConfigFlagValue() > 1) {
            return;
        }
        
        // ユニット操作中（向きが決定されている時など）は描画しない
        var unit = this.getMapPartsTarget();
        if (unit !== null && unit.getDirection() !== DirectionType.NULL) {
            return;
        }
        
        var x = this._getPositionX();
        var y = root.getGameAreaHeight() - this.getWindowHeight() - MiniMapSetting.Margin;
        
        this._drawMain(x, y);
    },
    
    _getPositionX: function() {
        var cursorX = LayoutControl.getPixelX(this.getMapPartsX());
        var cursorY = LayoutControl.getPixelY(this.getMapPartsY());
        var screenMidX = root.getGameAreaWidth() / 2;
        var screenMidY = root.getGameAreaHeight() / 2;
        
        var width = this.getWindowWidth();
        var rightX = root.getGameAreaWidth() - width - MiniMapSetting.Margin;
        
        // カーソルが右下にある場合は左側に表示、それ以外は右側に表示
        if (cursorX > screenMidX && cursorY > screenMidY) {
            return MiniMapSetting.Margin;
        } else {
            return rightX;
        }
    },

    _drawMain: function(x, y) {
        var session = root.getCurrentSession();
        if (!session) return;
        
        var mapInfo = session.getCurrentMapInfo();
        var cacheWidth = mapInfo.getMapWidth() * GraphicsFormat.MAPCHIP_WIDTH;
        var cacheHeight = mapInfo.getMapHeight() * GraphicsFormat.MAPCHIP_HEIGHT;
        var width = this.getWindowWidth();
        var height = this.getWindowHeight();
        var graphicsManager = root.getGraphicsManager();
        
        // 1. 背景ウィンドウの描画
        this._drawWindowInternal(x, y, width, height);
        
        // 2. キャッシュグラフィックスの準備
        if (this._picCache === null || !this._picCache.isCacheAvailable()) {
            this._picCache = graphicsManager.createCacheGraphics(cacheWidth, cacheHeight);
            
            // キャッシュへの描画開始
            graphicsManager.setRenderCache(this._picCache);
            
            // マップ全景描画
            root.drawMapAll(mapInfo);
            
            // スクロール範囲の強調（白枠）
            graphicsManager.fillRange(
                this._scrollPos.x, this._scrollPos.y, 
                root.getGameAreaWidth(), root.getGameAreaHeight(), 
                MiniMapSetting.ScrollRangeColor, MiniMapSetting.ScrollRangeAlpha
            );
            
            // ユニットマーカー描画
            this._drawUnitMark();
            
            graphicsManager.resetRenderCache();
        }
        
        // 3. キャッシュをミニマップサイズにリサイズして描画
        this._picCache.setAlpha(MiniMapSetting.MapAlpha);
        this._picCache.drawStretchParts(x, y, width, height, 0, 0, cacheWidth, cacheHeight);
    },
    
    getWindowWidth: function() {
        var index = this.getConfigFlagValue();
        return (index >= 0 && index < MiniMapSetting.MapWidth.length) ? MiniMapSetting.MapWidth[index] : 0;
    },
    
    getWindowHeight: function() {
        var index = this.getConfigFlagValue();
        return (index >= 0 && index < MiniMapSetting.MapHeight.length) ? MiniMapSetting.MapHeight[index] : 0;
    },
    
    _drawWindowInternal: function(x, y, width, height) {
        var canvas = root.getGraphicsManager().getCanvas();
        var stroke = MiniMapSetting.StrokeInfo;
        var fill = MiniMapSetting.FillColor;
        
        canvas.setStrokeInfo(stroke[0], stroke[1], stroke[2], true);
        canvas.setFillColor(fill[0], fill[1]);
        canvas.drawRectangle(x, y, width, height);
        
        // 操作ガイドテキスト
        var color = 0xffffcc;
        var font = TextRenderer.getDefaultFont();
        TextRenderer.drawKeywordText(x + width - 90, y + height - 20, 'C：表示切替', -1, color, font);
    },
    
    _setPositionSettings: function() {
        if (!this._isMapScene()) return null;

        var obj = {
            playerArrayX: [], playerArrayY: [],
            enemyArrayX: [], enemyArrayY: [],
            allyArrayX: [], allyArrayY: []
        };
        
        this._storeUnitPositions(PlayerList.getSortieList(), obj.playerArrayX, obj.playerArrayY);
        this._storeUnitPositions(EnemyList.getAliveList(), obj.enemyArrayX, obj.enemyArrayY);
        this._storeUnitPositions(AllyList.getAliveList(), obj.allyArrayX, obj.allyArrayY);

        return obj;
    },
    
    _storeUnitPositions: function(list, arrayX, arrayY) {
        var i, unit;
        var count = list.getCount();
        
        for (i = 0; i < count; i++) {
            unit = list.getData(i);
            if (unit.isInvisible()) continue;
            
            arrayX.push(unit.getMapX());
            arrayY.push(unit.getMapY());
        }
    },

    _getCurrentPos: function() {
        var unit = this.getMapPartsTarget();
        if (unit) {
            return { x: unit.getMapX(), y: unit.getMapY() };
        }
        return null;
    },
    
    _drawUnitMark: function() {
        if (!this._obj) return;
        
        var colors = MiniMapSetting.UnitColor;
        
        this._drawGroupMark(this._obj.playerArrayX, this._obj.playerArrayY, colors[0]);
        this._drawGroupMark(this._obj.enemyArrayX, this._obj.enemyArrayY, colors[1]);
        this._drawGroupMark(this._obj.allyArrayX, this._obj.allyArrayY, colors[2]);
            
        if (this._currentPos) {
            this._drawPointMark(this._currentPos.x, this._currentPos.y, MiniMapSetting.CurrentUnitColor, 255);
        }
    },
    
    _drawGroupMark: function(arrayX, arrayY, color) {
        var i, x, y;
        var count = arrayX.length;
        var canvas = root.getGraphicsManager().getCanvas();
        var w = GraphicsFormat.MAPCHIP_WIDTH;
        var h = GraphicsFormat.MAPCHIP_HEIGHT;
        
        canvas.setFillColor(color, 210);
        for (i = 0; i < count; i++) {
            canvas.drawEllipse(arrayX[i] * w, arrayY[i] * h, w, h);
        }
    },
    
    _drawPointMark: function(mapX, mapY, color, alpha) {
        var canvas = root.getGraphicsManager().getCanvas();
        var w = GraphicsFormat.MAPCHIP_WIDTH;
        var h = GraphicsFormat.MAPCHIP_HEIGHT;
        
        canvas.setFillColor(color, alpha);
        canvas.drawEllipse(mapX * w, mapY * h, w, h);
    },
    
    _isMapScene: function() {
        var s = root.getBaseScene();
        return s === SceneType.FREE || s === SceneType.BATTLESETUP;
    },

    getConfigFlagValue: function() {
        return ConfigItem.MapParts_MiniMap.getFlagValue();
    }
});

//-------------------------------------------------------------------------
// MapEdit の拡張 (Cキーによる表示切替)
//-------------------------------------------------------------------------
var _MapEdit__optionAction = MapEdit._optionAction;
MapEdit._optionAction = function(unit) {
    var index = ConfigItem.MapParts_MiniMap.getFlagValue();
    
    // ユニットを選択していない状態でのオプションキー
    if (unit === null && index !== 3) {
        index = (index + 1) % 3; // 大 -> 小 -> 非表示 -> 大...
        ConfigItem.MapParts_MiniMap.selectFlag(index);
    }
    
    return _MapEdit__optionAction.call(this, unit);
};

//-------------------------------------------------------------------------
// コンフィグ項目への追加
//-------------------------------------------------------------------------
var _ConfigWindow__configureConfigItem = ConfigWindow._configureConfigItem;
ConfigWindow._configureConfigItem = function(groupArray) {
    _ConfigWindow__configureConfigItem.call(this, groupArray);
    groupArray.appendObject(ConfigItem.MapParts_MiniMap);
};

ConfigItem.MapParts_MiniMap = defineObject(BaseConfigtItem,
{
    selectFlag: function(index) {
        root.getExternalData().env[MiniMapSetting.ConfigKey] = index;
    },
    
    getFlagValue: function() {
        var val = root.getExternalData().env[MiniMapSetting.ConfigKey];
        return (typeof val === 'number') ? val : 3; // デフォルトは「なし」
    },
    
    getFlagCount: function() {
        return 4;
    },
    
    getConfigItemTitle: function() {
        return 'ミニマップ表示';
    },
    
    getConfigItemDescription: function() {
        return 'マップ全景とユニット位置を示した縮小図を表示します';
    },
    
    getObjectArray: function() {
        return ['大', '小', '非表示', 'なし'];
    }
});

})();