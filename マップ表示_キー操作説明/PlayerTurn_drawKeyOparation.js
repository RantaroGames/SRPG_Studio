/*
■ファイル
PlayerTurn_drawKeyOparation.js

■SRPG Studio対応バージョン:1.234

■プラグインの概要
マップ上にキー操作の説明を表示する
環境設定で表示のON/OFFが可能

■使用方法
このファイルをpluginフォルダに入れる
キー操作の説明を変えたい場合は、KeyOperationTipsTableの各プロパティを変更してください

■作成者
ran
*/

(function() {

//----------------------------------------------------------
// キー操作の説明文設定
//----------------------------------------------------------
var KeyOperationTipsTable = {
	MapMode_PLAYER: 'Z：移動モード  X：ステータス表示  A,S：ユニット切替',
	MapMode_ENEMY: 'X：ステータス表示',
	MapMode_ALLY: 'X：ステータス表示',
	MapMode_MAP: 'Z：マップコマンド呼出し  X：マーキング ON/OFF',
	
	AreaMode_PLAYER: 'Z：移動決定  X：キャンセル ↑↓←→： カーソル移動',
	AreaMode_ENEMY: 'X：キャンセル',
	AreaMode_ALLY: 'X：キャンセル',
	
	MapCommandOpen: 'Z：決定  X：キャンセル  ↑↓：コマンド選択',
	UnitCommandOpen: 'Z：決定  X：キャンセル  ↑↓：コマンド選択'
};

//----------------------------------------------------------
// キー操作説明を表示する処理
//----------------------------------------------------------
PlayerTurn._envdata = false;

PlayerTurn._drawKeyOperationTips = function() {
	// コンフィグで説明表示を許可していない場合
	if (this._envdata === false) return;
	
	//イベントが実行中の時は表示しない
	if (root.isEventSceneActived()) return;
	
	// 何らかのスクリーンが開かれている場合は表示しない
	if (SceneManager.getScreenCount() > 0) return;
	
	var text = this._getExplanationText();
	// textがnullなら処理を終了
	if (text === null) return;
	
	var textui = root.queryTextUI('questreward_title');
	var pic = textui.getUIImage();
	var color = textui.getColor(); //ColorValue.LIGHT;//0xffffff;
	var font = textui.getFont();
//	var font = root.getBaseData().getFontList().getDataFromId(0);//フォントリストからidで直接指定
//	if (font === null) font = textui.getFont();

	var count = TitleRenderer.getTitlePartsCount(text, font);
	var width = TitleRenderer.getTitlePartsWidth() * (count + 2);
//	var height = TitleRenderer.getTitlePartsHeight();
	// 描画開始位置 x,y座標
	var x = root.getGameAreaWidth() - (width + 2);
	var y = -16;
	
	if (pic !== null) {
		TextRenderer.drawFixedTitleText(x, y, text, color, font, TextFormat.CENTER, pic, count);
	}
	else {
		TextRenderer.drawText(x + 48, y + 24, text, -1, color, font);
	}
};

//----------------------------------------------------------
// キー操作説明のテキストを取得する処理
//----------------------------------------------------------
PlayerTurn._getExplanationText = function() {
	var text = null;
	var mode = this.getCycleMode();
	var unit, unitType;
	
	if (mode === PlayerTurnMode.AUTOCURSOR) {
		text = null;
	}
	else if (mode === PlayerTurnMode.AUTOEVENTCHECK) {
		text = null;
	}
	else if (mode === PlayerTurnMode.MAP) {
		unit = this._mapEdit.getEditTarget();
		if (unit !== null) {
			unitType = unit.getUnitType();
			if (unitType === UnitType.PLAYER) {
				text = KeyOperationTipsTable.MapMode_PLAYER;
			} else if (unitType === UnitType.ENEMY) {
				text =  KeyOperationTipsTable.MapMode_ENEMY;
			} else if (unitType === UnitType.ALLY) {
				text =  KeyOperationTipsTable.MapMode_ALLY;
			}
		} else {
			text = KeyOperationTipsTable.MapMode_MAP;
		}
	}
	else if (mode === PlayerTurnMode.AREA) {
		unit = this.getTurnTargetUnit();
		if (unit !== null) {
			unitType = unit.getUnitType();
			if (unitType === UnitType.PLAYER) {
				text = KeyOperationTipsTable.AreaMode_PLAYER;
			} else if (unitType === UnitType.ENEMY) {
				text = KeyOperationTipsTable.AreaMode_ENEMY;
			} else if (unitType === UnitType.ALLY) {
				text = KeyOperationTipsTable.AreaMode_ALLY;
			}
		} else {
			text = null;
		}
	}
	else if (mode === PlayerTurnMode.MAPCOMMAND) {
		text = KeyOperationTipsTable.MapCommandOpen;
	}
	else if (mode === PlayerTurnMode.UNITCOMMAND) {
		text = KeyOperationTipsTable.UnitCommandOpen;
	}
	return text;
};


// 環境設定のフラグを取得する
function f_getEnvdataflag()
{
	var flag = false;
	
	if (root.getExternalData().env.OperationTipsExplanation === 0) {
		flag = true;
	}
	return flag;
}

//----------------------------------------------------------
// キー操作説明を表示する処理を追加
//----------------------------------------------------------
var _PlayerTurn__prepareTurnMemberData = PlayerTurn._prepareTurnMemberData;
PlayerTurn._prepareTurnMemberData = function() {
	_PlayerTurn__prepareTurnMemberData.call(this);
	
	this._envdata = f_getEnvdataflag();
};

//var _PlayerTurn__moveMap = PlayerTurn._moveMap;
//PlayerTurn._moveMap = function() {
//	this._envdata = f_getEnvdataflag();
//	return _PlayerTurn__moveMap.call(this);
//};

var _PlayerTurn__moveMapCommand = PlayerTurn._moveMapCommand;
PlayerTurn._moveMapCommand = function() {
	this._envdata = f_getEnvdataflag();
	
	return _PlayerTurn__moveMapCommand.call(this);
};

var _PlayerTurn__drawMap = PlayerTurn._drawMap;
PlayerTurn._drawMap = function() {
	this._drawKeyOperationTips();
	
	_PlayerTurn__drawMap.call(this);
};

var _PlayerTurn__drawArea = PlayerTurn._drawArea;
PlayerTurn._drawArea = function() {
	this._drawKeyOperationTips();
	
	_PlayerTurn__drawArea.call(this);
};

var _PlayerTurn__drawMapCommand = PlayerTurn._drawMapCommand;
PlayerTurn._drawMapCommand = function() {
	this._drawKeyOperationTips();
	
	_PlayerTurn__drawMapCommand.call(this);
};

var _PlayerTurn__drawUnitCommand = PlayerTurn._drawUnitCommand;
PlayerTurn._drawUnitCommand = function() {
	this._drawKeyOperationTips();
	
	_PlayerTurn__drawUnitCommand.call(this);
};

//----------------------------------------------------------
// 環境設定に項目を追加
//----------------------------------------------------------
var _ConfigWindow__configureConfigItem = ConfigWindow._configureConfigItem;
ConfigWindow._configureConfigItem = function(groupArray) {
	_ConfigWindow__configureConfigItem.call(this, groupArray);
	
	groupArray.appendObject(ConfigItem.OperationTipsExplanation);
};

ConfigItem.OperationTipsExplanation = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getExternalData().env.OperationTipsExplanation = index;
	},
	
	getFlagValue: function() {
		if (typeof root.getExternalData().env.OperationTipsExplanation !== 'number') {
			return 1;
		}
	
		return root.getExternalData().env.OperationTipsExplanation;
	},
	
	getFlagCount: function() {
		return 2;
	},
	
	getConfigItemTitle: function() {
		return 'キー操作説明';
	},
	
	getConfigItemDescription: function() {
		return 'マップ上にキー操作に関する説明を表示します';
	}
}
);


})();
