/*
■ファイル名
MapLayer_drawOrderNumber.js

■SRPG Studio対応バージョン
ver.1.316

■プラグインの概要
敵ユニット(と同盟ユニット)が敵ターン時に行動する順番を表示します。
エディタの「行動順の表示」と同様の機能をゲーム中にも利用できるようになります。

環境設定で該当項目をオンにしてマップ攻略中にshiftキー（game.iniでOPTION2に割り当てたキー）を押下すると順番が表示されます。
行動順はプレイヤーターンのみ表示されます。

※行動順の取得についての仕様
敵（同盟）ユニットの生存リスト（「生存」かつ「フュージョンされていない」ユニット）の順番を使用します。
(その際、「非表示」または「非出撃」のユニットは考慮されません)

プレイヤーターン中にリストを参照して表示する関係から、敵ターン中に行動順(リストの並び)を変更するイベントやプラグインを導入していた場合は対応できません。

■使用方法
1.このプラグインをpluginフォルダに入れる
2.このプラグイン内の設定項目に必要な値を記述する
（番号が枠からはみ出ないようにエディタで小さ目サイズのフォントを作成しておくと良い）

■作成者
ran

■更新履歴
2024/11/26 新規作成


*/


(function() {

//-------------------------------------------------
// 設定項目
//-------------------------------------------------
var OrderNumber = {
	// 枠の色(敵軍)
	EnemyColor: 0xFFD5EC
	// 枠の色（同盟軍）
  , AllyColor: 0x93FFAB
    // 数値の色
  , NumberColor: 0x0000ff
  
    // 数値のフォントid 参考フォント：BIZ UDPゴシック(サイズ9)
  , FontId: 0
  
	// 枠のサイズ
  , width: 16
  , height: 12
  
	// 枠の描画座標調整
  , dx: 4
  , dy: 8  
};


//-------------------------------------------------
// 行動順を表示するためのクラス
//-------------------------------------------------
var OrderNumberDisplay = defineObject(BaseObject,
{
	_isVisible: false,
	_orderNumber: null,
	
	startOrderNumber: function() {
		if (this._isDisplayable() === false) return;
		
		this._isVisible = !this._isVisible;
		
		if (this._isVisible) {
			this.updateOrderNumber();
		}
		else {
			this.resetOrderNumber();
		}
	},
	
	moveOrderNumber: function() {
		return MoveResult.CONTINUE;
	},
	
	resetOrderNumber: function() {
		this._isVisible = false;
		this._orderNumber = null;
	},
	
	updateOrderNumber: function() {
//		root.watchTime();
		this._orderNumber = null;
		
		if (this._isVisible === false) return;
		if (this._isDisplayable() === false) return;
		
		var obj = {};
		obj.enemyArrayX = [];
		obj.enemyArrayY = [];
		obj.allyArrayX = [];
		obj.allyArrayY = [];
		
		this._setPositionSettingsInternal(EnemyList.getAliveList(), obj.enemyArrayX, obj.enemyArrayY);
		this._setPositionSettingsInternal(AllyList.getAliveList(), obj.allyArrayX, obj.allyArrayY);

//		root.log('updateOrderNumber:' + root.getElapsedTime());
		this._orderNumber = obj; 
	},
	
	_setPositionSettingsInternal: function(list, arrayX, arrayY) {
		var i, unit;
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			
			if (unit.isInvisible() || unit.getSortieState() !== SortieType.SORTIE) continue;

			arrayX.push(unit.getMapX());
			arrayY.push(unit.getMapY());
		}
	},
	
	drawOrderNumber: function() {
		if (this._isVisible === false) return;
		if (this._isDisplayable() === false) return;
		
		this._drawOrderNumberInternal(this._orderNumber.enemyArrayX, this._orderNumber.enemyArrayY, OrderNumber.EnemyColor);
		this._drawOrderNumberInternal(this._orderNumber.allyArrayX, this._orderNumber.allyArrayY, OrderNumber.AllyColor);
	},	
	
	_drawOrderNumberInternal: function(arrayX, arrayY, color) {
		var width = GraphicsFormat.MAPCHIP_WIDTH;
		var height = GraphicsFormat.MAPCHIP_HEIGHT;
		var x, y, i, range;
		var graphicsManager = root.getGraphicsManager();			
		var canvas = graphicsManager.getCanvas();
		var radiusX = 2;
		var radiusY = 2;
		var font = this.getOptionalFont(OrderNumber.FontId);
		var fWidth = OrderNumber.width;
		var fHeight = OrderNumber.height;
		var count = arrayX.length;
	
		for (i = 0; i < count; i++) {
			x = arrayX[i];
			y = arrayY[i];
			
			// 画面外の地点は描画しない
			// マップサイズに収まっているか ※生存ユニットの座標を取得しているから基本的にはマップサイズ内に収まっているはずなので下の一行は不要かも
			if (!CurrentMap.isMapInside(x, y)) continue;
			
			// x,yをpixel座標に変換して現在スクロールしている画面に収まっているか
			if (!MapView.isVisible(x, y)) continue;
			
			// 行動順を表示する枠の描画原点(dx, dyの値で調整)
			x = (x * width) - root.getCurrentSession().getScrollPixelX() - OrderNumber.dx;
			y = (y * height) - root.getCurrentSession().getScrollPixelY() - OrderNumber.dy;

			// 番号100以上の場合は枠の幅を広げる(あるいは最初から幅を広げておけば下の一行は不要)
			if (i+1 > 99) fWidth = 20;
			
			// フレームを描画する(画像で表示したい場合は、必要な処理に変更すること)
			canvas.setStrokeInfo(0x000000, 255, 2, true);
			canvas.setFillColor(color, 200);
			canvas.drawRoundedRectangle(x, y, fWidth, fHeight, radiusX, radiusY);
			
			range = createRangeObject(x, y, fWidth, fHeight);
			TextRenderer.drawRangeText(range, TextFormat.CENTER, i+1, -1, OrderNumber.NumberColor, font);
		}
	},
	
	// 敵行動順の取得/描画を許可するか否か
	_isDisplayable: function() {
		if (ConfigItem.MapLayer_OrderNumber.getFlagValue() === 1) return false;
		
		var session = root.getCurrentSession();
		if (session === null) return false;
		
		// 戦闘マップ中または戦闘準備中のみ取得可能
		var baseScene = root.getBaseScene();
		if (baseScene !== SceneType.FREE && baseScene !== SceneType.BATTLESETUP) return false;
	
		// イベントが実行中の時は描画しない
		if (root.isEventSceneActived() === true) return;
		
		// プレイヤーターンのみ表示する
		if (session.getTurnType() !== TurnType.PLAYER) return false;
		
		return true;
},
	
	// フォントリストのIdから任意にフォントを指定する
	getOptionalFont: function(fontId) {
		var font = root.getBaseData().getFontList().getDataFromId(fontId);
		if (font === null) {
			font = root.getBaseData().getFontList().getData(0);
		}
		return font;
	}
	
});
	

// 行動順表示切替用のプロパティ
MapLayer._orderNumber = null;

// 行動順をキャラチップの上に描画する
var _MapLayer_drawUnitLayer = MapLayer.drawUnitLayer;
MapLayer.drawUnitLayer = function() {
	_MapLayer_drawUnitLayer.call(this);

	this._orderNumber.drawOrderNumber();
};

var _MapLayer_prepareMapLayer = MapLayer.prepareMapLayer;
MapLayer.prepareMapLayer = function() {
	_MapLayer_prepareMapLayer.call(this);
	
	this._orderNumber = createObject(OrderNumberDisplay);
};

var _MapLayer_moveMapLayer = MapLayer.moveMapLayer;
MapLayer.moveMapLayer = function() {
	this._orderNumber.moveOrderNumber();

	return _MapLayer_moveMapLayer.call(this);
};
	
// ターン切り替わり時にリストを取得する
var _PlayerTurn_openTurnCycle = PlayerTurn.openTurnCycle;
PlayerTurn.openTurnCycle = function () {
	_PlayerTurn_openTurnCycle.call(this);

	MapLayer._orderNumber.updateOrderNumber();
};

// 自動イベントの終了時にリストを更新する
var _PlayerTurn_doEventEndAction = PlayerTurn._doEventEndAction;
PlayerTurn._doEventEndAction = function () {
	_PlayerTurn_doEventEndAction.call(this);

	MapLayer._orderNumber.updateOrderNumber();
};

var _MapEdit__moveCursorMove = MapEdit._moveCursorMove;
MapEdit._moveCursorMove = function() {
	// オプション2キー(shiftキー)押下で行動順表示を切り替える
	if (InputControl.isOptionAction2()) {
		if (ConfigItem.MapLayer_OrderNumber.getFlagValue() === 0) {
			MapLayer._orderNumber.startOrderNumber();
			return MapEditResult.NONE;
		}
	}
	
	return _MapEdit__moveCursorMove.call(this);
};

/* var _MapEdit__optionAction = MapEdit._optionAction;
MapEdit._optionAction = function(unit) {
	// マップ上でオプションキー(cキー)押下で行動順表示を切り替える
	if (ConfigItem.MapLayer_OrderNumber.getFlagValue() === 0) {
		if (unit === null) {
			MapLayer._orderNumber.startOrderNumber();
		}
	}
	return _MapEdit__optionAction.call(this, unit);
}; */


//----------------------------
// コンフィグ設定コマンド追加
//----------------------------
var alias_001 = ConfigWindow._configureConfigItem;
ConfigWindow._configureConfigItem = function(groupArray) {
	alias_001.call(this, groupArray);
	
	groupArray.appendObject(ConfigItem.MapLayer_OrderNumber);
};

ConfigItem.MapLayer_OrderNumber = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getExternalData().env.MapLayer_OrderNumber = index;
	},
	
	getFlagValue: function() {
		if (typeof root.getExternalData().env.MapLayer_OrderNumber !== 'number') {
			return 1;
		}
	
		return root.getExternalData().env.MapLayer_OrderNumber;
	},
	
	getFlagCount: function() {
		return 2;
	},
	
	getConfigItemTitle: function() {
		return '敵の行動順表示';
	},
	
	getConfigItemDescription: function() {
		return '敵軍と同盟軍の行動順をマップ上に表示します (Shiftキーで表示切替)';
	},
	
	getObjectArray: function() {
		return ['オン', 'オフ'];
	}
}
);


})();
