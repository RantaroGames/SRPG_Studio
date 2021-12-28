/*
■ファイル名
ItemListWindow_setDefaultItemFormation_add.js

■SRPG Studio対応バージョン
ver.1.236

■プラグインの概要
ユニットのアイテム所持最大数(コンフィグ2のアイテム所持数)を8以上に設定している時に以下の処理を追加する
・ユニット整理画面でユニットを選択した際、サブウィンドウに表示される所持アイテム数を任意の値にする
・ショップ画面の下側、商品を表示しているウインドウに表示されるアイテム数を任意の値にする
・使用アイテム/杖/武器選択ウィンドウに表示されるアイテム数をユニットの所持最大数に変更(規定は8)
・使用アイテム/杖/武器選択時、アイテム情報ウィンドウの表示位置をリストの横に変更する

■使用方法
このプラグインをpluginフォルダに入れる

■作成者
ran
*/

(function() {
//----------------------------------------------------------
// 表示アイテム数の設定
//----------------------------------------------------------
// ユニット整理画面でユニットを選択した際、サブウィンドウに表示される所持アイテム数
var ItemListWindow_ItemFormationCount = 8;

// ショップ画面で下部ウィンドウに表示されるアイテム数
var ShopItemWindow_ScrollFormationCount = 8;


/*--------------------------------------------------------------------------------------------------------------
(上書き処理)
エディタのデータ設定で所持アイテムの上限を増やした場合でも、上記のウィンドウではmax7個しか表示されない点を調整
なおDefineControl.getVisibleUnitItemCount()の処理を変更しない場合、この関数で数値を変更しても
画面の高さ600で表示されるアイテムの上限は9（ストック交換画面でウィンドウが被らない上限数も同様）
(ストック交換画面でユニットの所持アイテムリスト(左側ウィンドウ)の表示数は既存処理では12が最大)
--------------------------------------------------------------------------------------------------------------*/
ItemListWindow.setDefaultItemFormation = function() {
	var max = ItemListWindow_ItemFormationCount;//7;
	var count = DataConfig.getMaxUnitItemCount();
	
	if (count > max) {
		count = max;
	}
	
	this.setItemFormation(count);
};

/*----------------------------------------------------------------
(上書き処理)
ShopItemWindowはショップ画面の下側、商品を表示しているウインドウ
元の処理では画面の高さ600以上の場合、アイテムを7個表示している
高さ600の場合、既存のUIでウィンドウが被らない上限は11
----------------------------------------------------------------*/
ShopItemWindow.setShopWindowData = function() {
	var count = 6;
	
	if (root.getGameAreaHeight() >= 600) {
		count = ShopItemWindow_ScrollFormationCount;//7;
		if (count > 11) count = 11;
	}
	
	this._scrollbar = createScrollbarObject(this.getScrollbarObject(), this);
	this._scrollbar.setScrollFormation(1, count);
	this._scrollbar.enablePageChange();
	this.updateItemArea();
};

/*---------------------------------------------------------
(上書き処理)
使用アイテム選択時のリスト表示アイテム数を所持最大数まで拡張
-----------------------------------------------------------*/
ItemSelectMenu._resetItemList = function() {
	var count = UnitItemControl.getPossessionItemCount(this._unit);
	var visibleCount = DataConfig.getMaxUnitItemCount();//8;
	
	if (count > visibleCount) {
		count = visibleCount;
	}
	
	this._itemListWindow.setItemFormation(count);
	this._itemListWindow.setUnitItemFormation(this._unit);
};

// 杖選択時のリスト表示アイテム数
WandSelectMenu._setWandFormation = function() {
	var count = this.getWandCount();
	var visibleCount = DataConfig.getMaxUnitItemCount();//8;
	
	if (count > visibleCount) {
		count = visibleCount;
	}
	
	this._itemListWindow.setItemFormation(count);
};

// 武器選択時のリスト表示アイテム数
WeaponSelectMenu._setWeaponFormation = function() {
	var count = this.getWeaponCount();
	var visibleCount = DataConfig.getMaxUnitItemCount();//8;
	
	if (count > visibleCount) {
		count = visibleCount;
	}
	
	this._itemListWindow.setItemFormation(count);
};
/*-------------------------------------------------------------------------
(上書き処理)
使用アイテム選択時、アイテム情報ウィンドウの表示位置をリストの横に変更する
既存処理では下に表示されるため、アイテム情報が見切れてしまう点を補正する
-------------------------------------------------------------------------*/
ItemSelectMenu.drawWindowManager = function() {
	var x = this.getPositionWindowX();
	var y = this.getPositionWindowY();
//	var height = this._itemListWindow.getWindowHeight();
	var width = this._itemListWindow.getWindowWidth();
	
	this._itemListWindow.drawWindow(x, y);
	
//	this._itemInfoWindow.drawWindow(x, y + height + this._getWindowInterval());
	this._itemInfoWindow.drawWindow(x + width, y + this._itemWorkWindow.getWindowHeight());
	
	if (this.getCycleMode() === ItemSelectMenuMode.WORK) {
		this._itemWorkWindow.drawWindow(x + this._itemListWindow.getWindowWidth(), y);
	}
	
	if (this.getCycleMode() === ItemSelectMenuMode.DISCARD) {
		this._discardManager.drawWindowManager();
	}
};

// ウィンドウ表示位置x座標の調整
ItemSelectMenu.getTotalWindowWidth = function() {
	return this._itemListWindow.getWindowWidth() + this._itemInfoWindow.getWindowWidth();// + this._itemWorkWindow.getWindowWidth() 
};

// ・使う・捨てるの並びを横に変更
ItemWorkWindow.setupItemWorkWindow = function() {
	this._scrollbar = createScrollbarObject(ItemWorkScrollbar, this);
	this._scrollbar.setScrollFormation(2, 1);
};

// 杖選択リストでのアイテム情報ウィンドウ表示位置
WandSelectMenu.drawWindowManager = function() {
	var x = this.getPositionWindowX();
	var y = this.getPositionWindowY();
//	var height = this._itemListWindow.getWindowHeight();
	var width = this._itemListWindow.getWindowWidth();
	
	this._itemListWindow.drawWindow(x, y);
//	this._itemInfoWindow.drawWindow(x, y + height + this._getWindowInterval());
	this._itemInfoWindow.drawWindow(x + width, y);
};

// ウィンドウ表示位置x座標の調整
WandSelectMenu.getTotalWindowWidth = function() {
	return this._itemListWindow.getWindowWidth() + this._itemInfoWindow.getWindowWidth();
};

// 武器選択リストでのアイテム情報ウィンドウ表示位置
WeaponSelectMenu.drawWindowManager = function() {
	var x = this.getPositionWindowX();
	var y = this.getPositionWindowY();
//	var height = this._itemListWindow.getWindowHeight();
	var width = this._itemListWindow.getWindowWidth();
	
	this._itemListWindow.drawWindow(x, y);
//	this._itemInfoWindow.drawWindow(x, y + height + this._getWindowInterval());
	this._itemInfoWindow.drawWindow(x + width, y);
};

// ウィンドウ表示位置x座標の調整
WeaponSelectMenu.getTotalWindowWidth = function() {
	return this._itemListWindow.getWindowWidth() + this._itemInfoWindow.getWindowWidth();
};


})();
