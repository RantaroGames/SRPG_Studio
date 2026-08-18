/*
 「ステート一覧」コマンドを実装します
 データ設定>ステートで設定したステートリストを表示します
 
 以下の二つのプラグインが別途必要です
 #RantaroGamesPlugin.js
 99_StateInfoWindow_RG.js
*/ 

var RantaroGames = RantaroGames || {};

(function() {

//-----------------------------------------------
// 設定項目
//-----------------------------------------------
var StateDataListScreenSetting = {
	// ステートリスト画面のタイトル文字列。''で囲う
	  Title: 'ステート一覧'
	// リソース>リソース使用箇所>画面の内部名の文字列を''で囲う
	, ScreenInteropData: 'SkillList'
	// <イベントコマンド呼出し>のオブジェクト名。''で囲う
	, Keyword: 'CEC_StateDataScreen'
	// ステートが付与されているユニットリストのタイトル文字
	, OwnerTitle: 'ステート付与者'

	// マップコマンドに追加する場合 true しない場合 false
	, MapCommand: true
	// マップコマンドリストの下からn番目に追加する
	, MapCommandIndex: 1
	
	// 戦闘準備コマンドに追加する場合 true しない場合 false
	, SetupCommand: true
	 // 戦闘準備コマンドリストの下からn番目に追加する
	, SetupCommandIndex: 1
	
	// 拠点コマンドに追加する場合 true しない場合 false
	, RestCommand: true
	 // 拠点コマンドリストの下からn番目に追加する
	, RestCommandIndex: 1
};

var StateDataScreenMode = {
	STATESIDE: 0,
	OWNERSIDE: 1
};

var StateDataScreen = defineObject(BaseScreen,
{
	_stateListWindow: null,
	_stateInfoWindow: null,
	_ownerListWindow: null,
	_unitSimpleWindow: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === StateDataScreenMode.STATESIDE) {
			result = this._moveStateSide();
		}
		else if (mode === StateDataScreenMode.OWNERSIDE) {
			result = this._moveOwnerSide();
		}
		
		this._unitSimpleWindow.moveWindow();
		
		return result;
	},
	
	drawScreenCycle: function() {
		var height = this._stateListWindow.getWindowHeight();
		var width = this._stateInfoWindow.getWindowWidth() + this._stateListWindow.getWindowWidth() + this._ownerListWindow.getWindowWidth();
		
		var isClipped = width > root.getGameAreaWidth();
		if (isClipped) {
			width = this._stateInfoWindow.getWindowWidth() + this._stateListWindow.getWindowWidth();
		}
		
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		var x_info = x + this._stateListWindow.getWindowWidth();
		var x_owner = isClipped ? x_info : x_info + this._stateInfoWindow.getWindowWidth();
		
		this._stateListWindow.drawWindow(x, y);
		this._ownerListWindow.drawWindow(x_owner, y);
		this._stateInfoWindow.drawWindow(x_info, y + (height - this._stateInfoWindow.getWindowHeight()));
			
		this._drawOwnerTitle(x_owner, y);
		
		if (this.getCycleMode() === StateDataScreenMode.OWNERSIDE) {
			this._unitSimpleWindow.drawWindow(x_owner, y + (height - this._unitSimpleWindow.getWindowHeight()));
		}
	},
	
	drawScreenBottomText: function(textui) {
		var description = '';
		var state = this._stateInfoWindow.getInfoState();
		
		if (state !== null) {
			description = state.getDescription();
		}
		
		TextRenderer.drawScreenBottomText(description, textui);
	},
	
	getScreenTitleName: function() {
		var interopData = this.getScreenInteropData();
		
		if (interopData === null) {
			return '';
		}
		
		return StateDataListScreenSetting.Title;
//		return interopData.getScreenTitleName();
	},
	
	getScreenInteropData: function() {
		return root.queryScreen(StateDataListScreenSetting.ScreenInteropData);
	},
	
	changeState: function(obj) {
		this._stateInfoWindow.setInfoState(obj.state);
		this._ownerListWindow.setOwnerArray(obj.unitArray);
	},
	
	changeUnit: function(unit) {
		this._unitSimpleWindow.setFaceUnitData(unit);
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._stateListWindow = createWindowObject(StateListWindow, this);
		this._stateInfoWindow = createWindowObject(RantaroGames.StateInfoWindow, this);
		this._ownerListWindow = createWindowObject(OwnerListWindow, this);
		this._unitSimpleWindow = createWindowObject(UnitSimpleWindow, this);
	},
	
	_completeScreenMemberData: function(screenParam) {
		var arr = this._getArray();
		
		this._stateListWindow.setWindowData();
		this._stateListWindow.setStateArray(arr);
		
		this._stateInfoWindow.setInfoState(arr[0].state);
		
		this._ownerListWindow.setWindowData();
		this._ownerListWindow.setOwnerArray(arr[0].unitArray);
	},
	
	_moveStateSide: function() {
		var input = this._stateListWindow.moveWindow();
		var result = MoveResult.CONTINUE;
		
		if (input === ScrollbarInput.SELECT) {
			if (this._ownerListWindow.getOwnerCount() > 0) {
				this._changeActiveWindow();
				this.changeCycleMode(StateDataScreenMode.OWNERSIDE);
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			result = MoveResult.END;
		}
		else {
			if (this._stateListWindow.isIndexChanged()) {
				this.changeState(this._stateListWindow.getStateObject());
			}
		}
		
		return result;
	},
	
	_moveOwnerSide: function() {
		var input = this._ownerListWindow.moveWindow();
		var result = MoveResult.CONTINUE;
		
		if (input === ScrollbarInput.CANCEL) {
			this._changeActiveWindow();
			this.changeCycleMode(StateDataScreenMode.STATESIDE);
		}
		else {
			if (this._ownerListWindow.isIndexChanged()) {
				this.changeUnit(this._ownerListWindow.getUnit());
			}
		}
		
		return result;
	},
	
	_drawOwnerTitle: function(x, y) {
		var textui = this._getTitleTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var text = StateDataListScreenSetting.OwnerTitle;
		var titleCount = this._getTitlePartsCount();
		var width = this._ownerListWindow.getWindowWidth() - (TitleRenderer.getTitlePartsWidth() * (titleCount + 2));
		
		width = Math.floor(width / 2);
		TextRenderer.drawFixedTitleText(x + width, y - 38, text, color, font, TextFormat.CENTER, pic, titleCount);
	},
	
	_getTitlePartsCount: function() {
		return 4;
	},
	
	_changeActiveWindow: function() {
		if (this.getCycleMode() === StateDataScreenMode.STATESIDE) {
			this._ownerListWindow.setActive(true);
			this._stateListWindow.setActive(false);
		}
		else {
			this._ownerListWindow.setActive(false);
			this._stateListWindow.setActive(true);
		}
	},
	
	_getArray: function() {
		var i, state, obj;
		var list = root.getBaseData().getStateList();
		var count = list.getCount();
		var arr = [];
		var unitStateArray = this._getUnitStateArray();
		
		for (i = 0; i < count; i++) {
			state = list.getData(i);
			if (!this._isStateAllowed(state)) {
				continue;
			}
			
			obj = {};
			obj.state = state;
			obj.unitArray = this._getUnitArray(state, unitStateArray);
			arr.push(obj);
		}
		
		return arr;
	},
	
	_getUnitStateArray: function() {
		var i, list, listArray = [];
		var arr = [];
		
		list = root.getCurrentScene() === SceneType.BATTLESETUP ? 
			 PlayerList.getAliveList() : PlayerList.getSortieList();
		listArray.push(list);
		listArray.push(EnemyList.getAliveList());
		listArray.push(AllyList.getAliveList());
		
		for (i = 0; i < listArray.length; i++) {
			getStateOwner(listArray[i], arr)
		}
		
		function getStateOwner(list, arr)
		{
			var i, unit, turnStateList, obj;
			var count = list.getCount();
			
			for (i = 0; i < count; i++) {
				unit = list.getData(i);
				turnStateList = unit.getTurnStateList();
				
				obj = {};
				obj.unit = unit;
				obj.turnStateList = turnStateList;
				arr.push(obj);
			}
		}
		
		return arr;
	},
	
	_getUnitArray: function(state, unitStateArray) {
		var i, j, count2;
		var count = unitStateArray.length;
		var arr = [];
		
		for (i = 0; i < count; i++) {
			count2 = unitStateArray[i].turnStateList.getCount();
			for (j = 0; j < count2; j++) {
				if (unitStateArray[i].turnStateList.getData(j).getState() === state) {
					arr.push(unitStateArray[i].unit);
					break;
				}
			}
		}
		
		return arr;
	},
		
	_isStateAllowed: function(state) {
		// 「メニュー上で表示しない」 または 名前が空白のステートはマスクデータとみなしてリストに表示しない
		return !state.isHidden() && state.getName() !== '';
	},
	
	_getTitleTextUI: function() {
		return root.queryTextUI('objective_title');
	}
}
);

var StateListWindow = defineObject(BaseWindow,
{
	_scrollbar: null,
	
	setWindowData: function() {
		var count = LayoutControl.getObjectVisibleCount(DefineControl.getTextPartsHeight(), 12);
		
		this._scrollbar = createScrollbarObject(StateScrollbar, this);
		this._scrollbar.setActive(true);
		this._scrollbar.setScrollFormation(1, count);
		this._scrollbar.enablePageChange();
	},
	
	setStateArray: function(objectArray) {
		this._scrollbar.setObjectArray(objectArray);
	},
	
	setActive: function(isActive) {
		this._scrollbar.setActive(isActive);
		
		if (isActive) {
			this._scrollbar.setForceSelect(-1);
		}
		else {
			this._scrollbar.setForceSelect(this._scrollbar.getIndex());
		}
	},
	
	moveWindowContent: function() {
		return this._scrollbar.moveInput();
	},
	
	drawWindowContent: function(x, y) {
		this._scrollbar.drawScrollbar(x, y);
	},
	
	getWindowWidth: function() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2);
	},
	
	getWindowHeight: function() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	},
	
	getListIndex: function() {
		return this._scrollbar.getIndex();
	},
	
	isIndexChanged: function() {
		return this._scrollbar.checkAndUpdateIndex();
	},
	
	getStateObject: function() {
		return this._scrollbar.getObject();
	}
}
);

var StateScrollbar = defineObject(BaseScrollbar,
{
	drawScrollContent: function(x, y, object, isSelect, index) {
		this._drawIcon(x, y, object, isSelect, index);
		this._drawName(x, y, object, isSelect, index);
	},
	
	getObjectWidth: function() {
		return ItemRenderer.getItemWidth() - 60;
	},
	
	getObjectHeight: function() {
		return DefineControl.getTextPartsHeight();
	},
	
	_drawIcon: function(x, y, object, isSelect, index) {
		if (this._isVisible(object)) {
			GraphicsRenderer.drawImage(x, y, object.state.getIconResourceHandle(), GraphicsType.ICON);
		}
	},
	
	_drawName: function(x, y, object, isSelect, index) {
		var name;
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		if (this._isVisible(object)) {
			name = object.state.getName();
		}
		else {
			name = StringTable.HideData_Question;
		}
		
		x += GraphicsFormat.ICON_WIDTH + 10;
		TextRenderer.drawKeywordText(x, y, name, length, color, font);
	},
	
	_isVisible: function(object) {
		return true;
	//	return object.unitArray.length !== 0;
	},
	
	_getTextLength: function() {
		return this.getObjectWidth();
	}
}
);

var OwnerListWindow = defineObject(BaseWindow,
{
	_scrollbar: null,
	
	setWindowData: function() {
		var count = LayoutControl.getObjectVisibleCount(DefineControl.getTextPartsHeight(), 8);
		
		this._scrollbar = createScrollbarObject(OwnerListScrollbar, this);
		this._scrollbar.setActive(false);
		this._scrollbar.setScrollFormation(1, count);
	},
	
	setOwnerArray: function(objectArray) {
		this._scrollbar.setObjectArray(objectArray);
	},
	
	setActive: function(isActive) {
		this._scrollbar.setActive(isActive);
		if (isActive) {
			this.getParentInstance().changeUnit(this._scrollbar.getObject());
		}
	},
	
	getOwnerCount: function() {
		return this._scrollbar.getObjectCount();
	},
	
	moveWindowContent: function() {
		return this._scrollbar.moveInput();
	},
	
	drawWindowContent: function(x, y) {
		this._scrollbar.drawScrollbar(x, y);
	},
	
	getWindowWidth: function() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2);
	},
	
	getWindowHeight: function() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	},
	
	getRecentlyInputType: function() {
		return this._scrollbar.getRecentlyInputType();
	},
	
	getListIndex: function() {
		return this._scrollbar.getIndex();
	},
	
	isIndexChanged: function() {
		return this._scrollbar.checkAndUpdateIndex();
	},
	
	getUnit: function() {
		return this._scrollbar.getObject();
	}
}
);

var OwnerListScrollbar = defineObject(BaseScrollbar,
{
	drawScrollContent: function(x, y, object, isSelect, index) {
		this._drawName(x, y, object, isSelect, index);
	},
	
	getObjectWidth: function() {
		return 240 - (this.getParentInstance().getWindowXPadding() * 2);
	},
	
	getObjectHeight: function() {
		return DefineControl.getTextPartsHeight();
	},
	
	_drawName: function(x, y, object, isSelect, index) {
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		TextRenderer.drawKeywordText(x, y, object.getName(), length, color, font);
	},
	
	_getTextLength: function() {
		return this.getObjectWidth();
	}
}
);


//------------------------------------------------
// 内部用共通処理（画面呼び出しの重複回避）
//------------------------------------------------
var StateDataScreenLauncher = {
	open: function() {
		var screen = createObject(StateDataScreen);
		var param = {};
		SceneManager.addScreen(screen, param);
		SceneManager.setForceForeground(true);
		return screen;
	},
	
	move: function(screen) {
		if (SceneManager.isScreenClosed(screen)) {
			SceneManager.setForceForeground(false);
			return MoveResult.END;
		}
		return MoveResult.CONTINUE;
	}
};


//-----------------------------------------
// 各種コマンドへの登録
//-----------------------------------------

// イベントコマンド
var _ScriptExecuteEventCommand__configureOriginalEventCommand = ScriptExecuteEventCommand._configureOriginalEventCommand;
ScriptExecuteEventCommand._configureOriginalEventCommand = function(groupArray) {
	_ScriptExecuteEventCommand__configureOriginalEventCommand.call(this, groupArray);
	groupArray.appendObject(EC_StateDataScreen_RG);
};

var EC_StateDataScreen_RG = defineObject(BaseEventCommand, {
	_statedataScreenRG: null,
	enterEventCommandCycle: function() {
		this._statedataScreenRG = StateDataScreenLauncher.open();
		return EnterResult.OK;
	},
	moveEventCommandCycle: function() {
		return StateDataScreenLauncher.move(this._statedataScreenRG);
	},
	getEventCommandName: function() { return StateDataListScreenSetting.Keyword; },
	isEventCommandSkipAllowed: function() { return false; }
});

// マップコマンド
var _MapCommand_configureCommands = MapCommand.configureCommands;
MapCommand.configureCommands = function(groupArray) {
	var index = groupArray.length - StateDataListScreenSetting.MapCommandIndex;
	_MapCommand_configureCommands.call(this, groupArray);
	if (StateDataListScreenSetting.MapCommand) {
		groupArray.insertObject(MapCommand.StateDataList, index);
	}
};

MapCommand.StateDataList = defineObject(BaseListCommand, {
	_screen: null,
	openCommand: function() { this._screen = StateDataScreenLauncher.open(); },
	moveCommand: function() { return StateDataScreenLauncher.move(this._screen); },
	getCommandName: function() { return StateDataListScreenSetting.Title; }
});

// 戦闘準備コマンド
var _SetupCommand_configureCommands = SetupCommand.configureCommands;
SetupCommand.configureCommands = function(groupArray) {
	var index = groupArray.length - StateDataListScreenSetting.SetupCommandIndex;
	_SetupCommand_configureCommands.call(this, groupArray);
	if (StateDataListScreenSetting.SetupCommand) {
		groupArray.insertObject(SetupCommand.StateDataList, index);
	}
};

SetupCommand.StateDataList = defineObject(BaseListCommand, {
	_screen: null,
	openCommand: function() { this._screen = StateDataScreenLauncher.open(); },
	moveCommand: function() { return StateDataScreenLauncher.move(this._screen); },
	getCommandName: function() { return StateDataListScreenSetting.Title; }
});

// 拠点コマンド
var _RestCommand_configureCommands = RestCommand.configureCommands;
RestCommand.configureCommands = function(groupArray) {
	var index = groupArray.length - StateDataListScreenSetting.RestCommandIndex;
	_RestCommand_configureCommands.call(this, groupArray);
	if (StateDataListScreenSetting.RestCommand) {
		groupArray.insertObject(RestCommand.StateDataList, index);
	}
};

RestCommand.StateDataList = defineObject(BaseListCommand, {
	_screen: null,
	openCommand: function() { this._screen = StateDataScreenLauncher.open(); },
	moveCommand: function() { return StateDataScreenLauncher.move(this._screen); },
	getCommandName: function() { return StateDataListScreenSetting.Title; }
});


})();
