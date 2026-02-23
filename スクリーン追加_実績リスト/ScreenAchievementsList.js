/*
■ファイル
ScreenAchievementsList.js

■SRPG Studio対応バージョン:1.319

■プラグインの概要
実績リスト画面を実装します。
ここで実績とは、ゲームプレイ中に特定の条件を満たした場合に付与される称号のようなものを意味します。
オリジナルデータで作成したデータを利用して実績リストの項目を表示します。

■使用方法
1.このファイルをpluginフォルダに入れる
2.オリジナルデータに実績として利用するデータを作成する(※作成手順は後述)

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2022/11/06 新規作成
2022/11/12 リストの列、行の調整について説明を追記
2022/12/11 メンバ変数のスペルミスを修正　×_achievmentsList　〇_achievementsList
2023/04/25 環境パラメータに解放済みdataIdが存在した場合にグローバルパラメータにdataIdが保存されない不具合を修正(周回などで既にクリア済みマップをもう一度クリアした時、その周のセーブデータに格納されなかった)
2026/02/23 コードのリファクタリング

//-----------------------------------------------
// 実績リストの作成手順
//-----------------------------------------------
　　1．オリジナルデータに実績アイテムを登録する
    ※オプションダイアログで、「コンフィグでオリジナルデータを表示する」にチェックをしている場合に表示されます。ユーザー・マニュアル＞データ設定＞オリジナルデータの項目を参照してください。
	 
	 オリジナルデータのタブ1を使用します。(※)
	 (※)変更したい場合は下記コードの値を書き換えます(154行付近)
	 
	 OriginalDataListIndex = 0;
	 代入する数値はタブの数値-1 (左端のタブから0,1,2...)
	 
	 「オリジナルデータの作成」を押下してデータを作成し、名前や説明を記述します(実績リストで表示に使用する)
	 これを必要な実績の分だけ繰り返します。
	 実績リストの並びはオリジナルデータのリストの順番に準じます。

　　1-1.オリジナルデータの項目
　　　　名前： 実績リストで表示する名前で使用します
　　　　説明: 実績リストの下部ウィンドウに表示されます
     アイコン: 実績リストで表示するアイコンとして使用します
	 コンテンツ： 各項目で設定したデータを取得できます(現バージョンでは利用していません)
	 カスタムパラメータ: { lockedText:'文字列' }とすることで未開放状態の実績の説明文を任意に設定できます

　　2．細かな設定
     下記コード内の設定項目を変更することで実績リスト画面の名前などを変更することもできます。
     ゲーム画面からリストの項目が見切れる場合、ScrollbarSetting.ColとScrollbarSetting.Rowの値を調整してください(160行付近)
	 
//-----------------------------------------------
// 実績の解放状態の操作方法
//-----------------------------------------------
  1.実績を解放するイベントで以下のコマンドを設定する
  　　イベントコマンド〈スクリプトの実行〉の「コードの実行」でコード部分に以下を記述します。
	引数の数値は、解放する実績データのidを記述します。
	
	F_AchievementControl.addUnlockedItem(20);
	
  1-1.全ての実績を解放状態に設定する場合
  　　F_AchievementControl._unlockingAll();
  
  2．解放済みの実績を削除したい場合
	F_AchievementControl.cutUnlockedItem(10);
	
  2-1.全ての実績を未開放状態にする
    F_AchievementControl.init();

//-----------------------------------------------
// 環境パラメータの復旧方法
//-----------------------------------------------
  evsファイルの上書きなどで環境パラメータの値が初期化されてしまった場合にセーブデータから解放済みの実績をある程度、復旧させることができます。
  
  1.リストデータ復旧用のイベントを作成し、イベントコマンド〈スクリプトの実行〉に以下を記述する
    
	F_AchievementControl.restoreUnlockedData();

　　※復旧可能なデータはグローバルパラメータに記録されているidのアイテムと紐づいた実績だけです。
　　　別のセーブデータに他の解放済み実績があった場合、各セーブデータをロードして上記のイベントを実行させる必要があります。


//-----------------------------------------------
// 環境パラメータに記録するデータの説明
//-----------------------------------------------
    {object}　env 環境パラメータ root.getExternalData().env

    {object} UnlockedArray　解放済み実績のidを要素に持つ配列

//-----------------------------------------------
// グローバルパラメータに記録するデータの説明
//-----------------------------------------------
	evsファイルの初期化によって環境パラメータが削除された場合にセーブデータから解放済みの実績を可能な限り復帰できるようにする
    
	{object} global グローバルパラメータ root.getMetaSession().global

	{object}　unlockedIdList　解放済み実績idの数値を要素に持つ配列

//-----------------------------------------------
// イベントコマンドで実績リスト画面を呼び出す
//-----------------------------------------------
    実績リスト画面は、エクストラの項目として実装されています。
	その他に下記コード内の設定項目を変更することで「タイトルコマンド」および「拠点コマンド」にコマンドを追加することができます。
	
	イベントコマンド<スクリプトの実行>の「イベントコマンドの呼出し」で
	「オブジェクト名」に　CEC_AchievementsList　と記述することで随時、実績リスト画面を呼び出すこともできます。

//-----------------------------------------------
// オリジナルデータの名前を取得する制御文字
//-----------------------------------------------
    オリジナルデータのデータ名を取得して表示する制御文字を追加しています。
    制御文字の記述
	
	\odn1[0]
    
	変数を取得する制御と同様に\odn 【tab番号(左端が1)】　[データid]

*/

(function() {

//-----------------------------------------------
// 設定項目
//-----------------------------------------------
var AchievementsListSetting = {
	// 実績リスト画面のタイトル文字列。''で囲う
	  Title: '実績リスト'
	
	// タイトル文字表示位置 true:中央に描画, false:左詰め
	, TopTextisCENTER: true
	
	// 未開放の実績のリスト上での表示文字列
	, LockedText: '未開放'
	
	// リソース>リソース使用箇所>画面の内部名の文字列を''で囲う
	, ScreenInteropData: 'Extra'
		
	// 実績リストが空の時に下部ウィンドウに表示される文字列。''で囲う
	, ScreenBottomText: '解放済みの実績を一覧表示します'
	
	// 未開放の実績の下部ウィンドウに表示する文字列。''で囲う
	// 実績アイテムのカスタムパラメータに{ lockedText:'文字列' }を記述している場合は、そちらが優先されます。
	// ヘルプ文字二段.js(作:名前未定(仮)氏)を導入している場合、カスタムパラメータに制御文字\brを書く際は\\brとしてください。
	, LockedItemDescription: '未開放の実績'
	
	// <イベントコマンド呼出し>のオブジェクト名。''で囲う
	, Keyword: 'CEC_AchievementsList'
	
	// 実績リストに使用するオリジナルデータタブ番号（左端から0,1,2...）
	, OriginalDataListIndex: 0
};

// スクロールバーの列(col), 行(row)
// マップの広さ(GameAreaの広さ)に応じて適宜変更してください
// 仮にゲームの画面解像度が1024*768だったとしてもマップが20*15だった場合、スクリーンは640*480の範囲に描画されます(※マップチップ規格32*32)
var ScrollbarSetting = {
	  Col: 2
	, Row: 8
};

// コマンドリストに実績リスト画面を追加するか否か
// コマンドリストに追加する位置は他のプラグインとの競合で必ずしもn番目にならない場合があります
var ConfigureCommandSetting = {
	  // タイトルコマンドに追加する場合 true しない場合 false
	  TitleCommand: false
	  // タイトルコマンドリストの下からn番目に追加する
	, TitleCommandIndex: 1
	
	// 拠点コマンドに追加する場合 true しない場合 false
	, RestCommand: false
	 // 拠点コマンドリストの下からn番目に追加する
	, RestCommandIndex: 5
	
	// エクストラの項目に追加する
	, ExtraCommand: true
};

//------------------------------------------------
// 内部用共通処理（画面呼び出しの重複回避）
//------------------------------------------------
var AchievementSceneLauncher = {
	open: function() {
		var screen = createObject(AchievementsScreen);
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

//------------------------------------------------
// 実績リスト画面
//------------------------------------------------
var AchievementsScreen = defineObject(BaseScreen, {
	_itemWindow: null,
	_achievementsList: null,
	_unlockedIdArray: null,
	_achievementsCountWindow: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		var input = this._itemWindow.moveWindow();
		
		if (input === ScrollbarInput.CANCEL) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawScreenCycle: function() {
		var width = this._itemWindow.getWindowWidth();
		var height = this._itemWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		var xInfo, yInfo;

		this._itemWindow.drawWindow(x, y);
		
		if (this._itemWindow.getItemScrollbar().getObjectCount() === 0) {
			this._drawNoDataText(x, y, width, height);
		}
		
		xInfo = x + width - this._achievementsCountWindow.getWindowWidth();
		yInfo = y - this._achievementsCountWindow.getWindowHeight();
		this._achievementsCountWindow.drawWindow(xInfo, yInfo);
	},
	
	drawScreenTopText: function(textui) {
		var title = this.getScreenTitleName();
		if (AchievementsListSetting.TopTextisCENTER) {
			TextRenderer.drawScreenTopTextCenter(title, textui);
		} else {
			TextRenderer.drawScreenTopText(title, textui);
		}
	},
	
	getScreenTitleName: function() {
		return AchievementsListSetting.Title;
	},
	
	drawScreenBottomText: function(textui) {
		var text = '';
		var item = this._itemWindow.getCurrentItem();
		var index = this._itemWindow.getItemIndex();

		if (item !== null) {
			// 解放済みかどうかを確認
			if (this._achievementsList[index][1]) {
				text = item.getDescription();
			} else {
				text = (typeof item.custom.lockedText !== 'undefined') ? item.custom.lockedText : AchievementsListSetting.LockedItemDescription;
			}
		} else {
			text = AchievementsListSetting.ScreenBottomText;
		}
		
		TextRenderer.drawScreenBottomText(text, textui);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen(AchievementsListSetting.ScreenInteropData);
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._itemWindow = createWindowObject(AchievementsListWindow, this);
		this._achievementsCountWindow = createWindowObject(AchievementsCountWindow, this);
		this._unlockedIdArray = F_AchievementControl.getUnlockedIdArray();
		this._achievementsList = this._checkUnlocked();
	},
	
	_completeScreenMemberData: function(screenParam) {
		var col = Math.max(1, ScrollbarSetting.Col);
		var row = Math.max(1, ScrollbarSetting.Row);
		var scrollbar = this._itemWindow.getItemScrollbar();
		
		this._itemWindow.getItemScrollbar().setScrollFormation(col, row);	
		this._itemWindow.enableSelectCursor(true);
		
		// リストのセットアップ
		var unlockedStatusArray = [];
		scrollbar.resetScrollData();
		for (var i = 0; i < this._achievementsList.length; i++) {
			scrollbar.objectSet(this._achievementsList[i][0]);
			unlockedStatusArray.push(this._achievementsList[i][1]);
		}
		scrollbar.objectSetEnd();
		scrollbar.setAvailableArray(unlockedStatusArray);

		this._achievementsCountWindow.setCount(this._achievementsList.length, this._unlockedIdArray.length);
	},
	
	_checkUnlocked: function() {
		var list = F_AchievementControl._getOriginalDataList();
		var count = list.getCount();
		var unlockedIds = this._unlockedIdArray;
		var arr = [];
		
		// 検索効率化のためにMap代わりのオブジェクトを作成
		var idMap = {};
		for (var j = 0; j < unlockedIds.length; j++) {
			idMap[unlockedIds[j]] = true;
		}

		for (var i = 0; i < count; i++) {
			var data = list.getData(i);
			var isUnlocked = !!idMap[data.getId()];
			arr.push([data, isUnlocked]);
		}
		
		return arr;
	},
	
	_drawNoDataText: function(x, y, width, height) {
		var text = StringTable.Communication_NoData;
		var textui = this._itemWindow.getWindowTextUI();
		var range = createRangeObject(x, y, width, height);
		TextRenderer.drawRangeText(range, TextFormat.CENTER, text, -1, textui.getColor(), textui.getFont());
	},
	
	getExtraDisplayName: function() { return this.getScreenTitleName(); },
	getExtraDescription: function() { return AchievementsListSetting.ScreenBottomText; }
});

// 実績解放数などを表示するウィンドウ
var AchievementsCountWindow = defineObject(BaseWindow, {
	_maxCount: 0,
	_unlockedCount: 0,
	
	setCount: function(max, unlocked) {
		this._maxCount = max;
		this._unlockedCount = unlocked;
	},
	
	drawWindowContent: function(x, y) {
		var textui = this.getWindowTextUI();
		var font = textui.getFont();
		var color = textui.getColor();
		var percentage = this._maxCount > 0 ? Math.ceil((this._unlockedCount / this._maxCount) * 100) : 0;
		var dy = 6;

		NumberRenderer.drawNumber(x + 20, y - dy, this._unlockedCount);
		TextRenderer.drawKeywordText(x + 35, y - dy, '/', -1, color, font);
		NumberRenderer.drawNumber(x + 60, y - dy, this._maxCount);
		
		TextRenderer.drawKeywordText(x + 88, y - dy, '（', -1, ColorValue.INFO, font);
		NumberRenderer.drawNumberColor(x + 120, y - dy, percentage, 1, 255);
		TextRenderer.drawKeywordText(x + 130, y - dy, '％）', -1, ColorValue.INFO, font);
	},
	
	getWindowWidth: function() { return 180; },
	getWindowHeight: function() { return 40; }
});

var AchievementsListWindow = defineObject(ItemListWindow, {
	initialize: function() {
		this._scrollbar = createScrollbarObject(AchievementsListScrollbar, this);
	}
});

var AchievementsListScrollbar = defineObject(ItemListScrollbar, {
	drawScrollContent: function(x, y, item, isSelect, index) {
		var isAvailable = true;
		var textui = this.getParentTextUI();
		
		if (item === null) return;
		
		if (this._availableArray !== null) {
			isAvailable = this._availableArray[index];
		}
		
		if (isAvailable) {
			ItemRenderer.drawItem(x, y, item, textui.getColor(), textui.getFont(), false);
		} else {
			TextRenderer.drawKeywordText(x + 30, y, AchievementsListSetting.LockedText, -1, ColorValue.DISABLE, textui.getFont());
		}
	},
	
	getObjectWidth: function() {
		return ItemRenderer.getItemWidth();
	}
});

//-----------------------------------------
// 各種コマンドへの登録
//-----------------------------------------

// イベントコマンド
var _ScriptExecuteEventCommand__configureOriginalEventCommand = ScriptExecuteEventCommand._configureOriginalEventCommand;
ScriptExecuteEventCommand._configureOriginalEventCommand = function(groupArray) {
	_ScriptExecuteEventCommand__configureOriginalEventCommand.call(this, groupArray);
	groupArray.appendObject(EC_AchievementsScreen);
};

var EC_AchievementsScreen = defineObject(BaseEventCommand, {	
	_achievementsScreen: null,
	enterEventCommandCycle: function() {
		this._achievementsScreen = AchievementSceneLauncher.open();
		return EnterResult.OK;
	},
	moveEventCommandCycle: function() {
		return AchievementSceneLauncher.move(this._achievementsScreen);
	},
	getEventCommandName: function() { return AchievementsListSetting.Keyword; },
	isEventCommandSkipAllowed: function() { return false; }
});

// 拠点コマンド
var _RestCommand_configureCommands = RestCommand.configureCommands;
RestCommand.configureCommands = function(groupArray) {
	var index = groupArray.length - ConfigureCommandSetting.RestCommandIndex;
	_RestCommand_configureCommands.call(this, groupArray);
	if (ConfigureCommandSetting.RestCommand) {
		groupArray.insertObject(RestCommand.AchievementsList, index);
	}
};

RestCommand.AchievementsList = defineObject(BaseListCommand, {
	_screen: null,
	openCommand: function() { this._screen = AchievementSceneLauncher.open(); },
	moveCommand: function() { return AchievementSceneLauncher.move(this._screen); },
	getCommandName: function() { return AchievementsListSetting.Title; }
});

// タイトルコマンド
var _TitleScene__configureTitleItem = TitleScene._configureTitleItem;
TitleScene._configureTitleItem = function(groupArray) {
	var index = groupArray.length - ConfigureCommandSetting.TitleCommandIndex;
	_TitleScene__configureTitleItem.call(this, groupArray);
	if (ConfigureCommandSetting.TitleCommand) {
		groupArray.insertObject(TitleCommand.AchievementsList, index);
	}
};

TitleCommand.AchievementsList = defineObject(BaseTitleCommand, {
	_screen: null,
	openCommand: function() { this._screen = AchievementSceneLauncher.open(); },
	moveCommand: function() { return AchievementSceneLauncher.move(this._screen); },
	getCommandName: function() { return AchievementsListSetting.Title; }
});

// エクストラ画面
var _ExtraScreen__configureExtraScreens = ExtraScreen._configureExtraScreens;
ExtraScreen._configureExtraScreens = function(groupArray) {
	_ExtraScreen__configureExtraScreens.call(this, groupArray);
	groupArray.appendObject(AchievementsScreen);
};

var _ExtraControl_isExtraDisplayable = ExtraControl.isExtraDisplayable;
ExtraControl.isExtraDisplayable = function() {
	return ConfigureCommandSetting.ExtraCommand || _ExtraControl_isExtraDisplayable.call(this);
};

//-----------------------------------------------------
// オリジナルデータのデータ名を取得して表示する制御文字を追加する
// 制御文字の記述 \odn1[0]
// 変数を取得する制御と同様に\odn 【tab番号(左端が1)】　[データid]
//-----------------------------------------------------
var _VariableReplacer__configureVariableObject = VariableReplacer._configureVariableObject;
VariableReplacer._configureVariableObject = function(groupArray) {
	_VariableReplacer__configureVariableObject.call(this, groupArray);
	groupArray.appendObject(DataVariable.OdbName);
};

DataVariable.OdbName = defineObject(BaseDataVariable,
{
	getReplaceValue: function(text) {
		var i, data;
		var page = this.getIndexFromKey(text);
		var id = this.getIdFromKey(text);
		var result = '';
		var list = this.getList(page);
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			data = list.getData(i);
			if (data.getId() === id) {
				result = data.getName();
				break;
			}
		}
		
		return result;
	},
	
	getList: function(page) {
		return root.getBaseData().getOriginalDataList(page - 1);
	},
	
	getIndexFromKey: function(text) {
		var key = /\\odn(\d+)\[\d+\]/;
		var c = text.match(key);
		
		return Number(c[1]);
	},
	
	getKey: function() {
		var key = /\\odn\d+\[(\d+)\]/;
		
		return key;
	}
});


// Polyfill
if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(elt) {
		var len = this.length >>> 0;
		var from = Number(arguments[1]) || 0;
		from = (from < 0) ? Math.ceil(from) : Math.floor(from);
		if (from < 0) from += len;
		for (; from < len; from++) {
			if (from in this && this[from] === elt) return from;
		}
		return -1;
	};
}

})();

//------------------------------------------------
// 外部操作用オブジェクト
//------------------------------------------------
var F_AchievementControl = {
	init: function() {
		root.getExternalData().env.UnlockedArray = [];
	},
	
	_getOriginalDataList: function() {
		return root.getBaseData().getOriginalDataList(0);
	},
	
	getUnlockedIdArray: function() {
		var env = root.getExternalData().env;
		if (Object.prototype.toString.call(env.UnlockedArray) !== '[object Array]') {
			env.UnlockedArray = [];
		}
		return env.UnlockedArray;
	},
	
	getGlobaldata: function() {
		var global = root.getMetaSession().global;
		if (Object.prototype.toString.call(global.unlockedIdList) !== '[object Array]') {
			global.unlockedIdList = [];
		}
		return global.unlockedIdList;
	},
		
	addUnlockedItem: function(dataId) {
		if (typeof dataId !== 'number') return;
		
		var envArr = this.getUnlockedIdArray();
		if (envArr.indexOf(dataId) === -1) {
			envArr.push(dataId);
		}
		
		var globalArr = this.getGlobaldata();
		if (globalArr.indexOf(dataId) === -1) {
			globalArr.push(dataId);
		}
	},

	restoreUnlockedData: function() {
		var envData = this.getUnlockedIdArray();
		var globalData = this.getGlobaldata();
		for (var i = 0; i < globalData.length; i++) {
			if (envData.indexOf(globalData[i]) === -1) {
				envData.push(globalData[i]);
			}
		}		
	},
		
	// 環境パラメータに保存している解放済み実績アイテムの配列から指定したidの要素を削除する
	cutUnlockedItem: function(dataId) {
		var arr = this.getUnlockedIdArray();
		var index = arr.indexOf(dataId);
		
		if (index === -1) {
			root.log('dataId:' + dataId + 'はenv.UnlockedArrayに存在しません');
			return;
		}
		
		arr.splice(index, 1);
		root.log('dataId:' + dataId + 'をenv.UnlockedArrayのindex:' + index + 'から削除');
	},
	
	// 全ての実績を解放状態に設定する
	_unlockingAll: function() {
		var i, data, id, arrEnv, arrGlobal;
		var list = this._getOriginalDataList();
		var count = list.getCount();
		var global = root.getMetaSession().global;
		
		this.init();
		global.unlockedIdList = [];
		
		arrEnv = this.getUnlockedIdArray();
		arrGloval = this.getGlobaldata();
		
		for (i = 0; i < count; i++) {
			data = list.getData(i);
			if (data !== null) {
				id = data.getId();
				arrEnv.push(id);
				arrGloval.push(id);
			}
		}
	}
};