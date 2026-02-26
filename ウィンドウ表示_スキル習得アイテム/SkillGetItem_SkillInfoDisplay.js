/*
■ファイル
SkillGetItem_SkillInfoDisplay.js

■SRPG Studio対応バージョン:1.319

■プラグインの概要
スキル習得アイテムの情報ウィンドウに獲得スキル情報を併記します。

※仕様
本プラグインでスキル情報を併記する状態は以下の3点です
・ユニットメニュー
・ショップ
・ボーナス交換

(注意点）
スキル情報は、基本的にアイテム情報ウィンドウの下部に表示されます
表示できないウィンドウ高さの場合はアイテム情報ウィンドウの左に表示されます
ウィンドウが画面に収まらない場合が生じることもあります（ゲーム画面が小さい場合やスキル情報量が多い場合）
またショップレイアウトを改変しているプラグインとも競合する恐れが大きいです


■使用方法
このファイルをpluginフォルダに入れる

■作成者
ran

■更新履歴
2026/02/26 新規作成

*/

(function() {

// ---------------------------------------------------------------------
// 設定項目
// スキル習得アイテムのスキル情報をデフォルトで表示するか
// true:アイテムを選択した時点でスキル情報ウィンドウを併記する false:shiftキー押下で表示する
// ---------------------------------------------------------------------
var Setting = {
	isdrawSkillInfoWindow_UnitMenu: false,
	isdrawSkillInfoWindow_Shop: true,
	isdrawSkillInfoWindow_Bonus: true
};

// -------------------------------------------------------
// (新規作成)各画面での重複処理
// -------------------------------------------------------
var SkillInfoManager = {
	// アイテムから表示すべきスキルを取得する
	getSkillFromItem: function(item) {
		if (!item || item.isWeapon() || item.getItemType() !== ItemType.SKILLGET) {
			return null;
		}
		
		var skillChangeInfo = item.getSkillChangeInfo();
		if (skillChangeInfo.getSkillControlType() !== IncreaseType.INCREASE) {
			return null;
		}
		
		return skillChangeInfo.getSkill();
	},

	// レイアウト計算：アイテムウィンドウの隣または下にスキルウィンドウを配置する
	getResizedPos: function(itemInfoWindow, skillInfoWindow, x, y) {
		var itemWidth = itemInfoWindow.getWindowWidth();
		var itemHeight = itemInfoWindow.getWindowHeight();
		var skillWidth = skillInfoWindow.getWindowWidth();
		var skillHeight = skillInfoWindow.getWindowHeight();
		var gameWidth = root.getGameAreaWidth();
		var lowerLimit = root.getGameAreaHeight() - UIFormat.SCREENFRAME_HEIGHT;
		
		var res = { itemX: x, itemY: y, skillX: x, skillY: y + itemHeight };

		// 下にはみ出す場合は上にずらす
		if (res.skillY + skillHeight > lowerLimit) {
			res.itemY = lowerLimit - (itemHeight + skillHeight);
			res.skillY = res.itemY + itemHeight;
			
			// 上にも収まらない（画面縦幅不足）場合は横に並べる
			if (res.itemY < 0) {
				res.itemY = y;
				res.skillY = y;
				res.skillX = x - skillWidth;
				if (res.skillY + skillHeight > lowerLimit) {
					res.skillY = lowerLimit - skillHeight;
				}
			}
		}

		// 左端チェック
		if (res.skillX < 0) {
			res.itemX += Math.abs(res.skillX);
			res.skillX = 0;
		}
		
		return res;
	},

	// 共通の描画補助：Shiftキーの案内を表示
	drawShiftHint: function(x, y, isVisible) {
		var text = isVisible ? 'Shift:スキル情報非表示' : 'Shift:スキル情報表示';
		var font = root.getBaseData().getFontList().getDatafromId(5) || root.getBaseData().getFontList().getData(0);
		TextRenderer.drawText(x + 20, y + 5, text, -1, ColorValue.DISABLE, font);
	}
};

// -------------------------------------------------------
// ItemInfoWindowクラス
// -------------------------------------------------------
ItemInfoWindow._skillGetItemSkill = null;

var _ItemInfoWindow_setInfoItem = ItemInfoWindow.setInfoItem;
ItemInfoWindow.setInfoItem = function(item) {
	_ItemInfoWindow_setInfoItem.call(this, item);
	// Manager経由でスキルを取得して保持
	this._skillGetItemSkill = SkillInfoManager.getSkillFromItem(item);
};

// -------------------------------------------------------
// SkillInfoWindowクラス
// -------------------------------------------------------
var _SkillInfoWindow_initialize = SkillInfoWindow.initialize;
SkillInfoWindow.initialize = function() {
	_SkillInfoWindow_initialize.call(this);
	this._isWindowEnabled = false;
};

// -------------------------------------------------------
// UnitMenuBottomWindowクラス
// -------------------------------------------------------
UnitMenuBottomWindow._getSkillInfoWindow = null;
UnitMenuBottomWindow._isSkillWindow = Setting.isdrawSkillInfoWindow_UnitMenu;

var _UnitMenuBottomWindow_setUnitMenuData = UnitMenuBottomWindow.setUnitMenuData;
UnitMenuBottomWindow.setUnitMenuData = function() {
	_UnitMenuBottomWindow_setUnitMenuData.call(this);
	this._getSkillInfoWindow = createWindowObject(SkillInfoWindow, this);
};

var _UnitMenuBottomWindow_moveWindowContent = UnitMenuBottomWindow.moveWindowContent;
UnitMenuBottomWindow.moveWindowContent = function() {
	var result = _UnitMenuBottomWindow_moveWindowContent.call(this);
	var itemWindow = this._itemInteraction.getInteractionWindow();
	var skill = itemWindow._skillGetItemSkill;
	
	if (skill) {
		this._getSkillInfoWindow.setSkillInfoData(skill, ObjectType.NULL);
		if (InputControl.isInputAction(InputType.BTN4)) {
			this._isSkillWindow = !this._isSkillWindow;
		}
	} else {
		this._getSkillInfoWindow.initialize();
	}
	
	return result;
};

var _UnitMenuBottomWindow__drawInfoWindow = UnitMenuBottomWindow._drawInfoWindow;
UnitMenuBottomWindow._drawInfoWindow = function(xBase, yBase) {
	var itemWindow = this._itemInteraction.getInteractionWindow();
	var skill = itemWindow._skillGetItemSkill;

	// 通常の描画条件（スキルがない、またはヘルプがアイテム以外）
	if (!skill || this._isTracingLocked || this._getActiveUnitMenuHelp() !== UnitMenuHelp.ITEM) {
		_UnitMenuBottomWindow__drawInfoWindow.call(this, xBase, yBase);
		return;
	}

	// 描画座標の計算
	var x = xBase + ItemRenderer.getItemWidth();
	var maxW = root.getGameAreaWidth();
	if (x + itemWindow.getWindowWidth() > maxW) {
		x = maxW - itemWindow.getWindowWidth() - 8;
	}

	if (!this._isSkillWindow) {
		_UnitMenuBottomWindow__drawInfoWindow.call(this, xBase, yBase);
		SkillInfoManager.drawShiftHint(x, yBase, false);
	} else {
		var pos = SkillInfoManager.getResizedPos(itemWindow, this._getSkillInfoWindow, x, yBase);
		itemWindow.drawWindow(pos.itemX, pos.itemY);
		this._getSkillInfoWindow.drawWindow(pos.skillX, pos.skillY);
		SkillInfoManager.drawShiftHint(pos.itemX, pos.itemY, true);
	}
};

// -------------------------------------------------------
// ShopLayoutScreenクラス
// -------------------------------------------------------
ShopLayoutScreen._getSkillInfoWindow = null;
ShopLayoutScreen._isSkillWindow = Setting.isdrawSkillInfoWindow_Shop;

var _ShopLayoutScreen_prepareScreenMemberData = ShopLayoutScreen._prepareScreenMemberData;
ShopLayoutScreen._prepareScreenMemberData = function(screenParam) {
	_ShopLayoutScreen_prepareScreenMemberData.call(this, screenParam);
	this._getSkillInfoWindow = createWindowObject(SkillInfoWindow, this); 
};

var _ShopLayoutScreen__moveBuy = ShopLayoutScreen._moveBuy;
ShopLayoutScreen._moveBuy = function() {
	if (this._itemInfoWindow._skillGetItemSkill && InputControl.isInputAction(InputType.BTN4)) {
		this._isSkillWindow = !this._isSkillWindow;
	}
	return _ShopLayoutScreen__moveBuy.call(this);
};

var _ShopLayoutScreen_notifyInfoItem = ShopLayoutScreen.notifyInfoItem;
ShopLayoutScreen.notifyInfoItem = function(item) {
	_ShopLayoutScreen_notifyInfoItem.call(this, item);
	var skill = this._itemInfoWindow._skillGetItemSkill;
	if (skill) {
		this._getSkillInfoWindow.setSkillInfoData(skill, ObjectType.NULL);
	} else {
		this._getSkillInfoWindow.initialize();
	}
};

var _ShopLayoutScreen_drawScreenCycle = ShopLayoutScreen.drawScreenCycle;
ShopLayoutScreen.drawScreenCycle = function() {
	var skill = this._itemInfoWindow._skillGetItemSkill;
	var isBuyMode = this.getCycleMode() === ShopLayoutMode.BUY;

	// スキル表示不要な場合はオリジナルの描画
	if (!isBuyMode || !skill || !this._isSkillWindow) {
		_ShopLayoutScreen_drawScreenCycle.call(this);
		if (isBuyMode && skill) {
			var x = LayoutControl.getCenterX(-1, this._getTopWindowWidth()) + this._activeItemWindow.getWindowWidth();
			var y = LayoutControl.getCenterY(-1, this._getTopWindowHeight()) + this._keeperWindow.getWindowHeight();
			SkillInfoManager.drawShiftHint(x, y, this._isSkillWindow);
		}
		return;
	}

	// 独自レイアウト描画
	var xBase = LayoutControl.getCenterX(-1, this._getTopWindowWidth());
	var yBase = LayoutControl.getCenterY(-1, this._getTopWindowHeight());
	
	this._keeperWindow.drawWindow(xBase, yBase);
	this._activeSelectWindow.drawWindow(xBase + this._keeperWindow.getWindowWidth(), yBase);
	this._currencyWindow.drawWindow(xBase + this._keeperWindow.getWindowWidth(), yBase + this._activeSelectWindow.getWindowHeight());
	
	var itemY = yBase + this._keeperWindow.getWindowHeight();
	var itemX = xBase + this._activeItemWindow.getWindowWidth();
	
	var pos = SkillInfoManager.getResizedPos(this._itemInfoWindow, this._getSkillInfoWindow, itemX, itemY);
	
	this._activeItemWindow.drawWindow(xBase, itemY);
	this._itemInfoWindow.drawWindow(pos.itemX, pos.itemY);
	this._getSkillInfoWindow.drawWindow(pos.skillX, pos.skillY);
	SkillInfoManager.drawShiftHint(pos.itemX, pos.itemY, true);
};

// --------------------------------------------------
// BonusLayoutScreenクラス (Shopと同様の構成)
// --------------------------------------------------
BonusLayoutScreen._getSkillInfoWindow = null;
BonusLayoutScreen._isSkillWindow = Setting.isdrawSkillInfoWindow_Bonus;

var _BonusLayoutScreen_prepareScreenMemberData = BonusLayoutScreen._prepareScreenMemberData;
BonusLayoutScreen._prepareScreenMemberData = function(screenParam) {
	_BonusLayoutScreen_prepareScreenMemberData.call(this, screenParam);
	this._getSkillInfoWindow = createWindowObject(SkillInfoWindow, this); 
};

var _BonusLayoutScreen__moveBuy = BonusLayoutScreen._moveBuy;
BonusLayoutScreen._moveBuy = function() {
	if (this._itemInfoWindow._skillGetItemSkill && InputControl.isInputAction(InputType.BTN4)) {
		this._isSkillWindow = !this._isSkillWindow;
	}
	return _BonusLayoutScreen__moveBuy.call(this);
};

})();