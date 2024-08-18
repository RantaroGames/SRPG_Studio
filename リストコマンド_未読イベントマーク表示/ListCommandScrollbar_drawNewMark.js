/*
■ファイル
ListCommandScrollbar_drawNewMark.js

■SRPG Studio対応バージョン:1.300

■プラグインの概要
未読イベントがある場合、リストコマンドにNEWマークを表示します

本プラグインでマーク表示できるコマンドは、以下の4つに限られます
・コミュニケーションイベント（戦闘準備）
・コミュニケーションイベント（マップコマンド）
・コミュニケーションイベント（拠点）
・会話イベント（拠点）

■使用方法
1.このファイルをpluginフォルダに入れる

2.本プラグイン内の設定項目を設定する

※競合に関する注意点
本プラグインでは、一部でListCommandScrollbarを独自のオブジェクトに置き換えています

SetupCommand.openListCommandManager
MapCommand.openListCommandManager
RestCommand.openListCommandManager 

以上の３つを変更しているプラグインと競合する恐れがあります
該当するプラグインが先に読み込まれるようにリネーム(ファイル名に数字を付ける、など)するか、マージして対応してください

※同一idマップを繰り返し利用する場合
本プラグインでは、マップのコミュニケーションイベントの未読判定をマップ毎に初期化します
そのためクエスト等で同一idのマップを繰り返し攻略できる場合
既に実行したイベントであってもマップに入るたびに（マップ共有イベントを除いて）、未読扱いとなりNewマークが表示されます

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2024/08/17 新規作成

*/


(function() {
	
//-----------------------------
// 設定項目
//-----------------------------
// Newマークをtext表示する(true) / icon表示（false）
var isMarkText = true;

// 表示テキスト
var NewMarkText = 'New!';

// 表示icon text表示採用なら設定不要 
// {isRuntime: true(ランタイム) / false(オリジナル), id: アイコンリソースid, xSrc: アイコンの位置x座標（左端を0）, ySrc: y座標(上端を0）}
var NewMarkIcon = {isRuntime: true, id: 0, xSrc: 0, ySrc: 0};

// Newマークを表示するコマンド名
// ゲーム内で表示されるテキストではなく、コマンドレイアウトで設定した名前を指定する \（バックスラッシュ）を含む場合は \\文字 のように\を一つ追加して記述する
var CommandName = {
	// 戦闘準備のコミュニケーションイベント
	CM_SETUP: '情報収集',
	// マップコマンドのコミュニケーションイベント
	CM_MAP: '情報収集',
	// 拠点のコミュニケーションイベント
	CM_REST: '情報収集',
	// 拠点の会話イベント
	TK_REST: '会話選択'
};

//-----------------------------

// マップ共通イベントで追加されたコミュニケーションイベントのidがマップのCMイベントidと被らないようにする
var CommonEventBaseId = 1000;

// ListCommandScrollbarを継承させたオブジェクト
var ListCommandScrollbar_drawNewMark = defineObject(ListCommandScrollbar,
{
	// 未読イベントが存在している場合、該当コマンドのindexを記録するプロパティ
	_isNewMarkIndex_CM: -1,
	_isNewMarkIndex_TK: -1,
	
	drawScrollContent: function(x, y, object, isSelect, index) {
		ListCommandScrollbar.drawScrollContent.apply(this, arguments);
		
		if (this._isNewMarkIndex_CM === index) {
			this._drawNewMark(x, y);
		}
		else if (this._isNewMarkIndex_TK === index) {
			this._drawNewMark(x, y);
		}
	},

	// NEWマークを表示する関数
	_drawNewMark: function(x, y) {
		var textui = this.getParentInstance().getCommandTextUI();
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		var handle = root.createResourceHandle(NewMarkIcon.isRuntime, NewMarkIcon.id, 0, NewMarkIcon.xSrc, NewMarkIcon.ySrc);
		var dx = 20; // x座標補正
		var dy = 10; // y座標補正
		
		if (isMarkText === false && handle !== null) {
			GraphicsRenderer.drawImage(x + dx, y + dy, handle, GraphicsType.ICON);
		}
		else {
			TextRenderer.drawText(x + dx, y + dy, NewMarkText, -1, color, font);
		}
	}
}
);

// ListCommandScrollbarをNewMark表示用のオブジェクトに置き換える

//var _SetupCommand_openListCommandManager = SetupCommand.openListCommandManager;
SetupCommand.openListCommandManager = function() {
//	_SetupCommand_openListCommandManager.call(this);
	this._commandScrollbar = createScrollbarObject(ListCommandScrollbar_drawNewMark, this);
	this._commandScrollbar.setActive(true);
	this.rebuildCommand();
	this._playCommandOpenSound();
	this.changeCycleMode(ListCommandManagerMode.TITLE);
};

//var _MapCommand_openListCommandManager = MapCommand.openListCommandManager;
MapCommand.openListCommandManager = function() {
//	_MapCommand_openListCommandManager.call(this);
	this._commandScrollbar = createScrollbarObject(ListCommandScrollbar_drawNewMark, this);
	this._commandScrollbar.setActive(true);
	this.rebuildCommand();
	this._playCommandOpenSound();
	this.changeCycleMode(ListCommandManagerMode.TITLE);
};

//var _RestCommand_openListCommandManager = RestCommand.openListCommandManager;
RestCommand.openListCommandManager = function() {
//	_RestCommand_openListCommandManager.call(this);
	this._commandScrollbar = createScrollbarObject(ListCommandScrollbar_drawNewMark, this);
	this._commandScrollbar.setActive(true);
	this.rebuildCommand();
	this._playCommandOpenSound();
	this.changeCycleMode(ListCommandManagerMode.TITLE);
};


// BattleSetupSceneに入った(新たにマップを開いた)時に情報イベントの閲覧状況を初期化する
var _BattleSetupScene_setSceneData = BattleSetupScene.setSceneData;
	BattleSetupScene.setSceneData = function() {
	_BattleSetupScene_setSceneData.call(this);
	
	var mapId = root.getCurrentSession().getCurrentMapInfo().getId();
	var global = root.getMetaSession().global;
	
	if (Object.prototype.toString.call(global.ReadEvent) !== '[object Array]') {
		ReadEventCheck.initGlobalParameter();
	}
		
	// グローバルパラメータのmapIdと現在マップのidが異なっているということは新しいマップに入ったと看做せるので閲覧状況を初期化して良い
	if (global.CurrentMapId !== mapId) {
		global.CurrentMapId = mapId;
		global.ReadEvent[ReadEventType.CM_MAP] = ReadEventCheck.cutEventId(global.ReadEvent[ReadEventType.CM_MAP]);
	}
};


// 戦闘準備画面のコミュニケーションイベントで未読があればコマンドリストのindexを記録しておく
var _SetupCommand_rebuildCommand = SetupCommand.rebuildCommand;
SetupCommand.rebuildCommand = function() {
	_SetupCommand_rebuildCommand.call(this);
	
	var object, index, commandName;
	var count = this._commandScrollbar.getObjectCount();
	
	this._commandScrollbar._isNewMarkIndex_CM = -1;
	
	for (index = 0; index < count; index++) {
		object = this._commandScrollbar.getObjectFromIndex(index);
		commandName = object.getCommandName();
		
		if (commandName === CommandName.CM_SETUP) {
			if (ReadEventCheck.isUnReadEvent(EventType.COMMUNICATION) === true) {
				this._commandScrollbar._isNewMarkIndex_CM = index;
			}
			else {
				this._commandScrollbar._isNewMarkIndex_CM = -1;
			}
			return;
		}
	}
};

// マップコマンドのコミュニケーションイベントで未読があればコマンドリストのindexを記録しておく
var _MapCommand_rebuildCommand = MapCommand.rebuildCommand;
MapCommand.rebuildCommand = function() {
	_MapCommand_rebuildCommand.call(this);
	
	var object, index, commandName;
	var count = this._commandScrollbar.getObjectCount();
	
	this._commandScrollbar._isNewMarkIndex_CM = -1;
	
	for (index = 0; index < count; index++) {
		object = this._commandScrollbar.getObjectFromIndex(index);
		commandName = object.getCommandName();
		
		if (commandName === CommandName.CM_MAP) {
			if (ReadEventCheck.isUnReadEvent(EventType.COMMUNICATION) === true) {
				this._commandScrollbar._isNewMarkIndex_CM = index;
			}
			else {
				this._commandScrollbar._isNewMarkIndex_CM = -1;
			}
			return;
		}
	}
};

// 拠点のCM/TKイベントで未読があればコマンドリストのindexを記録しておく
var _RestCommand_rebuildCommand = RestCommand.rebuildCommand;
RestCommand.rebuildCommand = function() {
	_RestCommand_rebuildCommand.call(this);
	
	var object, index, commandName;
	var count = this._commandScrollbar.getObjectCount();
	
	this._commandScrollbar._isNewMarkIndex_CM = -1;
	
	for (index = 0; index < count; index++) {
		object = this._commandScrollbar.getObjectFromIndex(index);
		commandName = object.getCommandName();
		
		if (commandName === CommandName.CM_REST) {
			if (ReadEventCheck.isUnReadEvent(EventType.COMMUNICATION) === true) {
				this._commandScrollbar._isNewMarkIndex_CM = index;
			}
			else {
				this._commandScrollbar._isNewMarkIndex_CM = -1;
			}
		}
		else if (commandName === CommandName.TK_REST) {
			if (ReadEventCheck.isUnReadEvent(EventType.TALK) === true) {
				this._commandScrollbar._isNewMarkIndex_TK = index;
			}
			else {
				this._commandScrollbar._isNewMarkIndex_TK = -1;
			}
		}
	}
};


// 一度でもイベントを実行させた場合、グローバルパラメータにイベントのidを記録する
var _CommunicationScreen__startEvent = CommunicationScreen._startEvent;
CommunicationScreen._startEvent = function() {
	var event, eventId;
	var entry = this._scrollbar.getObject();

	if (entry !== null) {
		// entry.eventには実行可能状態のイベントが格納されている
		event = entry.event;
		
		// マップ共通イベントはid+1000
		if (event.getCommonEventInfo() !== null) {
			eventId = event.getId() + CommonEventBaseId;
		}
		else {
			eventId = event.getId();
		}
			
		ReadEventCheck._setReadEventId(eventId, EventType.COMMUNICATION);
	}
	
	_CommunicationScreen__startEvent.call(this);
};	

var _ImageTalkScreen__startTalkEvent = ImageTalkScreen._startTalkEvent;
ImageTalkScreen._startTalkEvent = function() {
	var event, eventId;
	var entry = this._imageTalkWindow.getChildScrollbar().getObject();
	
	if (entry !== null) {
		event = entry.event;
		
		// 拠点の会話イベントはマップ共通イベントを考慮しなくてよいのでidを加工しない
		eventId = event.getId();
	
		ReadEventCheck._setReadEventId(eventId, EventType.TALK);
	}
	
	_ImageTalkScreen__startTalkEvent.call(this);
};

var ReadEventType = {
	CM_MAP: 0,
	CM_REST: 1,
	TK_REST: 2
};

var ReadEventCheck = {
	// グローバルパラメータを初期化する
	initGlobalParameter: function() {
		var global = root.getMetaSession().global;
		
		global.ReadEvent = [];
		global.ReadEvent[ReadEventType.CM_MAP] = [];
		global.ReadEvent[ReadEventType.CM_REST] = [];
		global.ReadEvent[ReadEventType.TK_REST] = [];
		global.CurrentMapId = -1;
	},

	// グローバルパラメータに記録している既読イベント情報を取得する
	getGlobalParameter: function() {
		if (Object.prototype.toString.call(root.getMetaSession().global.ReadEvent) !== '[object Array]') {
			this.initGlobalParameter();
		}
		
		return root.getMetaSession().global.ReadEvent;
	},
	
	_putlog: function() {
		var readEvent = this.getGlobalParameter();
		
		root.log('CM_MAP ' + readEvent[ReadEventType.CM_MAP]);
		root.log('CM_REST ' + readEvent[ReadEventType.CM_REST]);
		root.log('TK_REST ' + readEvent[ReadEventType.TK_REST]);
	},
	
	// 未読イベント＝グローバルパラメータにidが記録されていない かつ 実行済みでない かつ 実行可能なイベント）
	// コマンドリストのrebuildCommand()実行時に判定する
	isUnReadEvent: function(eventType) {
		var session = root.getCurrentSession();
		if (session === null) return false;

		var arr, i, count, event, id;
		
		if (eventType === EventType.COMMUNICATION) {
			arr = EventCommonArray.createArray(session.getCommunicationEventList(), EventType.COMMUNICATION);
		}
		else if (eventType === EventType.TALK) {
			arr = EventCommonArray.createArray(session.getTalkEventList(), EventType.TALK);
		}
		else {
			root.log('不正なeventType');
			return false;
		}
		
		count = arr.length;
		for (i = 0; i < count; i++) {
			event = arr[i];
			id = event.getId();
			// マップ共通イベントならid+1000
			if (event.getCommonEventInfo() !== null) {
				id += CommonEventBaseId;
			}
			
			if (this._isReadEvent(id, eventType) === false) {
				if (event.getExecutedMark() === EventExecutedType.FREE && event.isEvent()) {
					return true;
				}
			}
		}
		
		return false;
	},
	
	// 既読イベントのidをグローバルパラメータに記録する
	_setReadEventId: function(eventId, eventType) {
		var readEvent = this.getGlobalParameter();
		
		if (eventType === EventType.COMMUNICATION) {
			if (root.getBaseScene() === SceneType.REST) {
				if (this._isReadEvent(eventId, eventType) === false) {
					readEvent[ReadEventType.CM_REST].push(eventId);
				}
			}
			else {
				if (this._isReadEvent(eventId, eventType) === false) {
					readEvent[ReadEventType.CM_MAP].push(eventId);
				}
			}
		}
		else if (eventType === EventType.TALK) {
			if (this._isReadEvent(eventId, eventType) === false) {
				readEvent[ReadEventType.TK_REST].push(eventId);
			}
		}
		else {
			root.log('不正なeventType');
			return;
		}
	},
	
	// 既読イベントのidが、グローバルパラメータに記録されているならtrueを返す
	_isReadEvent: function(eventId, eventType) {
		var readEvent = this.getGlobalParameter();
		
		if (eventType === EventType.COMMUNICATION) {
			if (root.getBaseScene() === SceneType.REST) {
				return readEvent[ReadEventType.CM_REST].indexOf(eventId) !== -1;
			}
			else {
				return readEvent[ReadEventType.CM_MAP].indexOf(eventId) !== -1;
			}
		}
		else if (eventType === EventType.TALK) {
			return readEvent[ReadEventType.TK_REST].indexOf(eventId) !== -1;
		}
		else {
			root.log('不正なeventType');
			return false;
		}
	},
			
	// id >= CommonEventBaseId (1000以上）のデータはマップ共有イベントなので一度実行したら既読リストから削除しない
	cutEventId: function(arr) {
		var i;
		var count = arr.length;
		var newArray = [];
 		
		for (i = 0; i < count; i++) {
			if (arr[i] >= CommonEventBaseId) {
				newArray.push(arr[i]);
			}
		}
		
		return newArray;
	},
	
	_spliceId: function(arr, id) {
		var index = arr.indexOf(id);
		
		if (index > -1) {
			arr.splice(index, 1);
		}
	}
};


})();
