/*
■ファイル
RequiredSotieUnitCount.js

■SRPG Studio対応バージョン:1.257

■プラグインの概要
mapに最低出撃人数を設定します

■使用方法
1.このファイルをpluginフォルダに入れる
2.mapのカスタムパラメータに最低出撃数を設定する

{
  requiredSotieCount: 2以上の整数値(※)
}

(※)元の処理において最低でも1体はユニットを出撃選択していないとマップは開始できない
mapの最大出撃数を超える値を設定した場合は、最大出撃数を採用する

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2022/04/22 新規作成

*/

(function() {

// 最低出撃人数をmap毎に設定する
var _BattleSetupScene_endBattleSetup = BattleSetupScene.endBattleSetup;
BattleSetupScene.endBattleSetup = function() {
	// 本来の処理では、PlayerListの出撃メンバーが0の時は出撃開始が許可されない
	_BattleSetupScene_endBattleSetup.call(this);

	if (!this._isSetupFinal) return;
	
	var count = this.getRequiredSotieCount();
	if (count === 0) return;

	if (PlayerList.getSortieList().getCount() > count - 1) {
		this._isSetupFinal = true;
	}
	else {
		this._isSetupFinal = false;
	}
};

// mapのカスタムパラメータに必要出撃人数を設定しておく
BattleSetupScene.getRequiredSotieCount = function() {
	var session = root.getCurrentSession();
	if (session === null) return 0;
	
	var mapInfo = session.getCurrentMapInfo();
	if (mapInfo === null) return 0;
	
	var requiredSotieCount = mapInfo.custom.requiredSotieCount;
	if (typeof requiredSotieCount === 'number' && requiredSotieCount > 1) {
		if (requiredSotieCount > SortieSetting.getDefaultSortieMaxCount()) {
			requiredSotieCount = SortieSetting.getDefaultSortieMaxCount();
		}
			
		return requiredSotieCount;
	}
	return 0;
};


StringTable.UnitSortie_Max = '出撃数 / 最大出撃数'; //'ユニットの最大出撃数';

// 出撃選択画面の下部に表示される文字列
UnitSortieScreen._drawSortieText = function(textui) {
	var text = StringTable.UnitSortie_Max;
	var color = textui.getColor();
	var font = textui.getFont();
	var pic = textui.getUIImage();
	var x = LayoutControl.getCenterX(-1, UIFormat.SCREENFRAME_WIDTH);
	var y = root.getGameAreaHeight() - 48;
	var textWidth = TextRenderer.getTextWidth(text, font);
	var space = 25;
	var memberWidth = 55 + 90;// 文字列の配置が気になる場合はこの値を変更してください。55は元処理の値 90は追加分
	var width = UIFormat.SCREENFRAME_WIDTH - textWidth - (memberWidth + space);
	var dx = Math.floor(width / 2);
	
	if (pic !== null) {
		pic.draw(x, root.getGameAreaHeight() - UIFormat.SCREENFRAME_HEIGHT);
	}
	
	TextRenderer.drawKeywordText(x + dx, y, text, -1, color, font);
	this._drawMemberData(x + dx + textWidth + space, y, textui);
	
	// 文字列の配置が気になる場合は、下の値(40)を変更してください
	this._drawRequiredSotieCount(x + dx + textWidth + space + 40, y, textui);
};

// 最低出撃数を表示する処理
UnitSortieScreen._drawRequiredSotieCount = function(x, y, textui) {
	var text = '最低出撃数 ';
	var color = textui.getColor();
	var font = textui.getFont();
	var dx = DefineControl.getNumberSpace();
	var count = BattleSetupScene.getRequiredSotieCount();
	if (count < 1) count = 1;
	
	x += dx * 2;
	TextRenderer.drawKeywordText(x, y, text, -1, color, font);
	x += TextRenderer.getTextWidth(text, font);
	NumberRenderer.drawNumberColor(x + dx, y, count, 3, 255);
};


})();
