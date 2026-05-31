/*
■ファイル
OEC_ItemChangeInBulk.js

■SRPG Studio対応バージョン:1.322

■プラグインの概要
指定したアイテムを複数個一括でストックまたはユニットに増減させるオリジナルイベントコマンドを実装します。

■使用方法
1.このファイルをpluginフォルダに入れる

2.イベントコマンド<スクリプトの実行>で以下の情報を指定する
>種類
・イベントコマンド呼び出し

>オブジェクト名
OEC_ItemChangeInBulk

>プロパティ
// プロパティ部分は、いずれも省略可
{
  increaseType: 数値 ( 0 増やす(IncreaseType.INCREASE) / 1 減らす(IncreaseType.DECREASE) ) 規定値:0
, isStockChange: 真偽値 ( true ストックのアイテム増減 / false ユニットのアイテム増減 ) 規定値:true
, isStockSend: 真偽値 ( true ユニットのアイテムを減らした時ストックへ送る / false 送らない（アイテム消去）) 規定値:true
, isDeleteRemainder: 真偽値 ( true ストックまたはユニットの所持欄に入りきらないアイテムを削除する / false 溢れたアイテムは一つずつ確認する) 規定値:false
, isNoticeShow: 真偽値 ( true 通知用画像を表示する / false 表示しない ) 規定値:true ※falseにした場合でもアイテムが溢れた場合は画像が表示され後続処理に移行します
}

>オリジナルデータタブ
ユニット：
アイテム増減させたいユニットを指定する（isStockChange:trueの場合は無効）

アイテム:
増減させたいアイテムを指定する

数値1：
増減させたい個数を指定する(0以下は1に固定)


※例1 ストックに薬草を10個増やす
・プロパティ
未設定で良い
・オリジナルデータタブ
アイテム: 薬草
数値1 : 10

※例2 自軍ユニットの所持品からソードを4個減らしてストックへ送る
・プロパティ
{
  isStockChange: false
, increaseType: 1
, isStockSend: true
}
・オリジナルデータタブ
ユニット: 自軍ユニット
アイテム: ソード
数値１ ： 4

※仕様
複数個のアイテムを一括で減らす処理はデータリストのindexが若い順に処理していきます
（ストックの場合はソートされている順に、ユニットの所持品であれば上から順に該当アイテムを探索します）

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2024/10/04 新規作成
2024/10/06 通知画像をスライド表示できるようにした
2026/05/31 コードのリファクタリング

*/

(function() {

//-------------------------------------------------------------------
// アイテム増減の通知画像に関する設定

var NoticeViewSetting = {
	// アイテムを増やした時
	// GETITEM: '変更したい文字列' という形で置き換えれば文章を変更できる
	GETITEM:  StringTable.GetTitle_ItemChange
	// アイテムを減らした時
,	LOSTITEM: StringTable.LostTitle_ItemChange

	// スライド方向 0:左からフレームイン, 1:右から, 2:上から, 3:下から, 4:左上から, 5:左下から, 6:右上から, 7:右下から, 8:スライド無し
,	DIRECTION: 8
	// 画像の分割数 8なら1フレーム毎に8分割ずつスライド
,	INTERVAL: 8
	// 通知の表示総フレーム数 60フレーム=約1秒 指定したフレーム数に到達すると決定ボタンを押さなくても通知は自動で消去されます
,	FRAMEMAX: 180
	// 表示位置 0:左中央, 1:右中央, 2:上中央, 3:下中央, 4:左上, 5:左下, 6:右上, 7:右下, 8:中央
,	BASEPOS: 8
	// 表示位置補正x(正の値で右に, 負の値で左に補正), y(正の値で下に, 負の値で上に補正)
,	POSX: 0
,	POSY: 0
	// 対象(ユニットまたはストック)の名前を描画する場合はtrue, しない場合はfalse
,	DRAWTARGETNAME: true
};

//-------------------------------------------------------------------

// オリジナルイベントコマンドを実装する
var _ScriptExecuteEventCommand__configureOriginalEventCommand = ScriptExecuteEventCommand._configureOriginalEventCommand;
ScriptExecuteEventCommand._configureOriginalEventCommand = function(groupArray) {
	_ScriptExecuteEventCommand__configureOriginalEventCommand.call(this, groupArray);
	
	groupArray.appendObject(OEC_ItemChangeInBulk);
};

// 複数個のアイテムを一括で増減させるイベントコマンド
var OEC_ItemChangeInBulk = defineObject(ItemChangeEventCommand,
{	
	_requestCount: 0,
	_resultCount: 0,
	_isDeleteRemainder: false,
	_isNoticeShow: true,
	
	_prepareEventCommandMemberData: function() {
		var eventCommandData = root.getEventCommandObject();
		var arg = eventCommandData.getEventCommandArgument();
		var content = eventCommandData.getOriginalContent();
		
		this._targetItem = content.getItem();
		this._increaseType = typeof arg.increaseType === 'number' ? arg.increaseType : 0;//IncreaseType.INCREASE;
		if (this._increaseType < 0 || this._increaseType > 1) {
			this._increaseType = IncreaseType.INCREASE;
		}			
		this._isStockChange = typeof arg.isStockChange === 'boolean'? arg.isStockChange : true;
		this._isStockSend = typeof arg.isStockSend === 'boolean'?  arg.isStockSend : true;
		this._itemIndex = 0;
		this._itemArray = null;
		this._itemChangeView = createWindowObject(BulkItemChangeNoticeView, this);
		this._unitItemFull = createObject(BulkUnitItemFull);
		this._stockItemFull = createObject(BulkStockItemFull);
		
		this._targetUnit = this._isStockChange === true ? null : content.getUnit();
		this._requestCount = Math.max(content.getValue(0), 1);
		this._resultCount = this._requestCount;
		
		this._isDeleteRemainder = typeof arg.isDeleteRemainder === 'boolean' ? arg.isDeleteRemainder : false;
		this._isNoticeShow = typeof arg.isNoticeShow === 'boolean' ? arg.isNoticeShow : true;
	},
	
	_checkEventCommand: function() {
		if (this._targetItem === null) {
			return false;
		}
		
		if (!this._isStockChange) {
			if (this._targetUnit === null) {
				// ユニットのアイテムを増減させるにもかかわらず、ユニットが有効でない場合はfalseを返す
				return false;
			}
			
			// 交換禁止の場合は、ユニット増減をストック増減にする
			if (!Miscellaneous.isItemAccess(this._targetUnit)) {
				this._isStockChange = true;
			}
		}
		
		this._itemArray = [];
		
		if (this._isStockChange) {
			this._changeStockItem(this._targetItem, this._increaseType, this._requestCount);
		}
		else {
			// 自軍でない場合はストックに送れない
			if (this._targetUnit.getUnitType() !== UnitType.PLAYER) {
				this._isStockSend = false;
			}
			this._changeUnitItem(this._targetUnit, this._targetItem, this._increaseType, this._isStockSend, this._requestCount);
		}
		
		if (this.isSystemSkipMode() && this._itemArray.length === 0) {
			// アイテムの追加が問題なく終わった場合は、cycleに入らないようにfalseを返す
			return false;
		}
		
		return true;
	},
	
	_completeEventCommandMemberData: function() {
		if (this._increaseType !== IncreaseType.ALLRELEASE) {
			// 増減処理が正常終了した かつ NoticeWindowを表示しない設定 であれば後続処理に移らない
			if (this._itemArray.length === 0 && this._isNoticeShow === false) {
				return EnterResult.NOTENTER;
			}
			this._itemChangeView.setItemChangeData(this._targetItem, this._increaseType, this._resultCount, this._targetUnit);
			this.changeCycleMode(ItemChangeMode.NOTICE);
		}
		else {
			if (!this._checkItemArray()) {
				return EnterResult.NOTENTER;
			}
		}
		
		return EnterResult.OK;
	},
	
	// ストックを対象にしてアイテムを一括で増減させる
	_changeStockItem: function(item, type, count) {
		var i, j, amount, curItem, stockCount, itemArray;
		var isMatch = false;
		
 		if (type === IncreaseType.INCREASE) {
			amount = 0;
			
			for (i = 0; i < count; i++) {
				if (!StockItemControl.isStockItemSpace()) {
					if (this._isDeleteRemainder === false) {
						this._itemArray.push(item);
					}
				}
				else {
					StockItemControl.pushStockItem(item);
					amount++;
				}
			}
			// 指定個数より実際に増加した数が小さければ修正する
			if (this._isDeleteRemainder === true) {
				this._resultCount = Math.min(amount, count);
			}
		}
		else if (type === IncreaseType.DECREASE) {
			StockItemControl.sortItem();
			stockCount = StockItemControl.getStockItemCount();
			amount = 0;
			j = -1;
			
			// ストックに対象アイテムが何個あるかをamountに記録する
			// 最初にヒットしたindexをjに記録する
			for (i = 0; i < stockCount; i++) {
				curItem = StockItemControl.getStockItem(i);
				if (ItemControl.compareItem(curItem, item)) {
					if (isMatch === false) j = i;
					amount++;
					isMatch = true;
				}
				else {
					if (isMatch) break;
				}
			}
			
			// 指定個数より在庫が小さければ修正する
			count = Math.min(amount, count);
			this._resultCount = count;
//			root.log('j' + j + ' count' + count);
			// 配列から指定個数分のアイテムを取り除く
			itemArray = StockItemControl.getStockItemArray();
			
			if (j >= 0 && count > 0) {
				itemArray.splice(j, count);
			}
			
			StockItemControl.sortItem();
		}
	},
	
	// ユニットを対象にしてアイテムを一括で増減させる
	_changeUnitItem: function(unit, item, type, isStockSend, count) {
		var i, amount, curItem, itemCount, arr;

		if (type === IncreaseType.INCREASE) {
			amount = 0;
			
			for (i = 0; i < count; i++) {
				if (!UnitItemControl.isUnitItemSpace(unit)) {
					if (this._isDeleteRemainder === false) {
						this._itemArray.push(item);
					}
				}
				else {
					UnitItemControl.pushItem(unit, item);
					amount++;
				}
			}
			
			if (amount > 0) {
				ItemControl.updatePossessionItem(unit);
			}
			// 指定個数より実際に増加した数が小さければ修正する
			if (this._isDeleteRemainder === true) {
				this._resultCount = Math.min(amount, count);
			}
		}
		else if (type === IncreaseType.DECREASE) {
			itemCount = DataConfig.getMaxUnitItemCount();
			amount = 0;
			arr = [];
			
			for (i = 0; i < itemCount; i++) {
				curItem = UnitItemControl.getItem(unit, i);
				if (ItemControl.compareItem(curItem, item)) {
					curItem = unit.clearItem(i);//UnitItemControl.cutItem(unit, i);だとnullにした位置を詰めてしまうので後で処理する
					amount++;
					
					if (curItem !== null && isStockSend) {
						if (StockItemControl.isStockItemSpace()) {
							StockItemControl.pushStockItem(curItem);
						}
						else {
							arr.push(curItem);
						}
					}
					if (amount >= count) break;
				}
			}
			
			// 所持品の順番を整理して空白を詰める
			UnitItemControl.arrangeItem(unit);
			
			if (amount > 0) {
				ItemControl.updatePossessionItem(unit);
			}
			// 指定個数より所持していた数が小さければ修正する
			count = Math.min(amount, count);
			this._resultCount = count;
			
			this._itemArray = arr;
		}
	},
	
	getEventCommandName: function() {
		return 'OEC_ItemChangeInBulk';
	}
}
);

var BulkItemChangeNoticeView = defineObject(ItemChangeNoticeView,
{
	_targetItem: null,
	_increaseType: null,
	_titlePartsCount: 0,
	_counter: null,
	_itemCount: 0,
	_unit: null,
	
	setItemChangeData: function(item, type, count, unit) {
		this._targetItem = item;
		this._increaseType = type;
		this._itemCount = count;
		this._unit = unit;
		
		this._setTitlePartsCount();
		
		this._playItemGetSound();
		
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(NoticeViewSetting.FRAMEMAX);
		//高速化を受け付けないようにする
		this._counter.disableGameAcceleration();
	},
	
	moveNoticeView: function() {
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		if (InputControl.isSelectAction()) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawNoticeView: function(x, y) {
		var textui = this.getTitleTextUI();
		var pic = textui.getUIImage();
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		var count = this.getTitlePartsCount();
		
		var titleWidth = this.getNoticeViewWidth();
		var titleHeight = this.getNoticeViewHeight();
		var obj = this._getAnimationOffset(NoticeViewSetting.DIRECTION, titleWidth, titleHeight);
		var pos = this._getBasePosition(x, y, titleWidth, titleHeight);

		x = pos.x + NoticeViewSetting.POSX;
		y = pos.y + NoticeViewSetting.POSY;

		TitleRenderer.drawTitle(pic, x + obj.dx, y + obj.dy, width, height, count);
		
		x += this._getNoticeStartX();
		y += this._getNoticeStartY();
		this.drawNoticeViewContent(x + obj.dx, y + obj.dy);
		
		// 増減の対象名を描画する
		if (NoticeViewSetting.DRAWTARGETNAME === true) {
			this.drawTargetName(x + 10 + obj.dx, y - 52 + obj.dy);
		}
	},
	
	_getAnimationOffset: function(direction, width, height) {
		if (!this._counter) {
			return {
				dx: 0,
				dy: 0
			};
		}
		
		var count = this._counter.getCounter();
		var remain = NoticeViewSetting.FRAMEMAX - count;
		var interval = Math.max(1, NoticeViewSetting.INTERVAL);

		if (count < interval) {
			return this._getDirectionOffset(
				direction,
				width,
				height,
				count / interval - 1
			);
		}

		if (remain < interval) {
			return this._getDirectionOffset(
				direction,
				width,
				height,
				remain / interval - 1
			);
		}

		return {
			dx: 0,
			dy: 0
		};
	},
	
	_getDirectionOffset: function(direction, width, height, rate) {
		var dx = Math.ceil(width * rate);
		var dy = Math.ceil(height * rate);

		switch (direction) {
			case 0:
				return { dx: dx, dy: 0 };

			case 1:
				return { dx: -dx, dy: 0 };

			case 2:
				return { dx: 0, dy: dy };

			case 3:
				return { dx: 0, dy: -dy };

			case 4:
				return { dx: dx, dy: dy };

			case 5:
				return { dx: dx, dy: -dy };

			case 6:
				return { dx: -dx, dy: dy };

			case 7:
				return { dx: -dx, dy: -dy };

			case 8:
				return { dx: 0, dy: 0 };
		}

		return { dx: dx, dy: 0 };
	},
	
	_getBasePosition: function(x, y, width, height) {
		var xPadding = DefineControl.getWindowXPadding();
		var yPadding = DefineControl.getWindowYPadding();

		switch (NoticeViewSetting.BASEPOS) {
			case 0:
				x = xPadding;
				break;
			case 1:
				x = root.getGameAreaWidth() - width - xPadding;
				break;
			case 2:
				y = yPadding;
				break;
			case 3:
				y = root.getGameAreaHeight() - height - yPadding;
				break;
			case 4:
				x = xPadding;
				y = yPadding;
				break;
			case 5:
				x = xPadding;
				y = root.getGameAreaHeight() - height - yPadding;
				break;
			case 6:
				x = root.getGameAreaWidth() - width - xPadding;
				y = yPadding;
				break;
			case 7:
				x = root.getGameAreaWidth() - width - xPadding;
				y = root.getGameAreaHeight() - height - yPadding;
				break;
		}

		return {
			x: x,
			y: y
		};
	},
	
	// 増減させたアイテムの名前と個数を表示する処理
	drawNoticeViewContent: function(x, y) {
		var textui = this.getTitleTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var text = this._increaseType === IncreaseType.INCREASE ? NoticeViewSetting.GETITEM :  NoticeViewSetting.LOSTITEM;
		var infoColor = this._increaseType === IncreaseType.INCREASE ? ColorValue.KEYWORD : ColorValue.INFO;
		var width = TextRenderer.getTextWidth(text, font) + 5;
		var dy = 0;
		var iconWidth = GraphicsFormat.ICON_WIDTH;
		
		TextRenderer.drawKeywordText(x, y, text, -1, infoColor, font);
		ItemRenderer.drawItem(x + width, y + dy, this._targetItem, color, font, false);
		
		width += iconWidth;
		width += TextRenderer.getTextWidth(this._targetItem.getName(), font);
		width += 10;
		TextRenderer.drawSignText(x + width, y + dy, '×');
		NumberRenderer.drawAttackNumber(x + width + 15, y + dy, this._itemCount);
	},
	
	//取得者名を描画する(ゲストのアイテム増減を許可しない時はストック表示)
	drawTargetName: function(x, y) {
		var textui = root.queryTextUI('objective_title');
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var text = root.queryCommand('stock_unitcommand');
		if (this._unit !== null && Miscellaneous.isItemAccess(this._unit) ) {
			text = this._unit.getName();
		}
		var count = TitleRenderer.getTitlePartsCount(text, font);
	
		TextRenderer.drawFixedTitleText(x, y, text, color, font, TextFormat.CENTER, pic, count);
	},
	
	// タイトル画像を取得する 
	// 変更したい場合はリソース使用箇所>テキストUIから任意のデータを選び内部名を指定する(''で括る)
	getTitleTextUI: function() {
		return root.queryTextUI('select_title');
	},
	
	_setTitlePartsCount: function() {
		var font = this.getTitleTextUI().getFont();
		var basePadding = 120;
		var textWidth = TextRenderer.getTextWidth(this._targetItem.getName(), font) + basePadding + (TitleRenderer.getTitlePartsWidth() * 2);
		
		this._titlePartsCount = Math.floor(textWidth / TitleRenderer.getTitlePartsWidth());
	},
	
	_playItemGetSound: function() {
		if (this._increaseType === IncreaseType.INCREASE) {
			MediaControl.soundDirect('itemget');
		}
		else if (this._increaseType === IncreaseType.DECREASE) {
			MediaControl.soundDirect('itemlost');
		}
	},
	
	_getNoticeStartX: function() {
		return 20;
	},
	
	_getNoticeStartY: function() {
		return 18;
	}
}
);


var BulkUnitItemFull = defineObject(UnitItemFull,
{
	_moveTradeQuestion: function() {
		var result = UnitItemFull._moveTradeQuestion.call(this);
		if (result === MoveResult.END) {
			this._itemListWindow.enableSelectCursor(true);
			this.changeCycleMode(UnitItemFullMode.TOP);
		}
		return result;
	},
	
	_moveStockQuestion: function() {
		var result = UnitItemFull._moveStockQuestion.call(this);
		if (result === MoveResult.END) {
			this._itemListWindow.enableSelectCursor(true);
			this.changeCycleMode(UnitItemFullMode.TOP);
		}
		return result;
	}
}
);


var BulkStockItemFull = defineObject(StockItemFull,
{
	_moveTradeQuestion: function() {
		var result = StockItemFull._moveTradeQuestion.call(this);
		if (result === MoveResult.END) {
			this._itemListWindow.enableSelectCursor(true);
			this.changeCycleMode(StockItemFullMode.TOP);
		}
		return result;
	},
	_moveThrowQuestion: function() {
		var result = StockItemFull._moveThrowQuestion.call(this);
		if (result === MoveResult.END) {
			this._itemListWindow.enableSelectCursor(true);
			this.changeCycleMode(StockItemFullMode.TOP);
		}
		return result;
	}
}
);


})();
