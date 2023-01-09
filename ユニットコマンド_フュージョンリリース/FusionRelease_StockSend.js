/*

■ファイル名
FusionRelease_StockSend.js

■SRPG Studio対応バージョン
ver.1.275

■プラグインの概要
フュージョン攻撃で捕らえているユニット(子)を解放する際、子の所持品を直接ストックへ送る(※)
(通常、「交換」コマンドを通じてユニット間でアイテムを移動させる工程を省くことができる)

※リリース後の処理が「消去」になっているフュージョンでキャッチしたユニットのみ

ストックへ送らずに使いたいアイテムがある場合は、解放前に「交換」コマンドを通じてアイテムを取得しておくと良い

■使用方法
1.このプラグインをpluginフォルダに入れる
2.強制的にストックへ送らないアイテムやユニットを作成したい場合
  アイテム(武器)、武器タイプまたはユニットのカスタムパラメータに以下を記述する
{
  forceStockSend: false
}

※ストック送りするアイテムの基準
交換禁止アイテムは送らない
カスタムパラメータに{ forceStockSend: false　}があるアイテム（ユニット）は送らない

下記コード内
UnitCommand.FusionRelease._checkSendableItemでストック送りするか否かの判定を行っている

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2023/01/09 新規作成

*/

(function() {

var alias_addFusionEvent = UnitCommand.FusionRelease._addFusionEvent;
UnitCommand.FusionRelease._addFusionEvent = function(generator) {
	var unit = this.getCommandTarget();
	
	// フュージョン解放で「消去」する際、子ユニットの所持品をストックへ送る
	if (unit.getUnitType() === UnitType.PLAYER &&
		this._fusionData.getFusionReleaseType() === FusionReleaseType.ERASE
	) {
		this._forceStockSend(unit, generator);
	}
	
	// 本来のリリース処理
	alias_addFusionEvent.call(this, generator);
};

UnitCommand.FusionRelease._forceStockSend = function(unit, generator) {
	var child = FusionControl.getFusionChild(unit);
	var item, index, count;
	var isSkipMode = false; //　ストックへ送るアイテムを表示しない場合はtrue
	
	// 子とアイテム交換できない場合
	if (this._isFusionTradable(unit, child) === false) {
		return;
	}
	
	count = UnitItemControl.getPossessionItemCount(child);
	//root.log(child.getName() + ':' + count);
	for (index = 0; index < count; index++) {
//		if (StockItemControl.isStockItemSpace() === false) break;
		item = child.getItem(index);
		if (this._checkSendableItem(item) === true) {
			//root.log(item.getName());
			generator.stockItemChange(item, IncreaseType.INCREASE, isSkipMode);
			
			// 消去するユニットを再度、登場させる場合に備えて奪ったアイテムを削除する
			child.clearItem(index);
		}
	}
	
	// アイテム削除した可能性があるので子の所持品を並び替えておく
	UnitItemControl.arrangeItem(child);	
};


UnitCommand.FusionRelease._isFusionTradable = function(unit, child) {
	// フュージョンデータでアイテム交換を許可していない
	if (!FusionControl.isItemTradable(unit)) return false;
	
	// 子が存在しない
	if (child === null) return false;
	
	// 子が敵勢力ではない
	if (child.getUnitType() !== UnitType.ENEMY) return false;
	
	// 子ユニットのカスタムパラメータでストック送りを許可しない( {forceStockSend: false} )
	if (child.custom.forceStockSend === false) {
//		root.log('強制ストック送りを許可していないユニット');
		return false;
	}
	
	return true;
};
	
// ストック送りするアイテム(武器)を判定する
UnitCommand.FusionRelease._checkSendableItem = function(item) {
	if (item === null) return false;

	// 武器タイプのカスタムパラメータでストック送りをしない設定( {forceStockSend: false} )
	if (item.getWeaponType().custom.forceStockSend === false) return false;
	
	// 交換禁止アイテムは送らない
	if (item.isTradeDisabled()) return false;
	
	// 重要アイテムは送らない
//	if (item.isImportance()) return false;

	// カスタムパラメータでストック送りしない設定( {forceStockSend: false} )
	if (item.custom.forceStockSend === false) return false;
	
	return true;
};

})();
