/*
■ファイル
PlayerTurn_drawKeyOparation.js

■SRPG Studio対応バージョン:1.319

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
2026/02/19 ユニットコマンド選択中はキー説明を非表示にした
（簡易戦闘中やゲーム画面の解像度より小さいマップでリアル戦闘に入った場合、UIがクリッピングされて背景に写り込んでしまっている問題も修正）

*/

(function() {

//----------------------------------------------------------
// 設定データ
//----------------------------------------------------------
var KeyOperationTipsTable = {
	MapMode_PLAYER: 'Z：移動 X：ステータス A,S：ユニット切替',
	MapMode_ENEMY: 'X：ステータス',
	MapMode_ALLY: 'X：ステータス',
	MapMode_MAP: 'Z：マップコマンド X：マーキングON/OFF',
	
	AreaMode_PLAYER: 'Z：移動決定 X：キャンセル ↑↓←→： カーソル移動',
	AreaMode_ENEMY: 'X：キャンセル',
	AreaMode_ALLY: 'X：キャンセル',
	
	MapCommandOpen: 'Z：決定 X：キャンセル ↑↓：コマンド選択',
	UnitCommandOpen: 'Z：決定 X：キャンセル ↑↓：コマンド選択',
	// ture: タイトルUI表示位置を固定 false: カーソル位置に応じて上下に移動	
	FIXEDPOSITION: false,
	POSX: 0,
	POSY: -16,
	// リソース> リソース使用箇所> テキストUI で使用されている見出し(*_title) 内部名を記述する
	TEXTUI: 'questreward_title',
	// 任意のフォントIDを指定する。不正な場合はフォントリストの先頭が適用される
	FONTID: 0,
	// 文字色。カラーコードで指定することも可能 0xffffff
	COLOR: ColorValue.DEFAULT
};

//----------------------------------------------------------
// 補助関数群
//----------------------------------------------------------
var KeyOperationTipsHelper = {
	getEnvDataFlag: function() {
		// 0が「表示（ON）」の設定
		return root.getExternalData().env.OperationTipsExplanation === 0;
	},

	getUnitTypeSuffix: function(unit) {
		if (!unit) return null;
		var type = unit.getUnitType();
		if (type === UnitType.PLAYER) return 'PLAYER';
		if (type === UnitType.ENEMY) return 'ENEMY';
		if (type === UnitType.ALLY) return 'ALLY';
		return null;
	},

	getPositionX: function(width) {
		if (KeyOperationTipsTable.FIXEDPOSITION) {
			return root.getGameAreaWidth() - width + KeyOperationTipsTable.POSX;
		}
		var dx = LayoutControl.getRelativeX(10) - 54;
		return root.getGameAreaWidth() - width - dx;
	},

	getPositionY: function(height) {
		if (KeyOperationTipsTable.FIXEDPOSITION) {
			return KeyOperationTipsTable.POSY;
		}
		var session = root.getCurrentSession();
		var x = LayoutControl.getPixelX(session.getMapCursorX());
		var y = LayoutControl.getPixelY(session.getMapCursorY());
		var dx = root.getGameAreaWidth() / 2;
		var dy = root.getGameAreaHeight() / 2;
		var yBase = LayoutControl.getRelativeY(10) - 28;

		// カーソルが右上に配置されている場合は下側に表示する等の調整
		if (x > dx && y < dy) {
			return root.getGameAreaHeight() - height - KeyOperationTipsTable.POSY;
		}
		return yBase - height - KeyOperationTipsTable.POSY;
	}
};

//----------------------------------------------------------
// PlayerTurn クラスの拡張
//----------------------------------------------------------
PlayerTurn._drawKeyOperationTips = function() {
	if (!KeyOperationTipsHelper.getEnvDataFlag() || root.isEventSceneActived() || SceneManager.getScreenCount() > 0) {
		return;
	}
	
	// 個別のユニットコマンドを開いた時は非表示
	var unitCommand = this._mapSequenceCommand._unitCommandManager;
	if (unitCommand !== null && unitCommand.getCycleMode() === ListCommandManagerMode.OPEN) {
		return;
	}
	
	var text = this._getExplanationText();
	if (!text) return;

	var textui = root.queryTextUI(KeyOperationTipsTable.TEXTUI);
	var color = KeyOperationTipsTable.COLOR;
	var font = root.getBaseData().getFontList().getDataFromId(KeyOperationTipsTable.FONTID);
	if (!font) font = textui.getFont();

	var pic = textui.getUIImage();
	var count = TitleRenderer.getTitlePartsCount(text, font);
	var width = TitleRenderer.getTitlePartsWidth() * (count + 1);
	var height = TitleRenderer.getTitlePartsHeight();
	
	var x = KeyOperationTipsHelper.getPositionX(width);
	var y = KeyOperationTipsHelper.getPositionY(height);

	if (pic !== null) {
		TextRenderer.drawFixedTitleText(x, y, text, color, font, TextFormat.CENTER, pic, count);
	} else {
		TextRenderer.drawText(x + 48, y + 24, text, -1, color, font);
	}
};

PlayerTurn._getExplanationText = function() {
	var mode = this.getCycleMode();
	var suffix, unit;

	switch (mode) {
		case PlayerTurnMode.MAP:
			unit = this._mapEdit.getEditTarget();
			suffix = KeyOperationTipsHelper.getUnitTypeSuffix(unit);
			return suffix ? KeyOperationTipsTable['MapMode_' + suffix] : KeyOperationTipsTable.MapMode_MAP;

		case PlayerTurnMode.AREA:
			unit = this.getTurnTargetUnit();
			suffix = KeyOperationTipsHelper.getUnitTypeSuffix(unit);
			return suffix ? KeyOperationTipsTable['AreaMode_' + suffix] : null;

		case PlayerTurnMode.MAPCOMMAND:
			return KeyOperationTipsTable.MapCommandOpen;

		case PlayerTurnMode.UNITCOMMAND:
			return KeyOperationTipsTable.UnitCommandOpen;

		default:
			return null;
	}
};

//----------------------------------------------------------
// 既存メソッドのフック (Alias)
//----------------------------------------------------------

// 描画メソッド群への一括フック
var drawMethods = ['_drawMap', '_drawArea', '_drawMapCommand', '_drawUnitCommand'];
for (var i = 0; i < drawMethods.length; i++) {
	(function(methodName) {
		var _original = PlayerTurn[methodName];
		PlayerTurn[methodName] = function() {
			this._drawKeyOperationTips();
			_original.apply(this, arguments);
		};
	})(drawMethods[i]);
}

//----------------------------------------------------------
// 環境設定（コンフィグ）項目追加
//----------------------------------------------------------
var _ConfigWindow_configureConfigItem = ConfigWindow._configureConfigItem;
ConfigWindow._configureConfigItem = function(groupArray) {
	_ConfigWindow_configureConfigItem.call(this, groupArray);
	groupArray.appendObject(ConfigItem.OperationTipsExplanation);
};

ConfigItem.OperationTipsExplanation = defineObject(BaseConfigtItem, {
	selectFlag: function(index) {
		root.getExternalData().env.OperationTipsExplanation = index;
	},
	
	getFlagValue: function() {
		var val = root.getExternalData().env.OperationTipsExplanation;
		return (typeof val === 'number') ? val : 1; // デフォルトは1(OFF)
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
});

})();