/*
■ファイル名
MapCommand_TurnEnd_mod.js

■SRPG Studio対応バージョン
var.1.298

■プラグインの概要
マップコマンド「ターン終了」を押下時に確認メッセージを表示する

■使用方法
1.このプラグインをpluginフォルダに入れる

※ゲーム実行時に環境設定で「ターン終了確認」の項目をオンにすることで確認メッセージが表示されるようになります

■作成者
ran

■更新履歴
2024/07/09 新規作成

*/

(function() {

// Tips: ゲームレイアウト > コマンドレイアウト> マップコマンド でコマンド名（ターン終了）を変更可能

// 確認ウィンドウに表示するメッセージ
var TurnEnd_Question = 'ターンを終了しますか？'

// 確認ウィンドウ用のプロパティ
MapCommand.TurnEnd._questionWindow = null;

// ターン終了コマンドを実行した時の処理
var _MapCommand_TurnEnd_openCommand = MapCommand.TurnEnd.openCommand;
MapCommand.TurnEnd.openCommand = function() {
	// 環境設定で「ターン終了確認」がオンではない時は、元の処理を実行して終了
	if (ConfigItem.ConfirmingTurnEnd.getFlagValue() !== 0) {
		_MapCommand_TurnEnd_openCommand.call(this);
		return;
	}
	
	this._questionWindow = createWindowObject(QuestionWindow, this);
	this._questionWindow.setQuestionMessage(TurnEnd_Question);
	this._questionWindow.setQuestionActive(true);
};


var _MapCommand_TurnEnd_moveCommand = MapCommand.TurnEnd.moveCommand;
MapCommand.TurnEnd.moveCommand = function() {
	// 環境設定で「ターン終了確認」がオンではない時は、元の処理（return MoveResult.END;）を返す
	if (ConfigItem.ConfirmingTurnEnd.getFlagValue() !== 0) {
		return _MapCommand_TurnEnd_moveCommand.call(this);
	}
	
	if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
		if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
			if (root.getBaseScene() === SceneType.FREE) {
				this._saveCursor();
			}
			TurnControl.turnEnd();
		}
		return MoveResult.END;
	}
	
	return MoveResult.CONTINUE;
};

var _MapCommand_TurnEnd_drawCommand = MapCommand.TurnEnd.drawCommand;
MapCommand.TurnEnd.drawCommand = function() {
	// 環境設定で「ターン終了確認」がオンではない時は、元の処理を実行して終了
	if (ConfigItem.ConfirmingTurnEnd.getFlagValue() !== 0) {
		_MapCommand_TurnEnd_drawCommand.call(this);
		return;
	}
	
	var x = LayoutControl.getCenterX(-1, this._questionWindow.getWindowWidth());
	var y = LayoutControl.getCenterY(-1, this._questionWindow.getWindowHeight());
	
	this._questionWindow.drawWindow(x, y);
};


//環境設定
var _ConfigWindow__configureConfigItem = ConfigWindow._configureConfigItem;
ConfigWindow._configureConfigItem = function(groupArray) {
	_ConfigWindow__configureConfigItem.call(this, groupArray);
	
	groupArray.appendObject(ConfigItem.ConfirmingTurnEnd);
};

ConfigItem.ConfirmingTurnEnd = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getExternalData().env.ConfirmingTurnEnd = index;
	},
	
	getFlagValue: function() {
		if (typeof root.getExternalData().env.ConfirmingTurnEnd !== 'number') {
			return 1;
		}
	
		return root.getExternalData().env.ConfirmingTurnEnd;
	},
	
	getFlagCount: function() {
		return 2;
	},
	
	getConfigItemTitle: function() {
		return 'ターン終了確認';
	},
	
	getConfigItemDescription: function() {
		return '「ターン終了」コマンドを実行する前に確認メッセージを表示します';
	}
}
);


})();
