/*
■ファイル
UC_UnitItemTrade_add.js

■プラグインの概要
ユニット自身を「交換」コマンドの対象に追加する

自身を選択する際の「交換」コマンドの挙動
・所持品を2個以上所持していること
・コンフィグでゲストユニットのアイテム増減を許可していない場合、ゲストユニットは「交換」コマンドが許可されない

フュージョンしている場合の挙動(子のタイプ別。フュージョン設定でアイテム交換を許可している場合のみ)
　自軍ユニット：子とアイテム交換
　ゲストユニット：ゲストのアイテム増減が許可されている=ゲスト/許可されていない=親ユニット自身
　同盟軍ユニット：親ユニット自身
　敵軍ユニット：敵軍ユニットとアイテム交換

■使用方法
このファイルをpluginフォルダに入れる

■SRPG Studio対応バージョン:1.224

■作成者
ran
*/

(function() {

//posSelectorを自分も対象に選択できる関数に置き換え
var _UnitCommand_Trade__prepareCommandMemberData = UnitCommand.Trade._prepareCommandMemberData;
UnitCommand.Trade._prepareCommandMemberData = function() {
	_UnitCommand_Trade__prepareCommandMemberData.call(this);
	delete this._posSelector; 
	this._posSelector = createObject(PosSelector_UnitItemTrade);
};

var _UnitCommand_Trade__getTradeArray = UnitCommand.Trade._getTradeArray;
UnitCommand.Trade._getTradeArray = function(unit) {
	var indexArray = _UnitCommand_Trade__getTradeArray.call(this, unit);
	
	//元処理では、フュージョン(子)とアイテム交換できる場合は自身を対象の配列に追加している
	if (!this._isFusionTradable(unit)) {
		if (UnitItemControl.getPossessionItemCount(unit) >= 2  && Miscellaneous.isItemAccess(unit)) {
			indexArray.push(CurrentMap.getIndex(unit.getMapX(), unit.getMapY()));
		}
	}
	
	return indexArray;
};

//ゲストのアイテム増減を許可していない場合で
//ゲストユニットをフュージョン(子)に持つ場合、選択対象に含めない
var _UnitCommand_Trade__isFusionTradable = UnitCommand.Trade._isFusionTradable;
UnitCommand.Trade._isFusionTradable = function(unit) {
	if (!_UnitCommand_Trade__isFusionTradable.call(this, unit)) return false;
	
	var targetUnit = FusionControl.getFusionChild(unit);
	if (targetUnit !== null && !Miscellaneous.isItemAccess(targetUnit)) {
		return false;
	}
	
	return true;
};


//PosSelectorクラスを流用
var PosSelector_UnitItemTrade = defineObject(PosSelector,
{
	getSelectorTarget: function(isIndexArray) {
		var child;
		var unit = this._posCursor.getUnitFromCursor();
		
		if (this._unit === unit) {
			if (this._isFusionIncluded) {
				child = FusionControl.getFusionChild(unit);
				if (child !== null) {
					if (!FusionControl.isItemTradable(unit) || child.getUnitType() === UnitType.ALLY || !Miscellaneous.isItemAccess(child)) {
						//所持アイテム数2以上の時は自身を選択対象可能
						if (UnitItemControl.getPossessionItemCount(unit) >= 2) {
							return unit;
						}
						else {
							return null;
						}
					}
					else {
						return child;
					}
				}
				else {
					// 自分自身を選択可能に
					if (UnitItemControl.getPossessionItemCount(unit) >= 2  && Miscellaneous.isItemAccess(unit)) {
						return unit;
					}
					else {
						return null;
					}
				}
			}
			else {
				// 自分自身を選択させない
				return null;
			}
		}
		
		// カーソルの位置にユニットが存在し、さらに範囲内に存在するか調べる
		if (unit !== null && isIndexArray) {
			// 範囲内に存在しない場合はnullを返す
			if (!IndexArray.findUnit(this._indexArray, unit)) {
				unit = null;
			}
		}
		
		return unit;
	}
}
);

//自分を選択時は、ウィンドウを一つだけ表示する
var _UnitItemTradeScreen_drawScreenCycle = UnitItemTradeScreen.drawScreenCycle;
UnitItemTradeScreen.drawScreenCycle = function() {
	if (this._unitSrc === this._unitDest) {
		var x = LayoutControl.getCenterX(-1, this._itemListSrc.getWindowWidth());
		var y = this._getStartY();
		
		this._unitWindowSrc.drawWindow(x, y);
		this._itemListSrc.drawWindow(x, y + this._unitWindowSrc.getWindowHeight());
		return;
	}
	
	return _UnitItemTradeScreen_drawScreenCycle.call(this);
};


})();

