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


■作成者
ran

■更新履歴
2023/03/08 新規作成
2023/03/20 表示切替方式を変更(cキーで大→小→非表示→大...)
2025/01/20 マップカーソルが画面右半分にある時は、ミニマップ表示位置を左側に移動させるようにした
2025/07/13 環境設定で「なし」を設定している際に不要な処理が入っていた問題を修正
2026/05/10 コードのリファクタリング
2026/05/19 コードのリファクタリング
- ユニット座標管理をオブジェクト配列へ統一
- 描画処理を共通化
- キャッシュ更新判定整理
- マップ全景キャッシュと動的描画の分離
- root.drawMapAll の再実行頻度削減
- 保守性向上

■注意
2026/05/10版以前のものとは互換性がありません。
同時導入しないでください。


*/

(function() {

//-------------------------------------------------
// 設定
//-------------------------------------------------
var MiniMapSetting = {
    // 幅(環境設定の値[大, 小, 非表示, なし]に対応する配列)
    MapWidth: [240, 200, 0, 0],
    // 高さ(環境設定の値に対応する配列)
    MapHeight: [180, 150, 0, 0],
    // ミニマップ自体のアルファ値
    MapAlpha: 160,
    
    // ユニット位置を示すシンボルの色[自軍, 敵軍, 友軍]
    UnitColor: [
        0x12fcee,
        0xef3242,
        0x08f511
    ],
    
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

//-------------------------------------------------
// MapParts登録
//-------------------------------------------------
var _MapPartsCollection_configureMapParts =
    MapPartsCollection._configureMapParts;

MapPartsCollection._configureMapParts = function(groupArray) {

    groupArray.appendObject(MapParts.MapThumbnail);

    _MapPartsCollection_configureMapParts.call(
        this,
        groupArray
    );
};

//-------------------------------------------------
// MiniMap本体
//-------------------------------------------------
MapParts.MapThumbnail = defineObject(BaseMapParts,
{
    _baseCache: null,
    _overlayCache: null,

    _mapData: null,
    _scrollPos: null,
    _currentPos: null,

    _cacheDirty: true,

    //-------------------------------------------------
    // 初期化
    //-------------------------------------------------
    setMapCursor: function(object) {

        this._mapCursor = object;

        this._initialize();

        if (!this._isDisabled()) {
            this._refreshAll();
        }
    },

    _initialize: function() {

        this._baseCache = null;
        this._overlayCache = null;

        this._mapData = null;
        this._scrollPos = null;
        this._currentPos = null;

        this._cacheDirty = true;
    },

    //-------------------------------------------------
    // ユニット更新
    //-------------------------------------------------
    setUnit: function(unit) {

        if (this._isDisabled()) {
            return;
        }

        this._cacheDirty = true;
    },

    //-------------------------------------------------
    // 更新
    //-------------------------------------------------
    moveMapParts: function() {

        if (this._isHidden()) {
            return MoveResult.END;
        }

        this._currentPos = this._getCurrentPos();

        if (this._isOverlayDirty()) {
            this._cacheDirty = true;
        }

        return MoveResult.END;
    },

    //-------------------------------------------------
    // 描画
    //-------------------------------------------------
    drawMapParts: function() {

        if (this._isHidden()) {
            return;
        }

        var unit = this.getMapPartsTarget();

        if (unit !== null &&
            unit.getDirection() !== DirectionType.NULL) {
            return;
        }

        var x = this._getPositionX();
        var y =
            root.getGameAreaHeight() -
            this.getWindowHeight() -
            MiniMapSetting.Margin;

        this._drawMiniMap(x, y);
    },

    //-------------------------------------------------
    // ミニマップ描画
    //-------------------------------------------------
    _drawMiniMap: function(x, y) {

        var session = root.getCurrentSession();

        if (!session) {
            return;
        }

        var mapInfo = session.getCurrentMapInfo();

        var cacheWidth =
            mapInfo.getMapWidth() *
            GraphicsFormat.MAPCHIP_WIDTH;

        var cacheHeight =
            mapInfo.getMapHeight() *
            GraphicsFormat.MAPCHIP_HEIGHT;

        var width = this.getWindowWidth();
        var height = this.getWindowHeight();

        var graphicsManager =
            root.getGraphicsManager();

        //-------------------------------------------------
        // 背景
        //-------------------------------------------------
        this._drawWindow(x, y, width, height);

        //-------------------------------------------------
        // ベースキャッシュ生成
        //-------------------------------------------------
        if (this._baseCache === null ||
            !this._baseCache.isCacheAvailable()) {

            this._createBaseCache(
                cacheWidth,
                cacheHeight,
                mapInfo
            );
        }

        //-------------------------------------------------
        // Overlay生成
        //-------------------------------------------------
        if (this._cacheDirty ||
            this._overlayCache === null ||
            !this._overlayCache.isCacheAvailable()) {

            this._refreshAll();

            this._createOverlayCache(
                cacheWidth,
                cacheHeight
            );

            this._cacheDirty = false;
        }

        //-------------------------------------------------
        // 描画
        //-------------------------------------------------
        this._baseCache.setAlpha(
            MiniMapSetting.MapAlpha
        );

        this._baseCache.drawStretchParts(
            x,
            y,
            width,
            height,
            0,
            0,
            cacheWidth,
            cacheHeight
        );

        this._overlayCache.drawStretchParts(
            x,
            y,
            width,
            height,
            0,
            0,
            cacheWidth,
            cacheHeight
        );
    },

    //-------------------------------------------------
    // BaseCache生成
    //-------------------------------------------------
    _createBaseCache: function(
        cacheWidth,
        cacheHeight,
        mapInfo
    ) {

        var graphicsManager =
            root.getGraphicsManager();

        this._baseCache =
            graphicsManager.createCacheGraphics(
                cacheWidth,
                cacheHeight
            );

        graphicsManager.setRenderCache(
            this._baseCache
        );

        root.drawMapAll(mapInfo);

        graphicsManager.resetRenderCache();
    },

    //-------------------------------------------------
    // Overlay生成
    //-------------------------------------------------
    _createOverlayCache: function(
        cacheWidth,
        cacheHeight
    ) {

        var graphicsManager =
            root.getGraphicsManager();

        this._overlayCache =
            graphicsManager.createCacheGraphics(
                cacheWidth,
                cacheHeight
            );

        graphicsManager.setRenderCache(
            this._overlayCache
        );

        this._drawScrollRange();

        this._drawUnitMarks();

        graphicsManager.resetRenderCache();
    },

    //-------------------------------------------------
    // スクロール範囲
    //-------------------------------------------------
    _drawScrollRange: function() {

        var gm = root.getGraphicsManager();

        gm.fillRange(
            this._scrollPos.x,
            this._scrollPos.y,
            root.getGameAreaWidth(),
            root.getGameAreaHeight(),
            MiniMapSetting.ScrollRangeColor,
            MiniMapSetting.ScrollRangeAlpha
        );
    },

    //-------------------------------------------------
    // ユニット描画
    //-------------------------------------------------
    _drawUnitMarks: function() {

        var data = this._mapData;

        if (!data) {
            return;
        }

        var colors =
            MiniMapSetting.UnitColor;

        this._drawUnitGroup(
            data.player,
            colors[0]
        );

        this._drawUnitGroup(
            data.enemy,
            colors[1]
        );

        this._drawUnitGroup(
            data.ally,
            colors[2]
        );

        if (this._currentPos) {

            this._drawUnitGroup(
                [this._currentPos],
                MiniMapSetting.CurrentUnitColor,
                255
            );
        }
    },

    //-------------------------------------------------
    // 共通ユニット描画
    //-------------------------------------------------
    _drawUnitGroup: function(
        group,
        color,
        alpha
    ) {

        var i;
        var pos;

        var canvas =
            root.getGraphicsManager().getCanvas();

        var w =
            GraphicsFormat.MAPCHIP_WIDTH;

        var h =
            GraphicsFormat.MAPCHIP_HEIGHT;

        alpha = alpha || 210;

        canvas.setFillColor(
            color,
            alpha
        );

        for (i = 0; i < group.length; i++) {

            pos = group[i];

            canvas.drawEllipse(
                pos.x * w,
                pos.y * h,
                w,
                h
            );
        }
    },

    //-------------------------------------------------
    // データ更新
    //-------------------------------------------------
    _refreshAll: function() {

        this._mapData =
            this._createMapData();

        this._scrollPos =
            this._getScrollPos();

        this._currentPos =
            this._getCurrentPos();
    },

    //-------------------------------------------------
    // マップデータ生成
    //-------------------------------------------------
    _createMapData: function() {

        if (!this._isMapScene()) {
            return null;
        }

        return {
            player: this._createUnitGroup(
                PlayerList.getSortieList()
            ),

            enemy: this._createUnitGroup(
                EnemyList.getAliveList()
            ),

            ally: this._createUnitGroup(
                AllyList.getAliveList()
            )
        };
    },

    //-------------------------------------------------
    // ユニット座標生成
    //-------------------------------------------------
    _createUnitGroup: function(list) {

        var i;
        var unit;

        var count = list.getCount();

        var group = [];

        for (i = 0; i < count; i++) {

            unit = list.getData(i);

            if (unit.isInvisible()) {
                continue;
            }

            group.push({
                x: unit.getMapX(),
                y: unit.getMapY()
            });
        }

        return group;
    },

    //-------------------------------------------------
    // 現在位置取得
    //-------------------------------------------------
    _getCurrentPos: function() {

        var unit =
            this.getMapPartsTarget();

        if (!unit) {
            return null;
        }

        return {
            x: unit.getMapX(),
            y: unit.getMapY()
        };
    },

    //-------------------------------------------------
    // スクロール取得
    //-------------------------------------------------
    _getScrollPos: function() {

        var session =
            root.getCurrentSession();

        if (!session) {

            return {
                x: 0,
                y: 0
            };
        }

        return {
            x: session.getScrollPixelX(),
            y: session.getScrollPixelY()
        };
    },

    //-------------------------------------------------
    // Overlay更新判定
    //-------------------------------------------------
    _isOverlayDirty: function() {

        var pos = this._getScrollPos();

        if (!this._scrollPos) {
            return true;
        }

        return (
            pos.x !== this._scrollPos.x ||
            pos.y !== this._scrollPos.y
        );
    },

    //-------------------------------------------------
    // Window描画
    //-------------------------------------------------
    _drawWindow: function(
        x,
        y,
        width,
        height
    ) {

        var canvas =
            root.getGraphicsManager()
            .getCanvas();

        var stroke =
            MiniMapSetting.StrokeInfo;

        var fill =
            MiniMapSetting.FillColor;

        canvas.setStrokeInfo(
            stroke[0],
            stroke[1],
            stroke[2],
            true
        );

        canvas.setFillColor(
            fill[0],
            fill[1]
        );

        canvas.drawRectangle(
            x,
            y,
            width,
            height
        );

        TextRenderer.drawKeywordText(
            x + width - 90,
            y + height - 20,
            'C：表示切替',
            -1,
            0xffffcc,
            TextRenderer.getDefaultFont()
        );
    },

    //-------------------------------------------------
    // 配置位置
    //-------------------------------------------------
    _getPositionX: function() {

        var cursorX =
            LayoutControl.getPixelX(
                this.getMapPartsX()
            );

        var cursorY =
            LayoutControl.getPixelY(
                this.getMapPartsY()
            );

        var width =
            this.getWindowWidth();

        var rightX =
            root.getGameAreaWidth() -
            width -
            MiniMapSetting.Margin;

        var centerX =
            root.getGameAreaWidth() / 2;

        var centerY =
            root.getGameAreaHeight() / 2;

        if (cursorX > centerX &&
            cursorY > centerY) {

            return MiniMapSetting.Margin;
        }

        return rightX;
    },

    //-------------------------------------------------
    // サイズ
    //-------------------------------------------------
    getWindowWidth: function() {

        return MiniMapSetting.MapWidth[
            this.getConfigFlagValue()
        ];
    },

    getWindowHeight: function() {

        return MiniMapSetting.MapHeight[
            this.getConfigFlagValue()
        ];
    },

    //-------------------------------------------------
    // Scene判定
    //-------------------------------------------------
    _isMapScene: function() {

        var scene =
            root.getBaseScene();

        return (
            scene === SceneType.FREE ||
            scene === SceneType.BATTLESETUP
        );
    },

    //-------------------------------------------------
    // Config
    //-------------------------------------------------
    _isHidden: function() {

        return this.getConfigFlagValue() >= 2;
    },

    _isDisabled: function() {

        return this.getConfigFlagValue() === 3;
    },

    getConfigFlagValue: function() {

        return ConfigItem.MapParts_MiniMap
            .getFlagValue();
    }
});

//-------------------------------------------------
// Cキー切替
//-------------------------------------------------
var _MapEdit_optionAction =
    MapEdit._optionAction;

MapEdit._optionAction = function(unit) {

    var index =
        ConfigItem.MapParts_MiniMap
        .getFlagValue();

    if (unit === null &&
        index !== 3) {

        index = (index + 1) % 3;

        ConfigItem.MapParts_MiniMap
            .selectFlag(index);
    }

    return _MapEdit_optionAction.call(
        this,
        unit
    );
};

//-------------------------------------------------
// Config追加
//-------------------------------------------------
var _ConfigWindow_configureConfigItem =
    ConfigWindow._configureConfigItem;

ConfigWindow._configureConfigItem =
function(groupArray) {

    _ConfigWindow_configureConfigItem.call(
        this,
        groupArray
    );

    groupArray.appendObject(
        ConfigItem.MapParts_MiniMap
    );
};

ConfigItem.MapParts_MiniMap =
defineObject(BaseConfigtItem,
{
    selectFlag: function(index) {

        root.getExternalData().env[
            MiniMapSetting.ConfigKey
        ] = index;
    },

    getFlagValue: function() {

        var value =
            root.getExternalData().env[
                MiniMapSetting.ConfigKey
            ];

        return (
            typeof value === 'number'
        ) ? value : 3;
    },

    getFlagCount: function() {

        return 4;
    },

    getConfigItemTitle: function() {

        return 'ミニマップ表示';
    },

    getConfigItemDescription: function() {

        return 'ミニマップを表示します';
    },

    getObjectArray: function() {

        return [
            '大',
            '小',
            '非表示',
            'なし'
        ];
    }
});

})();