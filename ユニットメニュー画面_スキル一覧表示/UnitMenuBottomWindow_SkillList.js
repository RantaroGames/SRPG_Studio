/*
■ファイル
UnitMenuBottomWindow_SkillList.js

■SRPG Studio対応バージョン:1.267

■プラグインの概要
ユニットメニューの下部ウィンドウにスキル一覧をスクロールバー形式で表示するページを追加します。

■使用方法
1.このファイルをpluginフォルダに入れる

※カスタマイズしたい場合は以下のコード内で設定項目と書かれた部分を適宜変更してください。

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2022/09/25 新規作成

*/

(function() {

//--------------------------------------------------------
// 設定項目
//--------------------------------------------------------

// スクロールバーに表示するスキルの行数
var SkillScrollbar_RowCount = 7;

// スキル一覧のタイトル文字列
var SkillListTitle = 'スキル一覧'

// スクロールバーで表示するスキル名の長さ
var SkillNameSize = 108;

// スキル一覧でスキル説明文に割り当てられる表示幅を制限するか
// true : (ウィンドウ幅　- スキル名の表示幅 - アイコン幅)の範囲で表示。 (文字数が多すぎると何も表示されなくなる。フォントにもよるが全角30字程度が限界)
// false: 全文表示。文字数が多いとウィンドウを突き抜ける
var SkillDescriptionLength = true;

// ヘルプ文字二段.js(作：名前未定(仮)氏)を導入している場合、trueにすると制御文字として使用している\brを除去し、半角空白を挟んで文字列を連結する
var ConcatenateStrings = false;

// スキル情報ウィンドウの表示が不要な場合は、false
var isDrawSkillInfoWindow = true;

//--------------------------------------------------------
// ユニットメニューに新しいページを追加する
//--------------------------------------------------------
var _UnitMenuScreen__configureBottomWindows = UnitMenuScreen._configureBottomWindows;
UnitMenuScreen._configureBottomWindows = function(groupArray) {
	_UnitMenuScreen__configureBottomWindows.call(this, groupArray);
	
	groupArray.appendWindowObject(UnitMenuBottomWindow_SkillList, this);
};

//--------------------------------------------------------
// ユニットメニューにスキル一覧を表示するためのオブジェクト
//--------------------------------------------------------
var UnitMenuBottomWindow_SkillList = defineObject(BaseMenuBottomWindow,
{
	_unit: null,
	_weapon: null,
	
	_isTracingLocked: false,
	_skillInteraction: null,
	_skillCount: 0,
	
	setUnitMenuData: function() {
		this._skillInteraction = createObject(SkillInteractionCustom);
	},
	
	changeUnitMenuTarget: function(unit) {
		this._unit = unit;
		this._weapon = null;

		if (unit !== null) {
			this._weapon = ItemControl.getEquippedWeapon(unit);
			this._setSkillData(unit);
			this._skillInteraction.checkInitialTopic();
		}
	},
	
	moveWindowContent: function() {
		this._skillInteraction.moveInteraction();
		
		if (!this.isHelpMode()) {
			return MoveResult.CONTINUE;
		}
	
		return MoveResult.CONTINUE;
	},
	
	isHelpMode: function() {
		return this._skillInteraction.isHelpMode();
	},
	
	isTracingHelp: function() {
		return this._skillInteraction.isTracingHelp();
	},
	
	setHelpMode: function() {
		if (this._skillInteraction.setHelpMode()) {
			return true;
		}
		
		return false;
	},
	
	getHelpText: function() {
		var text = '';
		var help = this._getActiveUnitMenuHelp();
		
		if (help === 0) {
			text = this._skillInteraction.getHelpText();
		}
		
		return text;
	},
	
	// スキル情報ウィンドウの描画処理
	_drawInfoWindow: function(xBase, yBase) {
		var x, help;
		
		if (this._isTracingLocked) {
			return;
		}
		
		help = this._getActiveUnitMenuHelp();
		
		if (help === 0) {
			// スキル情報ウィンドウの横幅(基本値は210)
			var windowWidth = this._skillInteraction.getInteractionWindow().getWindowWidth();
			
			// xBase(=UnitMenuTopWindow　₊ UnitSentenceWindowの横幅を画面の中央に配置した時のｘ座標) + ItemRenderer.getItemWidth()=基本値は220
			x = xBase + ItemRenderer.getItemWidth();
			
 			if (x + windowWidth > root.getGameAreaWidth()) {
				x -= x + windowWidth - root.getGameAreaWidth() + 8;
			}
			
			this._skillInteraction.getInteractionWindow().drawWindow(x, yBase);
		}
	},
		
	_getActiveUnitMenuHelp: function() {
		var help = -1;
		
		if (this._skillInteraction.isTracingHelp() || this._skillInteraction.isHelpMode()) {
			help = 0;
		}
		
		return help;
	},
	
	// 所持スキルをスクロールバー形式で一覧表示する描画処理
	drawWindowContent: function(x, y) {
		var dy = 0;
		
		// スキル一覧ページのタイトル表示
		this._drawSkillListTitle(x, y);
		dy = 30;
		
		// スキルデータをスクロールバーで表示する
		this._drawSkillArea(x, y + dy);
		
		// スキル情報ウィンドウを表示する
		if (isDrawSkillInfoWindow) {
			this._drawInfoWindow(x, y);
		}
	},
	
	_drawSkillListTitle: function(x, y) {
		var textui = root.queryTextUI('default_window');
		var font = textui.getFont();
		var color = ColorValue.KEYWORD;
		var index = this._skillInteraction.getInteractionScrollbar().getIndex();
		var dx = 0;
		var dy = 0;
		
		// タイトル表示
		TextRenderer.drawKeywordText(x + dx, y + dy, SkillListTitle, -1, color, font);
		
		// 所持スキル数
		dx = 100;
		TextRenderer.drawKeywordText(x + dx, y + dy, 'COUNT:', -1, color, font);
		dx += 60; dy = -2;
		NumberRenderer.drawNumberColor(x + dx, y + dy, index + 1, 0, 255);
		dx += 12; dy = 0;
		TextRenderer.drawKeywordText(x + dx, y + dy, '/', -1, color, font);
		dx += 20; dy = -2;
		NumberRenderer.drawNumberColor(x + dx, y + dy, this._skillCount, 0, 255);
		
		// スクロールバーに遷移する方法の説明文
		dx += 40; dy = 0;
		TextRenderer.drawKeywordText(x + dx, y + dy, '決定キーでスクロールバーON', -1, ColorValue.DISABLE, font);
	},
	
	// 所持スキルを取得してスクロールバーにデータを渡す処理
	_setSkillData: function(unit) {
		var i;
		var arr = SkillControl.getSkillMixArray(unit, this._weapon, -1, '');
		var count = arr.length;
		var newSkillArray = [];
		
		for (i = 0; i < count; i++) {
			if (!arr[i].skill.isHidden()) {
				newSkillArray.push(arr[i]);
			}
		}
		
		this._skillInteraction.setSkillArray(newSkillArray);
		
		// 所持スキル数を表示したいので変数に格納しておく
		this._skillCount = newSkillArray.length;
	},

	// スキルをスクロールバー形式で表示する
	_drawSkillArea: function(xBase, yBase) {
		this._skillInteraction.getInteractionScrollbar().drawScrollbar(xBase, yBase);
	}
}
);

//-------------------------------------------------------- 
// スキル一覧表示用のスクロールバーに必要なデータを設定したり
// スクロールバーで表示中のオブジェクトに合わせてヘルプ表示を切り替えたりしている（……と思われる）
//--------------------------------------------------------
var SkillInteractionCustom = defineObject(SkillInteraction,
{
	initialize: function() {
		this._scrollbar = createScrollbarObject(IconSkillScrollbarCustom, this);
		// スクロールバーを1列x行で設定する
		this._scrollbar.setScrollFormation(1, SkillScrollbar_RowCount);
		this._window = createWindowObject(SkillInfoWindow, this);
	}
}
);

//-------------------------------------------------------- 
// スキル一覧を表示するスクロールバー
//--------------------------------------------------------
var IconSkillScrollbarCustom = defineObject(BaseScrollbar,
{
	
	initialize: function() {
	},
	
	drawScrollContent: function(x, y, object, isSelect, index) {
		var skill = object.skill
		var handle = skill.getIconResourceHandle();
		var skillName = skill.getName();
		var skillText = skill.getDescription();
		
		// ヘルプ文字二段.js(作：名前未定(仮)氏)を使用している場合
		// 制御文字として使用している\brを除去し、半角空白を挟んで文字列を連結する
		if (ConcatenateStrings) {
			var text1 = TextRenderer.splitText1(skillText);
			var text2 = TextRenderer.splitText2(skillText);
			skillText = (text2 !== null) ? text1 + ' ' + text2 : text1;
		}
		
		// スキル説明文の表示範囲を限定するか
		var textsize = SkillDescriptionLength　? this.getObjectWidth() - SkillNameSize - GraphicsFormat.ICON_WIDTH : -1;
		//root.log(textsize);
		
		// 文字色を設定する。カラーコードで指定しても良い(ColorValue.DEFAULTは 0xffffff)
		var color = ColorValue.DEFAULT;
		
		var textui = root.queryTextUI('default_window');
		var font = textui.getFont();
		
		var dx = 0;

		// スキルアイコン表示
		GraphicsRenderer.drawImage(x, y, handle, GraphicsType.ICON);
		
		// スキル名表示
		dx = 28;
		TextRenderer.drawKeywordText(x + dx, y, skillName, SkillNameSize, color, font);
		
		// スキル説明の表示
		dx = SkillNameSize + 16;
		TextRenderer.drawKeywordText(x + dx, y, skillText, textsize, color, font);
		
	},
	
	drawDescriptionLine: function(x, y) {
	},
	
	playSelectSound: function() {
	},
	
	getObjectWidth: function() {
		return UnitMenuBottomWindow.getWindowWidth();
	},
	
	getObjectHeight: function() {
		return GraphicsFormat.ICON_HEIGHT;
	}
}
);


})();
