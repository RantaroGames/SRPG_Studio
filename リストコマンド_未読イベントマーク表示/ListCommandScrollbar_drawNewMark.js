/*
■ファイル
ListCommandScrollbar_drawNewMark.js

■SRPG Studio対応バージョン:1.322

■プラグインの概要
未読イベントがある場合、リストコマンドにNEWマークを表示します

本プラグインでマーク表示できるコマンドは、以下の4つに限られます
・コミュニケーションイベント（戦闘準備）
・コミュニケーションイベント（マップコマンド）
・コミュニケーションイベント（拠点）
・会話イベント（拠点）

***********************************************************
■注意
旧版（2026/02/17以前に更新したもの）とは互換性がありません。
同時に導入しないでください。
***********************************************************

■使用方法
1.このファイルをpluginフォルダに入れる

2.本プラグイン内の設定項目を設定する

※同一idマップを繰り返し利用する場合
本プラグインでは、マップのコミュニケーションイベントの未読判定をマップ毎に初期化します
そのためクエスト等で同一idのマップを繰り返し攻略できる場合
既に実行したイベントであってもマップに入るたびに（マップ共有イベントを除いて）、未読扱いとなりNewマークが表示されます

■その他の機能(コミュニケーションイベントのみ実装)
・情報収集で繰り返し実行できるイベントを1度でも実行した際に表示色を変更する
（実行済みで再度実行不可のイベントは、通常の処理で灰色で表示されます）
設定項目のViewedEventNameColorで色を指定できます。

・Tips
種別「会話」や「トロフィー」イベントを繰り返し閲覧できるようにしたい
コミュニケーションイベントでは、種別「情報」以外のイベントは一度しか実行できません（<イベントの状態変更>で実行済み解除できない）
その代わり、種別を「情報」にして（イベント名を右クリック）詳細情報からアイコンを変更することで可能になります。
その際、アイテムを再度獲得出来たり、能力値が変更されたりしないようグローバルスイッチや変数を利用してフラグ管理する必要があります。

・情報収集で現在選択中の項目の文字を点滅させる
isHighlightSelectedItemがtrueの時に有効
点滅間隔やアルファ値の変化量は設定で変更できます。

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
(旧版)
2024/08/17 新規作成
2026/02/17 情報収集で繰り返し実行できるイベント（情報タイプ）を1度でも実行したら名前の色を変更できるようにした

（新版）
2026/05/23 （旧版）をリファクタリング
コミュニケーションイベントで選択中の項目を点滅させる機能を追加

*/

var RantaroGames = RantaroGames || {};
RantaroGames.ReadEventNewMark = RantaroGames.ReadEventNewMark || {};

(function() {

//--------------------------------------------------------------------------
// Settings
//--------------------------------------------------------------------------
var NewMarkConfig = {
	// true: text を表示、false: icon を表示
	isMarkText: true,
	text: 'New!',
	// 表示icon text表示採用なら設定不要 
	// {isRuntime: true(ランタイム) / false(オリジナル), id: アイコンリソースid, xSrc: アイコンの位置x座標（左端を0）, ySrc: y座標(上端を0）}
	icon: {isRuntime: false, id: 2, xSrc: 8, ySrc: 0},
	// 描画位置補正
	dx: 20,
	dy: 10,	
	// コマンド名定義
	// ゲーム内で表示されるテキストではなくコマンドレイアウトで設定した名前を指定する \（バックスラッシュ）を含む場合は \\文字 のように\を一つ追加して記述する
	commandNames: {
		CM_SETUP: '情報収集',
		CM_MAP: '情報収集',
		CM_REST: '情報収集',
		TK_REST: '会話選択'
	},	
	// 既読イベントの色
	viewedColor: 0x99ccff,
	// マップ共通イベントのオフセットID
	commonEventBaseId: 1000,
	
	// 選択中の項目を点滅させるか否か
	isHighlightSelectedItem: false,
	// 点滅間隔フレーム数
	lightUpCounterMax: 60,
	// アルファ値の基準
	baseAlpha: 0,
	// 変化量の最小最大値
	min: 64,
	max: 255
	
};

//--------------------------------------------------------------------------
// Read event state
//--------------------------------------------------------------------------
var ReadEventType = {
	CM_MAP: 0,
	CM_REST: 1,
	TK_REST: 2
};

var ReadEventStore = {
	getGlobalParameter: function() {
		var global = root.getMetaSession().global;
		var data = global.RantaroGames_ReadEvent;

		// グローバルパラメータ（新版）が未存在
		if (typeof data !== 'object' || data === null) {
			data = this._migrateOldData(global);
			global.RantaroGames_ReadEvent = data;
		}

		this._normalizeGlobalParameter(data);
		return data;
	},

	_migrateOldData: function(global) {
		var data = this._createGlobalParameter();
		
		// 旧版のグローバルパラメータの存在を確認して移行処理を行う
		// 旧版では、ReadEvent{配列} CurrentMapId｛数値｝で保持していた
		if (typeof global.ReadEvent === 'object' && global.ReadEvent !== null) {
			data.readEvent = global.ReadEvent;
		}

		data.currentMapId =	typeof global.CurrentMapId === 'number' ? global.CurrentMapId : -1;

		// 旧版データの初期化（保留。現状放置）
		// global.ReadEvent = null;
		// global.CurrentMapId = null;

		return data;
	},
	
	_createGlobalParameter: function() {
		var data = {};

		data.readEvent = [];
		data.readEvent[ReadEventType.CM_MAP] = [];
		data.readEvent[ReadEventType.CM_REST] = [];
		data.readEvent[ReadEventType.TK_REST] = [];
		data.currentMapId = -1;
		data.unreadCache = {};
		data.cacheDirty = {};

		return data;
	},

	_normalizeGlobalParameter: function(data) {
		if (!data.readEvent) {
			data.readEvent = [];
		}
		if (!data.readEvent[ReadEventType.CM_MAP]) {
			data.readEvent[ReadEventType.CM_MAP] = [];
		}
		if (!data.readEvent[ReadEventType.CM_REST]) {
			data.readEvent[ReadEventType.CM_REST] = [];
		}
		if (!data.readEvent[ReadEventType.TK_REST]) {
			data.readEvent[ReadEventType.TK_REST] = [];
		}
		if (typeof data.currentMapId !== 'number') {
			data.currentMapId = -1;
		}
		if (!data.unreadCache) {
			data.unreadCache = {};
		}
		if (!data.cacheDirty) {
			data.cacheDirty = {};
		}
	},

	getInternalId: function(event) {
		var id = event.getId();

		if (event.getCommonEventInfo() !== null) {
			id += NewMarkConfig.commonEventBaseId;
		}

		return id;
	},

	_getStorageType: function(eventType) {
		if (eventType === EventType.COMMUNICATION) {
			return root.getBaseScene() === SceneType.REST ? ReadEventType.CM_REST : ReadEventType.CM_MAP;
		}
		if (eventType === EventType.TALK) {
			return ReadEventType.TK_REST;
		}

		return -1;
	},

	isRead: function(eventId, eventType) {
		var type = this._getStorageType(eventType);
		var data = this.getGlobalParameter();

		if (type === -1) {
			return false;
		}

		return data.readEvent[type].indexOf(eventId) !== -1;
	},

	setRead: function(eventId, eventType) {
		var type = this._getStorageType(eventType);
		var data = this.getGlobalParameter();

		if (type === -1) {
			return;
		}

		if (data.readEvent[type].indexOf(eventId) === -1) {
			data.readEvent[type].push(eventId);
			this.invalidate(type);
		}
	},

	invalidate: function(type) {
		var data = this.getGlobalParameter();

		if (type === -1) {
			return;
		}

		data.cacheDirty[type] = true;
	},

	invalidateCommunication: function() {
		this.invalidate(this._getStorageType(EventType.COMMUNICATION));
	},

	invalidateTalk: function() {
		this.invalidate(this._getStorageType(EventType.TALK));
	},

	hasUnreadEvent: function(eventType) {
		var type = this._getStorageType(eventType);
		var data = this.getGlobalParameter();

		if (type === -1) {
			return false;
		}

		if (data.cacheDirty[type] !== true && typeof data.unreadCache[type] === 'boolean') {
			return data.unreadCache[type];
		}

		data.unreadCache[type] = this._checkUnreadEvent(eventType);
		data.cacheDirty[type] = false;

		return data.unreadCache[type];
	},

	_checkUnreadEvent: function(eventType) {
		var session = root.getCurrentSession();
		var list, arr, i, event, id;

		if (session === null) {
			return false;
		}

		list = eventType === EventType.COMMUNICATION ? session.getCommunicationEventList() : session.getTalkEventList();
		arr = EventCommonArray.createArray(list, eventType);

		for (i = 0; i < arr.length; i++) {
			event = arr[i];
			if (!this.isRunnableEvent(event)) {
				continue;
			}

			id = this.getInternalId(event);
			if (!this.isRead(id, eventType)) {
				return true;
			}
		}

		return false;
	},

	isRunnableEvent: function(event) {
		return event !== null && event.getExecutedMark() === EventExecutedType.FREE && event.isEvent();
	},

	refreshMap: function() {
		var session = root.getCurrentSession();
		var mapInfo, mapId, data, readArray, filtered, i;

		if (session === null) {
			return;
		}

		mapInfo = session.getCurrentMapInfo();
		if (mapInfo === null) {
			return;
		}

		mapId = mapInfo.getId();
		data = this.getGlobalParameter();
		if (data.currentMapId === mapId) {
			return;
		}

		data.currentMapId = mapId;
		readArray = data.readEvent[ReadEventType.CM_MAP];
		filtered = [];

		// マップ固有イベントはマップ変更で破棄し、マップ共有イベントだけ残します。
		for (i = 0; i < readArray.length; i++) {
			if (readArray[i] >= NewMarkConfig.commonEventBaseId) {
				filtered.push(readArray[i]);
			}
		}

		data.readEvent[ReadEventType.CM_MAP] = filtered;
		this.invalidate(ReadEventType.CM_MAP);
	}
};

RantaroGames.ReadEventNewMark.Store = ReadEventStore;

//--------------------------------------------------------------------------
// List command marker
//--------------------------------------------------------------------------
var CommandMarker = {
	prepareScrollbar: function(scrollbar) {
		if (!scrollbar._rgCommandState) {
			scrollbar._rgCommandState = [];
		}
	},

	updateCommandState: function(scrollbar, commandName, eventType) {
		var i, count, object, hasUnread;

		if (scrollbar === null) {
			return;
		}

		this.prepareScrollbar(scrollbar);
		this._removeCommandState(scrollbar, commandName);

		hasUnread = ReadEventStore.hasUnreadEvent(eventType);
		count = scrollbar.getObjectCount();
		for (i = 0; i < count; i++) {
			object = scrollbar.getObjectFromIndex(i);
			if (object !== null && object.getCommandName() === commandName) {
				scrollbar._rgCommandState.push({
					object: object,
					commandName: commandName,
					eventType: eventType,
					hasUnread: hasUnread
				});
				break;
			}
		}
	},

	isMarkedObject: function(scrollbar, object) {
		var state = this._getCommandState(scrollbar, object);

		if (state === null) {
			return false;
		}

		return state.hasUnread === true;
	},

	_getCommandState: function(scrollbar, object) {
		var i, state;

		if (scrollbar === null || object === null || !scrollbar._rgCommandState) {
			return null;
		}

		for (i = 0; i < scrollbar._rgCommandState.length; i++) {
			state = scrollbar._rgCommandState[i];
			if (state.object === object) {
				return state;
			}
		}

		return null;
	},

	_removeCommandState: function(scrollbar, commandName) {
		var i;

		for (i = scrollbar._rgCommandState.length - 1; i >= 0; i--) {
			if (scrollbar._rgCommandState[i].commandName === commandName) {
				scrollbar._rgCommandState.splice(i, 1);
			}
		}
	}
};

//--------------------------------------------------------------------------
// ListCommandScrollbar extension
//--------------------------------------------------------------------------

var aliasListCommandScrollbarInitialize = ListCommandScrollbar.initialize;
ListCommandScrollbar.initialize = function() {
	aliasListCommandScrollbarInitialize.apply(this, arguments);
	
	var icon = NewMarkConfig.icon;
	this._rgNewMarkHandle = root.createResourceHandle(icon.isRuntime, icon.id, 0, icon.xSrc, icon.ySrc);
};

var aliasListCommandScrollbarDrawScrollContent = ListCommandScrollbar.drawScrollContent;
ListCommandScrollbar.drawScrollContent = function(x, y, object, isSelect, index) {
	aliasListCommandScrollbarDrawScrollContent.apply(this, arguments);

	if (CommandMarker.isMarkedObject(this, object)) {
		this._rgDrawNewMark(x, y);
	}
};

ListCommandScrollbar._rgDrawNewMark = function(x, y) {
	var textui = this.getParentInstance().getCommandTextUI();
	var color = ColorValue.KEYWORD;
	var font = textui.getFont();
	var icon, handle;

	if (!NewMarkConfig.isMarkText) {
		if (!this._rgNewMarkHandle) {
			icon = NewMarkConfig.icon;
			this._rgNewMarkHandle = root.createResourceHandle(icon.isRuntime, icon.id, 0, icon.xSrc, icon.ySrc);
		}
		handle = this._rgNewMarkHandle;
		
		if (handle !== null) {
			GraphicsRenderer.drawImage(x + NewMarkConfig.dx, y + NewMarkConfig.dy, handle, GraphicsType.ICON);
			return;
		}
	}

	TextRenderer.drawText(x + NewMarkConfig.dx, y + NewMarkConfig.dy, NewMarkConfig.text, -1, color, font);
};

//--------------------------------------------------------------------------
// Command manager aliases
//--------------------------------------------------------------------------
var aliasSetupCommandRebuildCommand = SetupCommand.rebuildCommand;
SetupCommand.rebuildCommand = function() {
	aliasSetupCommandRebuildCommand.call(this);
	CommandMarker.updateCommandState(this._commandScrollbar, NewMarkConfig.commandNames.CM_SETUP, EventType.COMMUNICATION);
};

var aliasMapCommandRebuildCommand = MapCommand.rebuildCommand;
MapCommand.rebuildCommand = function() {
	aliasMapCommandRebuildCommand.call(this);
	CommandMarker.updateCommandState(this._commandScrollbar, NewMarkConfig.commandNames.CM_MAP, EventType.COMMUNICATION);
};

var aliasRestCommandRebuildCommand = RestCommand.rebuildCommand;
RestCommand.rebuildCommand = function() {
	aliasRestCommandRebuildCommand.call(this);
	CommandMarker.updateCommandState(this._commandScrollbar, NewMarkConfig.commandNames.CM_REST, EventType.COMMUNICATION);
	CommandMarker.updateCommandState(this._commandScrollbar, NewMarkConfig.commandNames.TK_REST, EventType.TALK);
};

//--------------------------------------------------------------------------
// Scene/event aliases
//--------------------------------------------------------------------------
var aliasBattleSetupSceneSetSceneData = BattleSetupScene.setSceneData;
BattleSetupScene.setSceneData = function() {
	aliasBattleSetupSceneSetSceneData.call(this);
	ReadEventStore.refreshMap();
	ReadEventStore.invalidate(ReadEventType.CM_MAP);
};

if (typeof RestScene !== 'undefined') {
	var aliasRestSceneSetSceneData = RestScene.setSceneData;
	RestScene.setSceneData = function() {
		aliasRestSceneSetSceneData.call(this);
		ReadEventStore.invalidate(ReadEventType.CM_REST);
		ReadEventStore.invalidate(ReadEventType.TK_REST);
	};
}

var aliasCommunicationScreenStartEvent = CommunicationScreen._startEvent;
CommunicationScreen._startEvent = function() {
	var entry = this._scrollbar.getObject();

	if (entry !== null && entry.event !== null) {
		ReadEventStore.setRead(ReadEventStore.getInternalId(entry.event), EventType.COMMUNICATION);
	}

	ReadEventStore.invalidateCommunication();
	aliasCommunicationScreenStartEvent.call(this);
};

var aliasCommunicationScreenEndCommunicationEvent = CommunicationScreen._endCommunicationEvent;
CommunicationScreen._endCommunicationEvent = function() {
	aliasCommunicationScreenEndCommunicationEvent.call(this);
	ReadEventStore.invalidateCommunication();
};

var aliasImageTalkScreenStartTalkEvent = ImageTalkScreen._startTalkEvent;
ImageTalkScreen._startTalkEvent = function() {
	var entry = this._imageTalkWindow.getChildScrollbar().getObject();

	if (entry !== null && entry.event !== null) {
		ReadEventStore.setRead(ReadEventStore.getInternalId(entry.event), EventType.TALK);
	}

	ReadEventStore.invalidateTalk();
	aliasImageTalkScreenStartTalkEvent.call(this);
};

var aliasImageTalkScreenEndTalkEvent = ImageTalkScreen._endTalkEvent;
ImageTalkScreen._endTalkEvent = function() {
	aliasImageTalkScreenEndTalkEvent.call(this);
	ReadEventStore.invalidateTalk();
};

var aliasRestCommandImageTalkMoveCommand = RestCommand.ImageTalk.moveCommand;
RestCommand.ImageTalk.moveCommand = function() {
	var result = aliasRestCommandImageTalkMoveCommand.call(this);

	if (result !== MoveResult.CONTINUE && this._listCommandManager !== null) {
		ReadEventStore.invalidateTalk();
		this._listCommandManager.rebuildCommandEx();
	}

	return result;
};

//--------------------------------------------------------------------------
// CommunicationScrollbar color and selected alpha
//--------------------------------------------------------------------------
var aliasCommunicationScrollbarGetEventColor = CommunicationScrollbar._getEventColor;
CommunicationScrollbar._getEventColor = function(object, textui) {
	var id;

	if (object !== null && object.event !== null) {
		id = ReadEventStore.getInternalId(object.event);
		if (ReadEventStore.isRunnableEvent(object.event) && ReadEventStore.isRead(id, EventType.COMMUNICATION)) {
			return NewMarkConfig.viewedColor;
		}
	}

	return aliasCommunicationScrollbarGetEventColor.call(this, object, textui);
};

var aliasCommunicationScrollbarInitialize = CommunicationScrollbar.initialize;
CommunicationScrollbar.initialize = function() {
	aliasCommunicationScrollbarInitialize.apply(this, arguments);
	
	this._rgLightUpCycleCounter = null;
	if (NewMarkConfig.isHighlightSelectedItem === true) {
		this._rgLightUpCycleCounter = createObject(CycleCounter);
		this._rgLightUpCycleCounter.setCounterInfo(NewMarkConfig.lightUpCounterMax);
		this._rgLightUpCycleCounter.disableGameAcceleration();
	}
};

var aliasCommunicationScrollbarDrawScrollbar = CommunicationScrollbar.drawScrollbar;
CommunicationScrollbar.drawScrollbar = function(xStart, yStart) {
	if (this._rgLightUpCycleCounter) {
		this._rgLightUpCycleCounter.moveCycleCounter();
	}

	aliasCommunicationScrollbarDrawScrollbar.apply(this, arguments);
};

var aliasCommunicationScrollbarDrawName = CommunicationScrollbar._drawName;
CommunicationScrollbar._drawName = function(x, y, object, isSelect, index) {
	var textui, color, font, alpha;

	if (!isSelect || !this._rgLightUpCycleCounter) {
		aliasCommunicationScrollbarDrawName.call(this, x, y, object, isSelect, index);
		return;
	}

	textui = this.getParentTextUI();
	color = this._getEventColor(object, textui);
	font = textui.getFont();
	alpha = RantaroGames.ReadEventNewMark.RendererControl.getTextAlpha(
		NewMarkConfig.baseAlpha,
		NewMarkConfig.min,
		NewMarkConfig.max,
		this._rgLightUpCycleCounter,
		NewMarkConfig.lightUpCounterMax
	);

	TextRenderer.drawAlphaText(x, y + ContentLayout.KEYWORD_HEIGHT, object.event.getName(), -1, color, alpha, font);
};

RantaroGames.ReadEventNewMark.RendererControl = {
	getTextAlpha: function(baseAlpha, min, max, counter, counterMax) {
		var t = counter.getCounter() / counterMax;
		var rate = (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2;

		rate = Math.pow(rate, 2.5);
		return Math.floor(min + (max - min) * rate) + baseAlpha;
	}
};

})();
