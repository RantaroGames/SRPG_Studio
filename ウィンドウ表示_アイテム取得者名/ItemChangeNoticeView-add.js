/*------------------------------------------------
【ファイル名】:ItemChangeNoticeView-add(test).js
【作成者】:ran
【SRPG Studio対応ver】:1.080
【動作内容】
・[アイテム増減]イベント時(*1)にアイテム取得者の名前を表示
  *1：イベントコマンド,場所イベント(村や宝箱),ドロップアイテム取得など
	
【利用規約】
・SRPG Studio以外のツールでの使用禁止
・SRPG Studioの規約に準じます
・有償、無償問わずに利用可
・改変可
・再配布可、転載可
・クレジット記載不要

【免責】
・本スクリプトによって発生したいかなる問題に対しても、一切の責任を負わないものとします
・全て自己責任でご利用ください

【履歴】
 2016/06/11 新規作成
--------------------------------------------------*/
(function() {

var alias1 = ItemChangeNoticeView.drawNoticeViewContent;
ItemChangeNoticeView.drawNoticeViewContent = function (x, y) {
	var text, textui, color, font,  pic, targetUnit;
	
	//増減アイテム描画
	alias1.call(this, x, y);
	
	//取得者名描画(ゲストのアイテム増減を許可しない時はストック表示)
	targetUnit = root.getEventCommandObject().getTargetUnit();
	text = root.queryCommand('stock_unitcommand');
	
	if (targetUnit !== null && Miscellaneous.isItemAccess(targetUnit) ) {
		text = targetUnit.getName();
	}
	
	textui = root.queryTextUI('objective_title');
	color = textui.getColor();
	font = textui.getFont();
	pic = textui.getUIImage();
	
	x -= 20;
	y -= 50;
	TextRenderer.drawTitleText(x, y, text, color, font, TextFormat.CENTER, pic);
	
};

})();
