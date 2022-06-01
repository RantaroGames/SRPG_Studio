/*
■ファイル名
itemInfoWindow_drawStateInfo.js

■SRPG Studio対応バージョン
ver.1.255

■プラグインの概要
ステートを付与する武器、アイテム、スキル(*1)のアイテム情報ウィンドウに付与ステートの情報を別ウィンドウで表示します。
設定を変更することで、左シフトキー(※2)を押している間、ステート情報ウィンドウが表示する形式にできます。

*1 表示可能なステートは、武器およびステート付与アイテムのデータで設定したステート、
スキルの場合はエディタのステート攻撃で設定したステートに限られます。

また複数ステートを付与できるような場合でも表示可能なステート情報は１つだけです。

※2 game.iniファイルで[Keyboard] OPTION2=shiftに設定しているキーに対応しています。
ユーザーがgame.iniの設定を変更していた場合、対応するキーも変化します。

■使用方法
1.本プラグインをPluginフォルダに入れる

※ステート情報を左シフトキーを押している間のみ表示する仕様にしたい場合は下記コード内(58行目付近)で
ITEM_SubWindowDrawType = false;
のように書き換えてください。(true:常時表示、false:左シフトキー押下中のみ)

同様にスキル情報ウィンドウでステート情報の表示方法を変更する場合は
SKILL_SubWindowDrawType = false;
真偽値を変更してください。

・オプション1
o-to氏のプラグインでステータスにEPまたはFPを導入している場合にステート情報に回復値を表示したい場合
下記コード内の該当する設定項目をtrueに変更してください。

なおステータス補正値に関してはEP/FPプラグインを導入するだけで規定で表示されます。

・オプション2
ステートを付与するカスタムスキルを導入するプラグインを使用している場合、
該当スキルに以下のカスタムパラメータを記述することでステート情報を表示可能になります。

{ 
  SkillInfo_stateid: スキルId(number)
}


■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2022/03/10 新規作成
2022/03/12　ショップ(ShopLayoutScreen)ではステート情報を表示しない仕様にした
2022/03/16 左Shiftキーを押している場合にステート情報ウィンドウを表示する仕様を導入(武器とアイテムの場合。スキルでは常時表示)
2022/03/17 スキルウィンドウでも左シフトキーでステート情報の表示を切り替えできるようにした
2022/03/20 ストック交換では、サブウィンドウを表示しない仕様にした

*/

(function() {

// アイテム、武器情報で ステートウィンドウを常時表示する:true / 左Shiftキーを押している場合に表示:false
var ITEM_SubWindowDrawType = true;

// スキル情報で ステートウィンドウを常時表示する:true / 左Shiftキーを押している場合に表示:false
var SKILL_SubWindowDrawType = true;

// サブウィンドウを表示する際に押し続けるキーのアナウンス文
var KEY_NEME = 'Hold Shift';

//---------------------------------------------------
// o-to氏のプラグインでステータスにEPまたはFPを導入している場合に
// ステート情報にターン開始時の回復値を表示するか否か
// true:表示する/ false:表示しない
//---------------------------------------------------
// EPの回復値を表示するか
var OT_EP_PlugIn = false;

// FPの回復値を表示するか
var OT_FP_PlugIn = false;


//---------------------------------------------
// スキル情報ウィンドウにステート情報表示
// 本スクリプトでは、武器およびステート付与アイテムのみ対応
//---------------------------------------------

// subWindow(ステート情報を表示するウィンドウ)用のメンバ変数
ItemInfoWindow._state = null;// @ {object} 表示するステートオブジェクト
ItemInfoWindow._subGroupArray = null; // @ {Array} ステート情報の項目
ItemInfoWindow._subWindowHeight = 0; // @ {number} subWindowの高さ
ItemInfoWindow._isSubWidowEnabled = false; // @ {boolean} subWindowの画像表示判定
ItemInfoWindow._isSubWidowDisalbed = false; // @ {boolean} subWindowの表示を許可するか否か

// subWindowに表示するステート情報を設定する
var _ItemInfoWindow_setInfoItem = ItemInfoWindow.setInfoItem;
ItemInfoWindow.setInfoItem = function(item) {
	var i, count;
	var partsCount = 0;
	
	_ItemInfoWindow_setInfoItem.call(this, item);
	
	this._state = null;
	this._isSubWidowEnabled = false; 
	this._subGroupArray = [];
	this._subWindowHeight = 0;
		
	// subWindowを表示しない場面(ShopLayoutScreenなど)では、この時点で処理を終了する
	// ショップ画面でsubWindowを表示しようとすると既存のウィンドウと被ってしまうので表示をオフにしている
	if (this._isSubWidowDisalbed === true) return;
	
	if (typeof this._item === 'undefined') {
		this._item = null;
	}
	if (this._item === null) {
		return;
	}
	
	if (this._item.isWeapon()) {
		this._state = this._item.getStateInvocation().getState();
	}
	else {
		if (this._item.getItemType() === ItemType.STATE) {
			this._state = this._item.getStateInfo().getStateInvocation().getState();
		}
	}
	
	if (this._state === null) return;
	
	this._configureStateInfo(this._subGroupArray);
	count = this._subGroupArray.length;
	
	for (i = 0; i < count; i++) {
		this._subGroupArray[i].setParentWindow(this);
		partsCount += this._subGroupArray[i].getItemSentenceCount(this._state);
	}
	
	this._subWindowHeight = (partsCount + 1) * ItemInfoRenderer.getSpaceY();
	this._isSubWidowEnabled = true;
};

ItemInfoWindow._getSubWindowWidth = function() {
	return ItemRenderer.getItemWindowWidth();
};

// subWindowの描画(本来のウィンドウ描画に処理を付随させる)
// ウィンドウが見切れた場合は位置を補正する
var _ItemInfoWindow_drawWindow = ItemInfoWindow.drawWindow;
ItemInfoWindow.drawWindow = function(x, y) {
	var obj;
	
	if (ITEM_SubWindowDrawType) {
		obj = this._adjustWindow(x, y, true);
		x = obj.x;
		y = obj.y;
		
		_ItemInfoWindow_drawWindow.call(this, x, y);
		
		this._drawSubWindow(x, y);
	}	
	else if (root.isInputState(InputType.BTN4)) {
		obj = this._adjustWindow(x, y, true);
		x = obj.x;
		y = obj.y;
		
		_ItemInfoWindow_drawWindow.call(this, x, y);
		
		this._drawSubWindow(x, y);
	}
	else {
		obj = this._adjustWindow(x, y, false);
		x = obj.x;
		y = obj.y;
		
		_ItemInfoWindow_drawWindow.call(this, x, y);
	}
};

ItemInfoWindow._adjustWindow = function(x, y, isSubwindow) {
	var w, h;
	var obj = {
			x: x,
			y: y
		};
	
	if (isSubwindow) {
		w = this._isSubWidowEnabled ? this.getWindowWidth() + this._getSubWindowWidth() : this.getWindowWidth();
		h = this.getWindowHeight() > this._subWindowHeight ? this.getWindowHeight() : this._subWindowHeight;
	}
	else {
		w = this.getWindowWidth();
		h = this.getWindowHeight();
	}
	
	if (x + w > root.getGameAreaWidth()) {
		obj.x -= x + w - root.getGameAreaWidth();
		obj.x -= 8;
	}
	
	if (y + h > root.getGameAreaHeight()) {
		obj.y -= y + h - root.getGameAreaHeight();
		obj.y -= 8;
	}
	
	return obj;
};

ItemInfoWindow._drawSubWindow = function(x, y) {
	var width = this.getWindowWidth();
	var height = this._subWindowHeight;
	var subWidth = this._getSubWindowWidth();
	
	if (!this._isWindowEnabled || !this._isSubWidowEnabled) {
		return;
	}
	
	x += width;
	this._drawWindowInternal(x, y, subWidth, height);
	
	if (this._drawParentData !== null) {
		this._drawParentData(x, y);
	}
	
	// move系メソッドにて、座標をマウスで参照できるようにする
	this.xRendering = x + this.getWindowXPadding();
	this.yRendering = y + this.getWindowYPadding();
	
	this.drawWindowSubContent(x + this.getWindowXPadding(), y + this.getWindowYPadding());
	
	this.drawWindowTitle(x, y, width, height);
};

// subWindowの中身を描画する
ItemInfoWindow.drawWindowSubContent = function(x, y) {
	var i, count;
	
	if (this._item === null) {
		return;
	}
	
	count = this._subGroupArray.length;
	for (i = 0; i < count; i++) {
		this._subGroupArray[i].drawItemSentence(x, y, this._state);
		y += this._subGroupArray[i].getItemSentenceCount(this._state) * ItemInfoRenderer.getSpaceY();
	}
};

// 左シフト長押しのアナウンス
var _AdditionState_drawItemSentence = ItemSentence.AdditionState.drawItemSentence;
ItemSentence.AdditionState.drawItemSentence = function(x, y, item) {
	if (!this._isState(item)) {
		return;
	}
	
	if (!ITEM_SubWindowDrawType && this._itemInfoWindow._isSubWidowEnabled) {
		TextRenderer.drawSignText(x, y + 12, KEY_NEME);
	}
	
	_AdditionState_drawItemSentence.call(this, x, y, item);
};


// ステート情報と描画処理を取得
ItemInfoWindow._configureStateInfo = function(groupArray) {
	groupArray.appendObject(ItemSentenceStateInfo.Name);
	groupArray.appendObject(ItemSentenceStateInfo.Turn_RecoveryValue);
	groupArray.appendObject(ItemSentenceStateInfo.Seal);
	groupArray.appendObject(ItemSentenceStateInfo.Option);
	groupArray.appendObject(ItemSentenceStateInfo.AutoRemoval);
	groupArray.appendObject(ItemSentenceStateInfo.Skill);

	if (OT_EP_PlugIn) {
		groupArray.appendObject(ItemSentenceStateInfo.EPRecoveryValue);
	}
	if (OT_FP_PlugIn) {
		groupArray.appendObject(ItemSentenceStateInfo.FPRecoveryValue);
	}
	
	groupArray.appendObject(ItemSentenceStateInfo.DopingParameter);
	groupArray.appendObject(ItemSentenceStateInfo.TurnChangeValue);
};


//--------------------------------------------
// スキル情報ウィンドウにステート情報表示
// 本スクリプトでは、エディタの「ステート攻撃」スキルのみ対応
//
// ステートを付与するカスタムスキルのプラグインを導入している場合、
// 該当スキルに以下のカスタムパラメータを記述することでステート情報を表示可能
// 　SkillInfo_stateid:スキルId(数値)
//--------------------------------------------

SkillInfoWindow._state = null;
SkillInfoWindow._subGroupArray = null;
SkillInfoWindow._subWindowHeight = 0;
SkillInfoWindow._isSubWidowEnabled = false;

var _SkillInfoWindow_setSkillInfoData = SkillInfoWindow.setSkillInfoData;
SkillInfoWindow.setSkillInfoData = function(skill, objecttype) {
	var i, count, skilltype, id, list;
	var partsCount = 0;
	
	this._state = null;
	this._isSubWidowEnabled = false; 
	this._subGroupArray = [];
	this._subWindowHeight = 0;
	
	_SkillInfoWindow_setSkillInfoData.call(this, skill, objecttype);
	
	if (this._skill === null) {
		this._isSubWidowEnabled = false; 
		return;
	}
	
	list = root.getBaseData().getStateList();
	skilltype = this._skill.getSkillType();
	
	if (skilltype === SkillType.STATEATTACK) {
		id = skill.getSkillValue();
		this._state = list.getDataFromId(id);
	}
	else if (typeof this._skill.custom.SkillInfo_stateid === 'number') {
		id = this._skill.custom.SkillInfo_stateid;
		this._state = list.getDataFromId(id);	
	}

	if (this._state === null) return;
	
	this._configureStateInfo(this._subGroupArray);
	
	count = this._subGroupArray.length;
	for (i = 0; i < count; i++) {
		this._subGroupArray[i].setParentWindow(this);
		partsCount += this._subGroupArray[i].getItemSentenceCount(this._state);
	}
	
	this._subWindowHeight = (partsCount + 1) * ItemInfoRenderer.getSpaceY();
	this._isSubWidowEnabled = true;
};

SkillInfoWindow._getSubWindowWidth = function() {
	return ItemRenderer.getItemWindowWidth();
};

// subWindowの描画(本来のウィンドウ描画に処理を付随させる)
// ウィンドウが見切れた場合は位置を補正する
var _SkillInfoWindow_drawWindow = SkillInfoWindow.drawWindow;
SkillInfoWindow.drawWindow = function(x, y) {
	var obj;
	
	if (SKILL_SubWindowDrawType) {
		obj = this._adjustWindow(x, y, true);
		x = obj.x;
		y = obj.y;
		
		_SkillInfoWindow_drawWindow.call(this, x, y);
		
		this._drawSubWindow(x, y);
	}	
	else if (root.isInputState(InputType.BTN4)) {
		obj = this._adjustWindow(x, y, true);
		x = obj.x;
		y = obj.y;
		
		_SkillInfoWindow_drawWindow.call(this, x, y);
		
		this._drawSubWindow(x, y);
	}
	else {
		obj = this._adjustWindow(x, y, false);
		x = obj.x;
		y = obj.y;
		
		_SkillInfoWindow_drawWindow.call(this, x, y);
	}
};

SkillInfoWindow._adjustWindow = function(x, y, isSubwindow) {
	var w, h;
	var obj = {
			x: x,
			y: y
		};
	
	if (isSubwindow) {
		w = this._isSubWidowEnabled ? this.getWindowWidth() + this._getSubWindowWidth() : this.getWindowWidth();
		h = this.getWindowHeight() > this._subWindowHeight ? this.getWindowHeight() : this._subWindowHeight;
	}
	else {
		w = this.getWindowWidth();
		h = this.getWindowHeight();
	}
	
	if (x + w > root.getGameAreaWidth()) {
		obj.x -= x + w - root.getGameAreaWidth();
		obj.x -= 8;
	}
	
	if (y + h > root.getGameAreaHeight()) {
		obj.y -= y + h - root.getGameAreaHeight();
		obj.y -= 8;
	}
	
	return obj;
};

SkillInfoWindow._drawSubWindow = function(x, y) {
	var width = this.getWindowWidth();
	var height = this._subWindowHeight;
	var subWidth = this._getSubWindowWidth();
	
	if (!this._isWindowEnabled || !this._isSubWidowEnabled) {
		return;
	}
	
	x += width;
	this._drawWindowInternal(x, y, subWidth, height);
	
	if (this._drawParentData !== null) {
		this._drawParentData(x, y);
	}
	
	// move系メソッドにて、座標をマウスで参照できるようにする
	this.xRendering = x + this.getWindowXPadding();
	this.yRendering = y + this.getWindowYPadding();
	
	this.drawWindowSubContent(x + this.getWindowXPadding(), y + this.getWindowYPadding());
	
	this.drawWindowTitle(x, y, subWidth, height);
};

SkillInfoWindow.drawWindowSubContent = function(x, y) {
	var i, count;
	
	if (this._item === null) {
		return;
	}
	
	count = this._subGroupArray.length;
	for (i = 0; i < count; i++) {
		this._subGroupArray[i].drawItemSentence(x, y, this._state);
		y += this._subGroupArray[i].getItemSentenceCount(this._state) * ItemInfoRenderer.getSpaceY();
	}
};

SkillInfoWindow._configureStateInfo = function(groupArray) {
	groupArray.appendObject(ItemSentenceStateInfo.Name);
	groupArray.appendObject(ItemSentenceStateInfo.Turn_RecoveryValue);
	groupArray.appendObject(ItemSentenceStateInfo.Seal);
	groupArray.appendObject(ItemSentenceStateInfo.Option);
	groupArray.appendObject(ItemSentenceStateInfo.AutoRemoval);
	groupArray.appendObject(ItemSentenceStateInfo.Skill);
	
	if (OT_EP_PlugIn) {
		groupArray.appendObject(ItemSentenceStateInfo.EPRecoveryValue);
	}
	if (OT_FP_PlugIn) {
		groupArray.appendObject(ItemSentenceStateInfo.FPRecoveryValue);
	}
	
	groupArray.appendObject(ItemSentenceStateInfo.DopingParameter);
	groupArray.appendObject(ItemSentenceStateInfo.TurnChangeValue);
};


//-------------------------------------------------------
// ItemInfoRendererオブジェクト
//-------------------------------------------------------

// ItemInfoRenderer.drawKeywordのcolorをdefault値にしたメソッド
ItemInfoRenderer.drawDefault　= function(x, y, text) {
	var textui = this.getTextUI();
	var color = ColorValue.DEFAULT;
	var font = textui.getFont();
	
	TextRenderer.drawKeywordText(x, y, text, -1, color, font);
};

// 能力値補正を2列で表示
ItemInfoRenderer._drawDopingState = function(x, y, arr) {
	var i, n, text;
	var count = arr.length;
	var count2 = 0;
	var xBase = x;
	var textui = this.getTextUI();
	var color = textui.getColor();
	var font = textui.getFont();
	
	for (i = 0; i < count; i++) {
		count2++;
		
		n = arr[i][1];
		text = arr[i][0];

		TextRenderer.drawKeywordText(x, y, text, -1, color, font);
		x += 38;
		
		TextRenderer.drawSignText(x, y, n > 0 ? ' + ': ' - ');
		x += DefineControl.getNumberSpace();
		
		if (n < 0) {
			n *= -1;
		}
		NumberRenderer.drawRightNumber(x, y, n);
		
		if (count2 % 2 === 0) {
			x = xBase;
			y += this.getSpaceY();
		}
		else {
			x += 30;
		}
	}

	return count2;
};

//-----------------------------------------
// ShopLayoutScreendではサブウィンドウを表示しない
//-----------------------------------------
var _ShopLayoutScreen__prepareScreenMemberData = ShopLayoutScreen._prepareScreenMemberData;
ShopLayoutScreen._prepareScreenMemberData = function(screenParam) {
	_ShopLayoutScreen__prepareScreenMemberData.call(this, screenParam);
	
	this._itemInfoWindow._isSubWidowDisalbed = true;
};

//---------------------------------------------------------------
// _stockItemWindowの下に描画されるためサブウィンドウ表示を不許可にしている
//---------------------------------------------------------------
var _StockItemTradeScreen__prepareScreenMemberData = StockItemTradeScreen._prepareScreenMemberData;
StockItemTradeScreen._prepareScreenMemberData = function(screenParam) {
	_StockItemTradeScreen__prepareScreenMemberData.call(this, screenParam);
	
	this._itemInfoWindow._isSubWidowDisalbed = true;
};

//-----------------------------------------------------------------
// ItemSentenceStateInfoオブジェクト ItemSentenceオブジェクトを流用
// o-to氏のEP/FPプラグインを導入している場合はEP/FPの補正値、回復値も表示可能
//-----------------------------------------------------------------
var ItemSentenceStateInfo = {};

ItemSentenceStateInfo.Name = defineObject(BaseItemSentence,
{
	drawItemSentence: function(x, y, state) {
		var text;
		
		text = (state.isBadState() === true) ? '状態異常' : '状態';
		ItemInfoRenderer.drawKeyword(x, y, text);
		x += ItemInfoRenderer.getSpaceX();

		text = state.getName();
		ItemInfoRenderer.drawDefault(x, y, text);
	},
	
	getItemSentenceCount: function(state) {
		return 1;
	}
}
);

ItemSentenceStateInfo.Turn_RecoveryValue = defineObject(BaseItemSentence,
{
	drawItemSentence: function(x, y, state) {
		var text, recoveryValue;
		var turn = state.getTurn();
		
		text = 'ターン';
		ItemInfoRenderer.drawKeyword(x, y, text);
		x += ItemInfoRenderer.getSpaceX();
		
		if (turn !== 0) {
			NumberRenderer.drawRightNumber(x, y, turn);
		}
		else {
			TextRenderer.drawSignText(x, y, StringTable.SignWord_Limitless);
		}
		
		x += 42;
		
		recoveryValue = state.getAutoRecoveryValue();
		if (recoveryValue > 0) {
			text = '回復';
			ItemInfoRenderer.drawKeyword(x, y, text);
			x += ItemInfoRenderer.getSpaceX();
			NumberRenderer.drawRightNumber(x, y, recoveryValue);
		}
		else if (recoveryValue < 0) {
			text = 'DMG';
			ItemInfoRenderer.drawKeyword(x, y, text);
			x += ItemInfoRenderer.getSpaceX();
			NumberRenderer.drawRightNumber(x, y, (recoveryValue * -1));
		}
	},
	
	getItemSentenceCount: function(state) {
		return 1;
	}
}
);

ItemSentenceStateInfo.Seal = defineObject(BaseItemSentence,
{
	drawItemSentence: function(x, y, state) {
		var text;
		var space = ' ';
		var badStateFlag = state.getBadStateFlag();
		
		if (badStateFlag === 0) {
			return;
		}

		text = '封印';
		ItemInfoRenderer.drawKeyword(x, y, text);

		text = '';
		if (badStateFlag & BadStateFlag.PHYSICS) {
			text += StringTable.DamageType_Physics + space;
		}
		if (badStateFlag & BadStateFlag.MAGIC) {
			text += StringTable.DamageType_Magic + space;
		}
		if (badStateFlag & BadStateFlag.ITEM) {
			text += root.queryCommand('item_unitcommand') + space;
		}
		if (badStateFlag & BadStateFlag.WAND) {
			text += root.queryCommand('wand_unitcommand') + space;
		}

		x += ItemInfoRenderer.getSpaceX();
		ItemInfoRenderer.drawDefault(x, y, text);
	},
	
	getItemSentenceCount: function(state) {
		return state.getBadStateFlag() > 0;
	}
}
);

ItemSentenceStateInfo.Option = defineObject(BaseItemSentence,
{
	drawItemSentence: function(x, y, state) {
		var text;
		var badStateOption = state.getBadStateOption();
		
		if( badStateOption == 0 ) {
			return;
		}

		text = '行動制限';
		ItemInfoRenderer.drawKeyword(x, y, text);

		text = '';
		if (badStateOption == BadStateOption.NOACTION) {
			text += '行動禁止 '
		}
		if (badStateOption == BadStateOption.BERSERK) {
			text += '暴走 '
		}
		if (badStateOption == BadStateOption.AUTO) {
			text += '自動AI '
		}

		x += ItemInfoRenderer.getSpaceX();
		ItemInfoRenderer.drawDefault(x, y, text);
	},
	
	getItemSentenceCount: function(state) {
		return state.getBadStateOption() > 0;
	}
}
);

ItemSentenceStateInfo.AutoRemoval = defineObject(BaseItemSentence,
{
	drawItemSentence: function(x, y, state) {
		var text;
		var type = state.getAutoRemovalType();
		var count = state.getAutoRemovalValue();
		
		if (type === StateAutoRemovalType.NONE) {
			return;
		}

		text = '解除条件';
		ItemInfoRenderer.drawKeyword(x, y, text);

		text = '';
		if (type === StateAutoRemovalType.BATTLEEND) {
			text += '戦闘発生'
		}
		if (type === StateAutoRemovalType.ACTIVEDAMAGE) {
			text += '攻撃命中'
		}
		if (type === StateAutoRemovalType.PASSIVEDAMAGE) {
			text += '攻撃被弾'
		}

		x += 100;
		ItemInfoRenderer.drawDefault(x, y, text);
		ItemInfoRenderer.drawDefault(x + 70, y, count + '回');
	},
	
	getItemSentenceCount: function(state) {
		var type = state.getAutoRemovalType();
		
		return type === StateAutoRemovalType.NONE ? 0 : 1;
	}
}
);

ItemSentenceStateInfo.Skill = defineObject(BaseItemSentence,
{
	drawItemSentence: function(x, y, state) {
		var skillList = state.getSkillReferenceList();
		var count = skillList.getTypeCount();
		var i, skill, skillname;
		
		if (count < 1) return;
		
		ItemInfoRenderer.drawKeyword(x, y, 'スキル');
		x += ItemInfoRenderer.getSpaceX();
		
		for (i = 0; i < count; i++) {
			skill = skillList.getTypeData(i);
			
			if (skill !== null) {
				skillname = skill.getName();
				ItemInfoRenderer.drawDefault(x, y, skillname);
				y += ItemInfoRenderer.getSpaceY()
			}
		}
	},
	
	getItemSentenceCount: function(state) {
		var skillList = state.getSkillReferenceList();
		var count = skillList.getTypeCount();
		
		return count;
	}
}
);

// EP回復値
ItemSentenceStateInfo.EPRecoveryValue = defineObject(BaseItemSentence,
{
	_value: 0,
	
	setParentWindow: function(itemInfoWindow) {
		BaseItemSentence.setParentWindow.call(this, itemInfoWindow);
		
		// ステートの回復値を取得
		this._value = this._setStateRecoveryValue(itemInfoWindow._state);
	},
	
	_setStateRecoveryValue: function(state) {
		var recovery = 0;
		
		if (typeof OT_GetUseEP === 'undefined') {
//			root.log('EP使用:EPシステムが未導入です');
			return 0;
		}
		
		if (!OT_isEPCustom(state, 'Recovery')) return 0;
		
		if (typeof state.custom.OT_EP.Recovery === 'number') {
			recovery += state.custom.OT_EP.Recovery;
		}
		
		return recovery;
	},
	
	drawItemSentence: function(x, y, state) {
		if (this._value === 0) return;
		
		var number = this._value;
		if (number < 0) number *= -1;
		
		ItemInfoRenderer.drawKeyword(x, y, 'EP回復');
		x += ItemInfoRenderer.getSpaceX();
		
		TextRenderer.drawSignText(x, y, this._value > 0 ? ' + ': ' - ');
		
		x += 10;
		x += DefineControl.getNumberSpace();

		NumberRenderer.drawRightNumber(x, y, number);
	},

	getItemSentenceCount: function(state) {
		var recovery = 0;
		
		if (typeof OT_GetUseEP === 'undefined') {
			return 0;
		}
		
		if (!OT_isEPCustom(state, 'Recovery')) return 0;

		if (typeof state.custom.OT_EP.Recovery === 'number') {
			recovery = state.custom.OT_EP.Recovery;
		}
		
		if (recovery === 0) return 0;
	
		return 1;
	}
}
);

// FP回復値
ItemSentenceStateInfo.FPRecoveryValue = defineObject(BaseItemSentence,
{
	_value: 0,
	
	setParentWindow: function(itemInfoWindow) {
		BaseItemSentence.setParentWindow.call(this, itemInfoWindow);
		
		// ステートの回復値を取得
		this._value = this._setStateRecoveryValue(itemInfoWindow._state);
	},
	
	_setStateRecoveryValue: function(state) {
		var recovery = 0;
		
		if (typeof OT_GetUseFP === 'undefined') {
//			root.log('FP使用:FPシステムが未導入です');
			return 0;
		}
		
		if (!OT_isFPCustom(state, 'Recovery')) return 0;
		
		if (typeof state.custom.OT_FP.Recovery === 'number') {
			recovery += state.custom.OT_FP.Recovery;
		}
		
		return recovery;
	},
	
	drawItemSentence: function(x, y, state) {
		if (this._value === 0) return;
		
		var number = this._value;
		if (number < 0) number *= -1;
		
		ItemInfoRenderer.drawKeyword(x, y, 'FP回復');
		x += ItemInfoRenderer.getSpaceX();
		
		TextRenderer.drawSignText(x, y, this._value > 0 ? ' + ': ' - ');
		
		x += 10;
		x += DefineControl.getNumberSpace();

		NumberRenderer.drawRightNumber(x, y, number);
	},

	getItemSentenceCount: function(state) {
		var recovery = 0;
		
		if (typeof OT_GetUseFP === 'undefined') {
			return 0;
		}
		
		if (!OT_isFPCustom(state, 'Recovery')) return 0;

		if (typeof state.custom.OT_FP.Recovery === 'number') {
			recovery = state.custom.OT_FP.Recovery;
		}
		
		if (recovery === 0) return 0;
	
		return 1;
	}
}
);

//------------------------------
// ステータス増減値
// @param { _arr: Array }
//------------------------------
ItemSentenceStateInfo.DopingParameter = defineObject(BaseItemSentence,
{
	_arr: null,
	
	setParentWindow: function(itemInfoWindow) {
		BaseItemSentence.setParentWindow.call(this, itemInfoWindow);
		
		// ステートのドーピング値を配列で取得
		this._arr = this._setStateDopingParam(itemInfoWindow._state);
	},
	
	_setStateDopingParam: function(state) {
		var i, n, value;
		var count = ParamGroup.getParameterCount();
		var arr = [];

		if (state === null) return;

		for (i = 0; i < count; i++) {
			n = ParamGroup.getDopingParameter(state, i);
			
			if (n !== 0) {
				arr.push([ParamGroup.getParameterName(i), n]);
			}
		}
		
		return arr;
	},
	
	drawItemSentence: function(x, y, state) {
		if (this._arr === null || this._arr.length === 0) {
			return 0;
		}
		
		ItemInfoRenderer.drawKeyword(x, y, root.queryCommand('support_capacity'));
		x += ItemInfoRenderer.getSpaceX();
		ItemInfoRenderer._drawDopingState(x, y, this._arr);
	},
	
	getItemSentenceCount: function(state) {
		var i, n;
		var count = ParamGroup.getParameterCount();
		var count2 = 0;
		
		for (i = 0; i < count; i++) {
			n = ParamGroup.getDopingParameter(state, i);

			if (n !== 0) {
				count2++;
			}
		}
		
		return Math.ceil(count2 / 2);
	}
}
);

// ターン経過/ボーナス値減少
ItemSentenceStateInfo.TurnChangeValue = defineObject(BaseItemSentence,
{
	drawItemSentence: function(x, y, state) {
		var text, recoveryValue;
		var value = state.getTurnChangeValue();
		
		if (value === 0) return;
		
		text = '補正減少';
		ItemInfoRenderer.drawKeyword(x, y, text);
		x += ItemInfoRenderer.getSpaceX();
		NumberRenderer.drawRightNumber(x, y, value);
		
		x += 10;
		if (value > 99) x += 9;
		if (value > 9)  x += 9;
		ItemInfoRenderer.drawKeyword(x, y, ' / ターン');
	},
	
	getItemSentenceCount: function(state) {
		var value = state.getTurnChangeValue();
		
		if (value === 0) return 0;
	
		return 1;
	}
}
);

//-----------------------------------
//　スキル情報ウィンドウに付与ステート名を表示
//-----------------------------------
var _SkillInfoWindow_drawWindowContent = SkillInfoWindow.drawWindowContent;
SkillInfoWindow.drawWindowContent = function(x, y) {
	if (this._skill === null) return;
	
	var length = this._getTextLength();
	var textui = this.getWindowTextUI();
	var font = textui.getFont();
	var text = '';
	var objecttype = this._objecttype;
	var skilltype, state, list, id;
	var dx = ItemInfoRenderer.getSpaceX();
		
	_SkillInfoWindow_drawWindowContent.call(this, x, y);
	y += _SkillInfoWindow_getWindowHeight.call(this) - ItemInfoRenderer.getSpaceY();

	skilltype = this._skill.getSkillType();
	if (skilltype === SkillType.STATEATTACK
		|| typeof this._skill.custom.SkillInfo_stateid === 'number'
	) {
		list = root.getBaseData().getStateList();
		text = '付与';
		
		if (skilltype === SkillType.STATEATTACK) {
			id = this._skill.getSkillValue();
			state = list.getDataFromId(id);
		}
		else if (typeof this._skill.custom.SkillInfo_stateid === 'number') {
			id = this._skill.custom.SkillInfo_stateid;
			state = list.getDataFromId(id);
		}
		
		if (state !== null) {
			TextRenderer.drawKeywordText(x, y, text, length, ColorValue.KEYWORD, font);

			TextRenderer.drawKeywordText(x + dx, y, state.getName(), length, ColorValue.DEFAULT, font);
			
			if (!SKILL_SubWindowDrawType && this._isSubWidowEnabled) {
				TextRenderer.drawSignText(x, y + 12, KEY_NEME);
			}
			
			y += ItemInfoRenderer.getSpaceY();
		}
	}
};

var _SkillInfoWindow_getWindowHeight = SkillInfoWindow.getWindowHeight;
SkillInfoWindow.getWindowHeight = function() {
	var height = _SkillInfoWindow_getWindowHeight.call(this);
	
	if (this._skill === null) return height;
	
	if (this._skill.getSkillType() === SkillType.STATEATTACK
		|| typeof this._skill.custom.SkillInfo_stateid === 'number'
	) {
		height +=  ItemInfoRenderer.getSpaceY();
	}
	
	return height;
};

})();
