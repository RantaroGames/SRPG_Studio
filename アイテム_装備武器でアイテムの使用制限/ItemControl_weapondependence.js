/*
■ファイル名
ItemControl_weapondependence.js

■SRPG Studio対応バージョン
ver.1.252

■プラグインの概要
装備中の武器(または武器タイプ)に応じてアイテムの使用可否判定を操作する

■使用方法
1．itemのカスタムパラメータに数値を設定する
　{WeaponDependence: number}
　0: 武器毎に個別判定
　1: 武器タイプで判定
　0または1以外の値を記述していた場合は、装備武器に関わらずアイテム使用が可能

2．装備中は上記のitemを使用制限したい武器タイプまたは個別の武器のカスタムパラメータに以下を設定する
　{isRegulation: true}

（使用例)
・盾(アイテム)を両手剣(武器)装備中に使用不可にしたい場合

方法1．個別の武器毎に使用不可判定する処理
盾のカスタムパラメータに{WeaponDependence: 0}
両手剣武器のカスタムパラメータに{isRegulation: true}

方法2．武器タイプで判定する処理
盾のカスタムパラメータに{WeaponDependence: 1}
両手剣という武器タイプを作成し、そのカスタムパラメータに{isRegulation: true}
※この時、個別武器のカスタムパラメータに{isRegulation: false}と設定することで、その武器は装備中でもアイテムを使用可能にできる


(アイテム情報の文字列を変更したい場合)
下記のITEM_INFO_TEXTオブジェクト内のテキストを変更する
ITEM_INFO_TEXT.WEAPON: 武器のカスタムパラメータに{isRegulation: true}と設定されている場合のテキスト
ITEM_INFO_TEXT.WEAPONTYPE: 武器タイプのカスタムパラメータに{isRegulation: true}と設定されている場合のテキスト
ITEM_INFO_TEXT.WEAPON_NORN: 武器のカスタムパラメータに{isRegulation: false}と設定されている場合

ITEM_INFO_TEXT.ITEM: アイテムのカスタムパラメータに{WeaponDependence: 0}と設定されている場合
ITEM_INFO_TEXT.TYPE: アイテムのカスタムパラメータに{WeaponDependence: 1}と設定されている場合(※)

※装備中にそのアイテム使用不可になる武器タイプのアイコンを表示する(アイコンが無い場合は、武器タイプの名前を表示)
ただし、タイプが多すぎると情報ウィンドウの横幅を越えて表示されるので注意

■作成者
ran

■更新履歴
2022/01/23 新規作成

*/


(function() {
	
var ITEM_INFO_TEXT = {
	// 武器情報
	WEAPON: '装備中 特定アイテム使用不可',
	WEAPONTYPE: '同タイプ装備中 特定アイテム使用不可',
	WEAPON_NORN: '装備中 特定アイテム使用可',
	
	// アイテム情報
	ITEM: '特定武器装備中 使用不可',
	TYPE: '競合タイプ'
};

var _ItemControl_isItemUsable = ItemControl.isItemUsable;
ItemControl.isItemUsable= function(unit, item) {
	var result = _ItemControl_isItemUsable.call(this, unit, item);
	var weapon, weaponType;
	
	if (result === false) return false;
	
	// itemのカスタムパラメータに数値が設定されていない場合
	if (typeof item.custom.WeaponDependence !== 'number') return result;
	
	weapon = ItemControl.getEquippedWeapon(unit);
	// 装備中の武器が無い場合
	if (weapon === null) return result;
	
	// 武器タイプで判定する設定の場合
	if (item.custom.WeaponDependence === 1) {
		weaponType = weapon.getWeaponType();
		if (weaponType.custom.isRegulation === true ) {
			// 武器タイプがアイテム使用制限している場合でも、個別武器で制限解除を設定可能
			if (weapon.custom.isRegulation === false) {
				return true;
			}
			else {
				return false;
			}
		}
	}
	// 武器毎に個別判定する場合
	else if (item.custom.WeaponDependence === 0)　{
		if (weapon.custom.isRegulation === true) {
			return false;
		}
	}
	
	return true;
};

//---------------------------------------------------
// アイテム情報に簡易説明文を追加する処理
//---------------------------------------------------
var _ItemInfoWindow__configureWeapon = ItemInfoWindow._configureWeapon;
ItemInfoWindow._configureWeapon = function(groupArray) {
	_ItemInfoWindow__configureWeapon.call(this, groupArray);
	
	groupArray.appendObject(ItemSentence.WeaponDependenceItem);
};

var _ItemInfoWindow__configureItem = ItemInfoWindow._configureItem;
ItemInfoWindow._configureItem = function(groupArray) {
	_ItemInfoWindow__configureItem.call(this, groupArray);
	
	groupArray.appendObject(ItemSentence.WeaponDependenceItem);
};

ItemSentence.WeaponDependenceItem = defineObject(BaseItemSentence,
{
	_iconhandlearr: null,
	
	setParentWindow: function(itemInfoWindow) {
		var item = itemInfoWindow.getInfoItem();
	
		BaseItemSentence.setParentWindow.call(this, itemInfoWindow);
		
		this._iconhandlearr = this._getWeaponTypeIconArray(item);
	},
	
	drawItemSentence: function(x, y, item) {
		var text, textWidth, weaponType, i, obj;
		var color = ColorValue.KEYWORD;
		var font = root.queryTextUI('default_window').getFont();
		var textlength = ItemRenderer.getItemWindowWidth();
		
		if (item.isWeapon()) {
			weaponType = item.getWeaponType();
			if (weaponType.custom.isRegulation === true) {
				text = ITEM_INFO_TEXT.WEAPONTYPE;
			}
			else if (item.custom.isRegulation === true) {
				text = ITEM_INFO_TEXT.WEAPON;
			}
			
			if (item.custom.isRegulation === false) {
				text = ITEM_INFO_TEXT.WEAPON_NORN;
			}
			TextRenderer.drawKeywordText(x, y, text, textlength, color, font);
		}
		else {
			if (this._iconhandlearr.length > 0 && item.custom.WeaponDependence === 1) {
				text = ITEM_INFO_TEXT.TYPE;
				TextRenderer.drawKeywordText(x, y, text, textlength, color, font);
				textWidth = TextRenderer.getTextWidth(text, font);
				x += textWidth + 10;
				
				for (i = 0; i < this._iconhandlearr.length; i++) {
					obj = this._iconhandlearr[i];
					if (obj === null) continue;
					
					if (obj.handle.isNullHandle() === false) {
						GraphicsRenderer.drawImage(x, y, obj.handle, GraphicsType.ICON);
						x += 30;
					}
					else { 
						TextRenderer.drawKeywordText(x, y, obj.name, textlength, ColorValue.DEFAULT, font);
						x += 30;
					}
				}

			}
			else if (item.custom.WeaponDependence === 0) {
				text = ITEM_INFO_TEXT.ITEM;
				TextRenderer.drawKeywordText(x, y, text, textlength, color, font);
			}
		}
	},
	
	getItemSentenceCount: function(item) {
		var count = 0;
		
		if (item.isWeapon()) {
			weaponType = item.getWeaponType();
			if (weaponType.custom.isRegulation === true || typeof item.custom.isRegulation === 'boolean') {
				count++;
			}
		}
		else {
			if (this._iconhandlearr.length > 0 && item.custom.WeaponDependence === 1) {
				count++;
			}
			if (item.custom.WeaponDependence === 0) {
				count++;
			}
		}
		
		return count;
	},
	
	_getWeaponTypeIconArray: function(item) {
		var handle, index, list, weaponType, i, count;
		var obj;
		var arr = [];
		
		if (item.custom.WeaponDependence === 1) {
			// 物理・弓・魔法カテゴリーから武器タイプのリストをそれぞれ取得する
			for (index = 0; index < 3; index++) {
				list = root.getBaseData().getWeaponTypeList(index);
				count = list.getCount();
				
				for (i = 0; i < count; i++) {
					weaponType = list.getData(i);
					if (weaponType.custom.isRegulation !== true) {
						continue;
					}
					
					obj = {};
					obj.handle = weaponType.getIconResourceHandle();
					obj.name = weaponType.getName();

					arr.push(obj);
				}
			}
		}
		
		return arr;
	}
}
);

})();