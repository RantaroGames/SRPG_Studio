/*
■ファイル
ScreenAchievementsList.js

■SRPG Studio対応バージョン:1.270

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


//-----------------------------------------------
// 実績リストの作成手順
//-----------------------------------------------
　　1．オリジナルデータに実績アイテムを登録する
    ※オプションダイアログで、「コンフィグでオリジナルデータを表示する」にチェックをしている場合に表示されます。ユーザー・マニュアル＞データ設定＞オリジナルデータの項目を参照してください。
	 
	 オリジナルデータのタブ1を使用します。(※)
	 (※)変更したい場合は下記コードの値を書き換えます(745行付近)
	 
	 変数　OriginalDataListIndex = 0;
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
     ゲーム画面からリストの項目が見切れる場合、ScrollbarSetting.ColとScrollbarSetting.Rowの値を調整してください(154行付近)
	 
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
	  // タイトルコマンドに追加する場合 true　しない場合 false
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

//-----------------------------------------------

//------------------------------------------------
// 実績リスト画面
//------------------------------------------------
var AchievementsScreen = defineObject(BaseScreen,
{
	_itemWindow: null,

	_achievementsList: null,
	_unlockedIdArray: null,
	_achievementsCountWindow: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		return this._moveSelect();
	},
	
	_moveSelect: function() {
		var item;
		var input = this._itemWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			//root.log('(select)');
			// リストのアイテムを選択した時の処理を追加することも可能
			// エクストラシーンでAchievementsScreenを利用している場合、実績解放による褒賞を入手したりだとかの処理はできない
		}
		else if (input === ScrollbarInput.CANCEL) {
			return MoveResult.END;
		}
//		else if (input === ScrollbarInput.NONE) {
//			if (this._itemWindow.isIndexChanged()) {
//	
//			}
//		}
		
		return MoveResult.CONTINUE;
	},
	
	drawScreenCycle: function() {
		var x = LayoutControl.getCenterX(-1, this._itemWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._itemWindow.getWindowHeight());
		var xInfo, yInfo;

		this._itemWindow.drawWindow(x, y);
		
		if (this._itemWindow.getItemScrollbar().getObjectCount() === 0) {
			this._drawNoDataText(x, y, this._itemWindow.getWindowWidth(), this._itemWindow.getWindowHeight());
		}
		
		xInfo = x +  this._itemWindow.getWindowWidth() - this._achievementsCountWindow.getWindowWidth();
		yInfo = y - this._achievementsCountWindow.getWindowHeight();
		this._achievementsCountWindow.drawWindow(xInfo, yInfo);
	},
	
	drawScreenTopText: function(textui) {
		if (AchievementsListSetting.TopTextisCENTER) {
			TextRenderer.drawScreenTopTextCenter(this.getScreenTitleName(), textui);
		} else {
			TextRenderer.drawScreenTopText(this.getScreenTitleName(), textui);
		}
	},
	
	getScreenTitleName: function() {
		return AchievementsListSetting.Title;
	},
	
	drawScreenBottomText: function(textui) {
		var obj = this._itemWindow.getCurrentItem();
		var index = this._itemWindow.getItemIndex();
		var list = this._achievementsList;
		var text = '';

		if (obj !== null) {
			if (list[index][1] === true) {
				text = obj.getDescription();
			}
			else if (typeof obj.custom.lockedText !== 'undefined') {
				text = obj.custom.lockedText;
			}
			else {
				text = AchievementsListSetting.LockedItemDescription;
			}
		}
		else {
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
		
		// 環境パラメータに記録した解放済み実績を記録した配列　[dataId, ...]
		this._unlockedIdArray = F_AchievementControl.getUnlockedIdArray();
		
		// [実績, 解放状態]を要素にもつ二次元配列
		this._achievementsList = this._checkUnlocked();
	},
	
	_completeScreenMemberData: function(screenParam) {
		var col = ScrollbarSetting.Col > 0 ? ScrollbarSetting.Col : 1;
		var row = ScrollbarSetting.Row > 0 ? ScrollbarSetting.Row : 1;
		
		this._itemWindow.getItemScrollbar().setScrollFormation(col, row);	
		this._itemWindow.enableSelectCursor(true);
		
		this._setAchievmentItems();
		this._achievementsCountWindow.setCount(this._achievementsList.length, this._unlockedIdArray.length);
	},
	
	_setAchievmentItems: function() {
		var i;
		var scrollbar = this._itemWindow.getItemScrollbar();
		var arr = this._achievementsList;
		var count = arr.length;
		var unlockedArray = [];

		scrollbar.resetScrollData();
		
		for (i = 0; i < count; i++) {
			// オリジナルデータの実績リストから取得したdataをスクロールバーのobjにセットする
			scrollbar.objectSet(arr[i][0]);
			
			// unlock状態を示すboolean値を配列に格納する
			unlockedArray.push(arr[i][1]);
		}
		
		scrollbar.objectSetEnd();
		
		// 実績の解放状態を配列AchievementsListScrollbar._availableArrayに格納する
		scrollbar.setAvailableArray(unlockedArray);
	},
	
	// オリジナルデータの実績リストからdataを取得してthis._unlockedIdArrayに記録されたidと一致していれば解放済みを設定した配列を返す
	_checkUnlocked: function() {
		var list = F_AchievementControl._getOriginalDataList();
		var count = list.getCount();
		var unlockedarr = this._unlockedIdArray;
		var i, data, isUnlocked;
		var arr = [];

		for (i = 0; i < count; i++) {
			data = list.getData(i);
			isUnlocked = unlockedarr.some(
				function(id) {
					return id === data.getId();
				}
			);

			arr.push([data, isUnlocked]);
		}
		
		return arr;
	},
	
	_drawNoDataText: function(x, y, width, height) {
		var range;
		var text = StringTable.Communication_NoData;
		var textui = this._itemWindow.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		range = createRangeObject(x, y, width, height);
		TextRenderer.drawRangeText(range, TextFormat.CENTER, text, -1, color, font);
	},
	
	getExtraDisplayName: function() {
		return this.getScreenTitleName();
	},
	
	getExtraDescription: function() {
		return AchievementsListSetting.ScreenBottomText;
	}
}
);

// 実績解放数などを表示するウィンドウ
var AchievementsCountWindow = defineObject(BaseWindow,
{
	_maxCount: 0,
	_unlockedCount: 0,
	
	setCount: function(max, unlocked) {
		this._maxCount = max;
		this._unlockedCount = unlocked;
	},
	
	moveWindowContent: function() {
		return MoveResult.END;
	},
	
	drawWindowContent: function(x, y) {
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var count = this._unlockedCount;
		var maxCount = this._maxCount;
		var dy = 6;
		var percentage = Math.ceil((count / maxCount) * 100);

		NumberRenderer.drawNumber(x + 20, y - dy, count);
		TextRenderer.drawKeywordText(x + 35, y - dy, '/', -1, color, font);
		NumberRenderer.drawNumber(x + 60, y - dy, maxCount);
		
		TextRenderer.drawKeywordText(x + 88, y - dy, '（', -1, ColorValue.INFO, font)
		NumberRenderer.drawNumberColor(x + 120, y - dy, percentage, 1, 255);
		TextRenderer.drawKeywordText(x + 130, y - dy, '％）', -1, ColorValue.INFO, font);
	},
	
	getWindowWidth: function() {
		return 180;
	},
	
	getWindowHeight: function() {
		return 40;
	}
}
);

// ItemListWindowをdefineObject関数で継承させる
// 描画処理などを独自のものに置き換えることを想定して新たなオブジェクトを作成している
var AchievementsListWindow = defineObject(ItemListWindow,
{
	initialize: function() {
		this._scrollbar = createScrollbarObject(AchievementsListScrollbar, this);
	}
}
);

// ItemListScrollbarをdefineObject関数で継承させる
var AchievementsListScrollbar = defineObject(ItemListScrollbar,
{
	drawScrollContent: function(x, y, item, isSelect, index) {
		var isAvailable;
		var textui = this.getParentTextUI();
		var font = textui.getFont();
		var color = textui.getColor();
		var isDrawLimit = false;　// 描画をシンプルにするため'--'を表示させないようにしている
		
		if (item === null) {
			return;
		}
		
		// 実績解放済みであればtrue
		if (this._availableArray !== null) {
			isAvailable = this._availableArray[index];
		}
		else {
			isAvailable = true;
		}
		
		if (isAvailable) {
			ItemRenderer.drawItem(x, y, item, color, font, isDrawLimit);
		}
		else {
			TextRenderer.drawKeywordText(x + 30, y, AchievementsListSetting.LockedText, -1, ColorValue.DISABLE, font);
		}
	},
	
	setUnlockedData: function(isAvailable) {
		if (typeof isAvailable !== 'boolean') {
			isAvailable = false;
		}
		this._availableArray.push(isAvailable);
	},
	
	// 1アイテム当たりの表示幅(初期値で220)
	getObjectWidth: function() {
		return ItemRenderer.getItemWidth();
	}
}
);

//-----------------------------------------
// 独自イベントコマンドを登録する
//-----------------------------------------
var alias001 = ScriptExecuteEventCommand._configureOriginalEventCommand;
ScriptExecuteEventCommand._configureOriginalEventCommand = function(groupArray) {
	alias001.call(this, groupArray);
	
	groupArray.appendObject(EC_AchievementsScreen);
};

//-----------------------------------------
// 実績リスト画面を呼び出すイベントコマンド
//-----------------------------------------
var EC_AchievementsScreen = defineObject(BaseEventCommand, 
{	
	_achievementsScreen: null,
	
	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		if (SceneManager.isScreenClosed(this._achievementsScreen)) {
			SceneManager.setForceForeground(false);
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawEventCommandCycle: function() {
	},

	getEventCommandName: function() {
		return AchievementsListSetting.Keyword;
	},

	isEventCommandSkipAllowed: function() {
		// Spaceキーや右クリック押下によるスキップを許可しない
		return false;
	},
	
	_prepareEventCommandMemberData: function() {
		this._achievementsScreen = createObject(AchievementsScreen);
	},
	
	_checkEventCommand: function() {
		return true;
	},
	
	_completeEventCommandMemberData: function() {
		var screenParam;
		
		screenParam = this._createScreenParam();
		SceneManager.addScreen(this._achievementsScreen, screenParam);
		SceneManager.setForceForeground(true);
		
		return EnterResult.OK;
	},

	_createScreenParam: function() {
		var screenParam = {};
		
		return screenParam;
	}
}
);


// 拠点のコマンドリストに実績リスト画面を追加する
var _RestCommand_configureCommands = RestCommand.configureCommands;
RestCommand.configureCommands = function(groupArray) {
	var index = groupArray.length - ConfigureCommandSetting.RestCommandIndex;
	
	_RestCommand_configureCommands.call(this, groupArray);
	
	if (ConfigureCommandSetting.RestCommand === true) {
		groupArray.insertObject(RestCommand.AchievementsList, index);
	}
};

RestCommand.AchievementsList = defineObject(BaseListCommand, 
{
	_achievementsScreen: null,
	
	openCommand: function() {
		var screenParam = this._createScreenParam();
		
		this._achievementsScreen = createObject(AchievementsScreen);
		SceneManager.addScreen(this._achievementsScreen, screenParam);
		SceneManager.setForceForeground(true);
	},
	
	moveCommand: function() {
		if (SceneManager.isScreenClosed(this._achievementsScreen)) {
			SceneManager.setForceForeground(false);
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
		
	},
	
	_createScreenParam: function() {
		var screenParam = {};
		
		return screenParam;
	},

	getCommandName: function() {
		return AchievementsListSetting.Title;
	}
}
);


// タイトルシーンのコマンドリストに実績リスト画面を追加する
var _TitleScene__configureTitleItem = TitleScene._configureTitleItem;
TitleScene._configureTitleItem = function(groupArray) {
	var index = groupArray.length - ConfigureCommandSetting.TitleCommandIndex;
	
	_TitleScene__configureTitleItem.call(this, groupArray);
	
	if (ConfigureCommandSetting.TitleCommand === true) {
		groupArray.insertObject(TitleCommand.AchievementsList, index);
	}
};

TitleCommand.AchievementsList = defineObject(BaseTitleCommand,
{
	_achievementsScreen: null,
	
	openCommand: function() {
		var screenParam = this._createScreenParam();
		
		this._achievementsScreen = createObject(AchievementsScreen);
		SceneManager.addScreen(this._achievementsScreen, screenParam);
		SceneManager.setForceForeground(true);
	},
	
	moveCommand: function() {
		if (SceneManager.isScreenClosed(this._achievementsScreen)) {
			SceneManager.setForceForeground(false);
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
		
	},
	
	_createScreenParam: function() {
		var screenParam = {};
		
		return screenParam;
	},

	getCommandName: function() {
		return AchievementsListSetting.Title;
	}
}
);

// エクストラのコマンドリストに実績リスト画面を追加する
var _ExtraScreen__configureExtraScreens = ExtraScreen._configureExtraScreens;
ExtraScreen._configureExtraScreens = function(groupArray) {
	//var index = groupArray.length;
	
	_ExtraScreen__configureExtraScreens.call(this, groupArray);
	
	//groupArray.insertObject(TitleCommand.AchievementsList, index);
	groupArray.appendObject(AchievementsScreen);
};

// エクストラに実績リストの項目を出現させる
var _ExtraControl_isExtraDisplayable = ExtraControl.isExtraDisplayable;
ExtraControl.isExtraDisplayable = function() {
	var result = _ExtraControl_isExtraDisplayable.call(this);

	if (ConfigureCommandSetting.ExtraCommand) {
		return true;
	}
	
	return result;
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



//-------------------------------------------
// polyfill
//-------------------------------------------
if (!Array.prototype.some)
{
  Array.prototype.some = function(fun /*, thisArg */)
  {
    'use strict';
    if (this === void 0 || this === null)
      throw new TypeError();
    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== 'function')
      throw new TypeError();
    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    for (var i = 0; i < len; i++)
    {
      if (i in t && fun.call(thisArg, t[i], i, t))
        return true;
    }
    return false;
  };
}


})();

//------------------------------------------------
// 外部から呼び出せるように即時関数の外に記述
// 実績リストに表示するデータを設定/取得するためのオブジェクト
//------------------------------------------------
var F_AchievementControl = {
	
	// 環境パラメータに保存した実績リストの配列を空にする
	init: function() {
		var env = root.getExternalData().env;
		env.UnlockedArray = [];
	},
	
	// オリジナルデータから実績リストに使用するリストを取得する
	_getOriginalDataList: function() {
		var OriginalDataListIndex = 0;
		return root.getBaseData().getOriginalDataList(OriginalDataListIndex);
	},
	
	// オリジナルデータのリストからデータをindex順に取得する
	getDateArray: function() {
		var i, data;
		var list = this._getOriginalDataList();
		var count = list.getCount();
		var arr = [];
		
		for (i = 0; i < count; i++) {
			data = list.getData(i);
			if (data !== null) {
				arr.push(data);
			}
		}
		
		return arr;		
	},
	
	// 環境パラメータに保存している解放済み実績の配列(要素はオリジナルデータのid)を取得する
	getUnlockedIdArray: function() {
		var env = root.getExternalData().env;
				
		if (Object.prototype.toString.call(env.UnlockedArray) !== '[object Array]') {
			env.UnlockedArray = [];
		}
		return env.UnlockedArray;
	},
	
	// 環境パラメータに保存している解放済み実績のidを配列を記録する
	addUnlockedItem: function(dataId) {
		var arr;

		if (typeof dataId !== 'number') {
			root.msg('dataIdがnumber型ではありません。処理を中断します');
			return;
		}
		
		arr = this.getUnlockedIdArray();
		
		// dataIdが環境パラメータに未登録であれば記録する
		if (arr.indexOf(dataId) === -1) {
			arr.push(dataId);
			root.log('dataId:' + dataId + 'をenv.UnlockedArrayに挿入');
			
			// グローバルパラメータにも解放した実績のitemIdを記録しておく
			this.setGlobaldata(dataId);
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
		
	// グローバルパラメータに保存している解放済み実績の配列を取得する
	getGlobaldata: function() {
		var global = root.getMetaSession().global;
		
		if (Object.prototype.toString.call(global.unlockedIdList) !== '[object Array]') {
			global.unlockedIdList = [];
		}
		
		return global.unlockedIdList;
	},
	
	// グローバルパラメータに解放済み実績の配列を記録する
	setGlobaldata: function(dataId) {
		this.getGlobaldata().push(dataId);
	},
	
	// グローバルパラメータに保存している解放済み実績から環境パラメータの実績状況を更新する
	// evsファイルの初期化によって環境パラメータが削除された場合にセーブデータから解放済みの実績を可能な限り復帰できるようにする
	restoreUnlockedData: function() {
		var envData = this.getUnlockedIdArray();
		var globalData = this.getGlobaldata();
		var count = globalData.length;
		var i, dataId;
		
		for (i = 0; i < count; i++) {
			dataId = globalData[i];
			if (envData.indexOf(dataId) === -1) {
				envData.push(dataId);
				root.log('dataId:' + dataId + 'をglobalDataからenvDataにコピー');
			}
		}		
	},
	
	// 全ての実績を解放状態に設定する
	_unlockingAll: function() {
		var i, data, id, arr;
		var list = this._getOriginalDataList();
		var count = list.getCount();
		var global = root.getMetaSession().global;
		
		this.init();
		global.unlockedIdList = [];
		
		arr = this.getUnlockedIdArray();
		
		for (i = 0; i < count; i++) {
			data = list.getData(i);
			if (data !== null) {
				id = data.getId();
				arr.push(id);
				this.setGlobaldata(id);
			}
		}
	}
	
};
