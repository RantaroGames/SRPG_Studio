/*
■ファイル
PlayerTurn_drawKeyOparation.js

■SRPG Studio対応バージョン:1.315

■プラグインの概要
マップ上にキー操作の説明を表示する
環境設定で表示のON/OFFが可能

■使用方法
このファイルをpluginフォルダに入れる
キー操作の説明を変えたい場合は、KeyOperationTipsTableの各プロパティを変更してください


■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md


■更新履歴
2021/12/08 新規作成
2025/06/23 表示位置を移動させる設定を追加。フォントや文字色を指定し易く修正
2025/07/19 キーボードでマップコマンド選択時にカーソル移動が速まる問題を修正

*/

(function() {

//----------------------------------------------------------
// キー操作の説明文設定
//----------------------------------------------------------
var KeyOperationTipsTable = {
	MapMode_PLAYER: 'Z：移動 X：ステータス A,S：ユニット切替'
,	MapMode_ENEMY: 'X：ステータス'
,	MapMode_ALLY: 'X：ステータス'
,	MapMode_MAP: 'Z：マップコマンド X：マーキングON/OFF'
	
,	AreaMode_PLAYER: 'Z：移動決定 X：キャンセル ↑↓←→： カーソル移動'
,	AreaMode_ENEMY: 'X：キャンセル'
,	AreaMode_ALLY: 'X：キャンセル'
	
,	MapCommandOpen: 'Z：決定 X：キャンセル ↑↓：コマンド選択'
,	UnitCommandOpen: 'Z：決定 X：キャンセル ↑↓：コマンド選択'
	
	// ture: タイトルUI表示位置を固定 false: カーソル位置に応じて上下に移動
,	FIXEDPOSITION: false

	// 表示位置の調整用
,	POSX: 0
,	POSY: -16
	
	// リソース> リソース使用箇所> テキストUI で使用されている見出し(*_title) 内部名を記述する
,	TEXTUI: 'questreward_title'
	// 任意のフォントIDを指定する。不正な場合はフォントリストの先頭が適用される
,	FONTID: 0
	// 文字色。カラーコードで指定することも可能 0xffffff
,	COLOR: ColorValue.DEFAULT
	
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
	// textがnullまたは空白なら処理を終了
	if (text === null || text === '') return;
	
	var textui = root.queryTextUI(KeyOperationTipsTable.TEXTUI);
	var pic = textui.getUIImage();
	var color = KeyOperationTipsTable.COLOR;//textui.getColor();
//	var font = textui.getFont();
	var font = root.getBaseData().getFontList().getDataFromId(KeyOperationTipsTable.FONTID);
	if (font === null) font = textui.getFont();

	var count = TitleRenderer.getTitlePartsCount(text, font);
	var width = TitleRenderer.getTitlePartsWidth() * (count + 1);
	var height = TitleRenderer.getTitlePartsHeight();
	
	// 描画開始位置 x,y座標
	var x = Fnc_KeyOperationTips._getPositionX(width);
	var y = Fnc_KeyOperationTips._getPositionY(height);
	
	
	if (pic !== null) {
		TextRenderer.drawFixedTitleText(x, y, text, color, font, TextFormat.CENTER, pic, count);
	}
	else {
		TextRenderer.drawText(x + 48, y + 24, text, -1, color, font);
	}
};

var Fnc_KeyOperationTips = {
	getMapCursorX: function() {
		return root.getCurrentSession().getMapCursorX();
	},
	
	getMapCursorY: function() {
		return root.getCurrentSession().getMapCursorY();
	},
	
	_getPositionX: function(width) {
		if (KeyOperationTipsTable.FIXEDPOSITION) {
			return root.getGameAreaWidth() - width + KeyOperationTipsTable.POSX;
		}
		
		var dx = LayoutControl.getRelativeX(10) - 54;
		
		return root.getGameAreaWidth() - width - dx;
	},
	
	_getPositionY: function(height) {
		if (KeyOperationTipsTable.FIXEDPOSITION) {
			return KeyOperationTipsTable.POSY;
		}
		
		var x = LayoutControl.getPixelX(this.getMapCursorX());
		var dx = root.getGameAreaWidth() / 2;
		var y = LayoutControl.getPixelY(this.getMapCursorY());
		var dy = root.getGameAreaHeight() / 2;
		var yBase = LayoutControl.getRelativeY(10) - 28;
		
		if (x > dx && y < dy) {
			return root.getGameAreaHeight() - height - KeyOperationTipsTable.POSY;
		}
		else {
			return yBase - height - KeyOperationTipsTable.POSY;
		}
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

/* var _PlayerTurn__moveMapCommand = PlayerTurn._moveMapCommand;
PlayerTurn._moveMapCommand = function() {
	this._envdata = f_getEnvdataflag();

	return _PlayerTurn__moveMapCommand.call(this);
}; */

// コンフィグスクリーンを閉じた時にキー操作説明の表示フラグを再設定する
var _ConfigScreenLauncher__doEndAction = ConfigScreenLauncher._doEndAction;
ConfigScreenLauncher._doEndAction = function() {
	_ConfigScreenLauncher__doEndAction.call(this);
	
	if (typeof SceneManager.getActiveScene().getTurnObject !== 'undefined') {
		SceneManager.getActiveScene().getTurnObject()._envdata = f_getEnvdataflag();
	}
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
