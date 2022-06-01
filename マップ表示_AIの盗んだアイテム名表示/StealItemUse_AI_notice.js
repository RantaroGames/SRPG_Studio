/*
■ファイル
StealItemUse_AI_notice.js

■SRPG Studio対応バージョン:1.248

■プラグインの概要
AIが盗むアイテム使用した時、盗んだ品物の名前を表示します
（AIがスキルで品物を盗んだ場合と同様の表示を出します）

■使用方法
このファイルをpluginフォルダに入れる

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

*/

(function() {
//--------------------------------------------------------------------^
// 「'を奪われました'」を'任意の文字'(''で文字を囲むこと)にすると表記を変えることができる
//---------------------------------------------------------------------
StringTable.ItemSteal　= 'を奪われました';

//---------------------------------------------------------------------------
// AIが盗むアイテム使用した時、盗んだ品物の名前を表示する(メッセージタイトルで画面中央に表示)
//---------------------------------------------------------------------------
var _StealItemUse_mainAction = StealItemUse.mainAction;
StealItemUse.mainAction = function() {
	var result = _StealItemUse_mainAction.call(this);
	var itemTargetInfo = this._itemUseParent.getItemTargetInfo();
	
	// 「itemTargetInfo.targetItemがnullではない」＝AIのアイテム使用で盗む品が指定されている場合
	if (itemTargetInfo.targetItem !== null) {
		var generator = root.getEventGenerator();
		
		// (「アイテム名」 + を奪われました, x, y, center表示)
		generator.messageTitle(itemTargetInfo.targetItem.getName() +  StringTable.ItemSteal, 0, 0, true);
		generator.execute();
	}
	
	return result;
};

})();