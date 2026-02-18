/*
■ファイル
ListCommandScrollbar_drawNewMark.js

■SRPG Studio対応バージョン:1.319

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

※同一idマップを繰り返し利用する場合
本プラグインでは、マップのコミュニケーションイベントの未読判定をマップ毎に初期化します
そのためクエスト等で同一idのマップを繰り返し攻略できる場合
既に実行したイベントであってもマップに入るたびに（マップ共有イベントを除いて）、未読扱いとなりNewマークが表示されます

・機能追加（2026/02/17）
情報収集で繰り返し実行できるイベントを1度でも実行した際に表示色を変更する
（実行済みで再度実行不可のイベントは、通常の処理で灰色で表示されます）
設定項目のViewedEventNameColorで色を指定できます。

・Tips
種別「会話」や「トロフィー」イベントを繰り返し閲覧できるようにしたい
コミュニケーションイベントでは、種別「情報」以外のイベントは一度しか実行できません（<イベントの状態変更>で実行済み解除できない）
その代わり、種別を「情報」にして（イベント名を右クリック）詳細情報からアイコンを変更することで可能になります。
その際、アイテムを再度獲得出来たり、能力値が変更されたりしないようグローバルスイッチや変数を利用してフラグ管理する必要があります。

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2024/08/17 新規作成
2026/02/17 情報収集で繰り返し実行できるイベント（情報タイプ）を1度でも実行したら名前の色を変更できるようにした

*/

(function() {

//-----------------------------
// 設定項目
//-----------------------------
var NewMarkConfig = {
	// Newマークをtext表示する(true) / icon表示（false）
	isMarkText: true,
	text: 'New!',
	// 表示icon text表示採用なら設定不要 
	// {isRuntime: true(ランタイム) / false(オリジナル), id: アイコンリソースid, xSrc: アイコンの位置x座標（左端を0）, ySrc: y座標(上端を0）}
	icon: {isRuntime: true, id: 0, xSrc: 0, ySrc: 0},
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
	commonEventBaseId: 1000
};

//----------------------------------------------------------
// ReadEventCheck (内部ロジック管理)
//----------------------------------------------------------
var ReadEventType = {
	CM_MAP: 0,
	CM_REST: 1,
	TK_REST: 2
};

var ReadEventCheck = {
	// グローバルパラメータの取得と初期化
	getGlobalParameter: function() {
		var meta = root.getMetaSession();
		if (typeof meta.global.ReadEvent !== 'object' || meta.global.ReadEvent === null) {
			this.initGlobalParameter();
		}
		return meta.global.ReadEvent;
	},

	initGlobalParameter: function() {
		var global = root.getMetaSession().global;
		global.ReadEvent = [];
		global.ReadEvent[ReadEventType.CM_MAP] = [];
		global.ReadEvent[ReadEventType.CM_REST] = [];
		global.ReadEvent[ReadEventType.TK_REST] = [];
		global.CurrentMapId = -1;
	},

	// イベントオブジェクトから内部管理用IDを取得
	getInternalId: function(event) {
		var id = event.getId();
		if (event.getCommonEventInfo() !== null) {
			id += NewMarkConfig.commonEventBaseId;
		}
		return id;
	},

	// 既読判定の核となるロジック
	_getStorageType: function(eventType) {
		if (eventType === EventType.COMMUNICATION) {
			return root.getBaseScene() === SceneType.REST ? ReadEventType.CM_REST : ReadEventType.CM_MAP;
		} else if (eventType === EventType.TALK) {
			return ReadEventType.TK_REST;
		}
		return -1;
	},

	isRead: function(eventId, eventType) {
		var type = this._getStorageType(eventType);
		var data = this.getGlobalParameter();
		if (type === -1 || !data[type]) return false;
		
		return data[type].indexOf(eventId) !== -1;
	},

	setRead: function(eventId, eventType) {
		var type = this._getStorageType(eventType);
		var data = this.getGlobalParameter();
		if (type !== -1 && !this.isRead(eventId, eventType)) {
			data[type].push(eventId);
		}
	},

	// 未読の実行可能イベントがあるか確認
	hasUnreadEvent: function(eventType) {
		var session = root.getCurrentSession();
		if (!session) return false;

		var list = (eventType === EventType.COMMUNICATION) ? session.getCommunicationEventList() : session.getTalkEventList();
		var arr = EventCommonArray.createArray(list, eventType);
		var i, event, id;
		
		for (i = 0; i < arr.length; i++) {
			event = arr[i];
			id = this.getInternalId(event);
			
			if (!this.isRead(id, eventType)) {
				// 繰り返し可能かつ実行条件を満たしている
				if (event.getExecutedMark() === EventExecutedType.FREE && event.isEvent()) {
					return true;
				}
			}
		}
		return false;
	}
};

//----------------------------------------------------------
// ListCommandScrollbar クラス拡張
//----------------------------------------------------------
ListCommandScrollbar._isNewMarkIndex_CM = -1;
ListCommandScrollbar._isNewMarkIndex_TK = -1;

var _ListCommandScrollbar_drawScrollContent = ListCommandScrollbar.drawScrollContent;
ListCommandScrollbar.drawScrollContent = function(x, y, object, isSelect, index) {
	_ListCommandScrollbar_drawScrollContent.apply(this, arguments);
	
	if (this._isNewMarkIndex_CM === index || this._isNewMarkIndex_TK === index) {
		this._drawNewMark(x, y);
	}
};

ListCommandScrollbar._drawNewMark = function(x, y) {
	var textui = this.getParentInstance().getCommandTextUI();
	var color = ColorValue.KEYWORD;
	var font = textui.getFont();
	var dx = NewMarkConfig.dx;
	var dy = NewMarkConfig.dy;
		
	if (!NewMarkConfig.isMarkText) {
		var icon = NewMarkConfig.icon;
		var handle = root.createResourceHandle(icon.isRuntime, icon.id, 0, icon.xSrc, icon.ySrc);
		if (handle) {
			GraphicsRenderer.drawImage(x + dx, y + dy, handle, GraphicsType.ICON);
			return;
		}
	}
	TextRenderer.drawText(x + dx, y + dy, NewMarkConfig.text, -1, color, font);
};

//----------------------------------------------------------
// コマンド更新時の共通処理
//----------------------------------------------------------
var CommandHelper = {
	updateNewMarkIndex: function(scrollbar, commandName, eventType, propertyName) {
		var i, count = scrollbar.getObjectCount();
		scrollbar[propertyName] = -1;

		for (i = 0; i < count; i++) {
			if (scrollbar.getObjectFromIndex(i).getCommandName() === commandName) {
				if (ReadEventCheck.hasUnreadEvent(eventType)) {
					scrollbar[propertyName] = i;
				}
				break;
			}
		}
	}
};

//----------------------------------------------------------
// 各種シーン・コマンドへのエイリアス追加
//----------------------------------------------------------

// マップ開始時の初期化
var _BattleSetupScene_setSceneData = BattleSetupScene.setSceneData;
BattleSetupScene.setSceneData = function() {
	_BattleSetupScene_setSceneData.call(this);
	
	var mapId = root.getCurrentSession().getCurrentMapInfo().getId();
	var global = root.getMetaSession().global;
	var data = ReadEventCheck.getGlobalParameter();
		
	if (global.CurrentMapId !== mapId) {
		global.CurrentMapId = mapId;
		// マップ固有の既読情報をクリア（共通イベント以外を削除）
		var filtered = [];
		var cmMap = data[ReadEventType.CM_MAP];
		for (var i = 0; i < cmMap.length; i++) {
			if (cmMap[i] >= NewMarkConfig.commonEventBaseId) filtered.push(cmMap[i]);
		}
		data[ReadEventType.CM_MAP] = filtered;
	}
};

// 戦闘準備
var _SetupCommand_rebuildCommand = SetupCommand.rebuildCommand;
SetupCommand.rebuildCommand = function() {
	_SetupCommand_rebuildCommand.call(this);
	CommandHelper.updateNewMarkIndex(this._commandScrollbar, NewMarkConfig.commandNames.CM_SETUP, EventType.COMMUNICATION, '_isNewMarkIndex_CM');
};

// マップコマンド
var _MapCommand_rebuildCommand = MapCommand.rebuildCommand;
MapCommand.rebuildCommand = function() {
	_MapCommand_rebuildCommand.call(this);
	CommandHelper.updateNewMarkIndex(this._commandScrollbar, NewMarkConfig.commandNames.CM_MAP, EventType.COMMUNICATION, '_isNewMarkIndex_CM');
};

// 拠点コマンド
var _RestCommand_rebuildCommand = RestCommand.rebuildCommand;
RestCommand.rebuildCommand = function() {
	_RestCommand_rebuildCommand.call(this);
	CommandHelper.updateNewMarkIndex(this._commandScrollbar, NewMarkConfig.commandNames.CM_REST, EventType.COMMUNICATION, '_isNewMarkIndex_CM');
	CommandHelper.updateNewMarkIndex(this._commandScrollbar, NewMarkConfig.commandNames.TK_REST, EventType.TALK, '_isNewMarkIndex_TK');
};

//----------------------------------------------------------
// イベント実行時の既読登録
//----------------------------------------------------------
var _CommunicationScreen__startEvent = CommunicationScreen._startEvent;
CommunicationScreen._startEvent = function() {
	var entry = this._scrollbar.getObject();
	if (entry && entry.event) {
		ReadEventCheck.setRead(ReadEventCheck.getInternalId(entry.event), EventType.COMMUNICATION);
	}
	_CommunicationScreen__startEvent.call(this);
};	

var _ImageTalkScreen__startTalkEvent = ImageTalkScreen._startTalkEvent;
ImageTalkScreen._startTalkEvent = function() {
	var entry = this._imageTalkWindow.getChildScrollbar().getObject();
	if (entry && entry.event) {
		ReadEventCheck.setRead(ReadEventCheck.getInternalId(entry.event), EventType.TALK);
	}
	_ImageTalkScreen__startTalkEvent.call(this);
};

// 既読イベントの色変更
var _CommunicationScrollbar__getEventColor = CommunicationScrollbar._getEventColor;
CommunicationScrollbar._getEventColor = function(object, textui) {
	var id = ReadEventCheck.getInternalId(object.event);
	if (this._isSelectable(object) && ReadEventCheck.isRead(id, EventType.COMMUNICATION)) {
		return NewMarkConfig.viewedColor;
	}
	return _CommunicationScrollbar__getEventColor.call(this, object, textui);
};

})();
