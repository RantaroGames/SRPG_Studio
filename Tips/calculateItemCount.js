/*
■ファイル
calculateItemCount.js

■SRPG Studio対応バージョン:1.288

■プラグインの概要
ストックにある特定のアイテム(武器)の総和を求めて指定した変数で受け取ります。

ユニットや自軍全体の所持品にあるアイテム総和を求めるメソッドもあります。

■使用方法
1.このファイルをpluginフォルダに入れる

2.イベントコマンド<スクリプトの実行>を設定する

2-1.タブ「スクリプト」の設定
(種類 ・コード実行) を選択して以下のメソッドを記述する

// ストックにあるアイテムの総和を求めたい
CalculateItemCount.stockItem();

// ユニットの所持品にあるアイテムの総和を求めたい
CalculateItemCount.unitItem();

※タブ「オリジナルデータ」でユニットを指定すること

// 出撃ユニット全員の所持品にあるアイテムの総和を求めたい
CalculateItemCount.unitList(true);

// 自軍ユニット全員(生存している者)の所持品にあるアイテムの総和を求めたい
CalculateItemCount.unitList(false);


2-2.「戻り値を変数で受け取る」にチェックを入れて任意の変数を指定する
※制御文字（\va1[1]）を用いることでメッセージなどで取得した数値を表示することができます

2-3.タブ「オリジナルデータ」でアイテムを指定する


■作成者
ran

■更新履歴
2024/01/05 新規作成

*/

var CalculateItemCount = {
	stockItem: function() {
		var content = root.getEventCommandObject().getOriginalContent();
		var targetItem = content.getItem();
		var i, item;
		var count = StockItemControl.getStockItemCount();
		var stockCount = 0;
		
		for (i = 0; i < count; i++) {
			item = StockItemControl.getStockItem(i);
			if (item === null) continue;
			
			if (ItemControl.compareItem(item, targetItem)) {
				stockCount++;
			}
		}
	
		return stockCount;
	},
	
	unitList: function(isSotie) {
		var content = root.getEventCommandObject().getOriginalContent();
		var targetItem = content.getItem();
		var unit, unitList, listcount, i;
		var itemCount = 0;
		
		//出撃(状態のみ判定)リストを取得 or 生存ユニットリスト
		if (isSotie) {
			unitList = PlayerList.getSortieOnlyList();
		} else {
			unitList = PlayerList.getAliveDefaultList();//PlayerList.getMainList();
		}
		
		listcount = unitList.getCount();
	
		for (i = 0; i < listcount; i++) {
			unit = unitList.getData(i);
			if (unit === null) continue;
			
			itemCount += this._sumItems(unit, targetItem);
		}
		
		return itemCount;
	},
	
	unitItem: function() {
		var content = root.getEventCommandObject().getOriginalContent();
		var unit = content.getUnit();
		var targetItem = content.getItem();
		var itemCount = 0;
		
		if (unit === null) return 0;
		
		itemCount = this._sumItems(unit, targetItem);
		
		return itemCount;
	},
	
	_sumItems: function(unit, targetItem) {
		var i, item, count;
		var itemCount = 0;
		var count = UnitItemControl.getPossessionItemCount(unit);
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (item === null) continue;
			
			if (ItemControl.compareItem(item, targetItem)) {
				itemCount++;
			}
		}
		
		return itemCount;
	}
};
