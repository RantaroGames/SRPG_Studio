/*
■ファイル
TextLongSkillProjector.js

■SRPG Studio対応バージョン:1.269

■プラグインの概要
リアル戦闘でスキル発動時にスキル名を描画する処理において長いスキル名が画面から見切れないように描画します。
(簡易戦闘でのスキル表示はSRPG Studio本体のスクリプト処理に準じます)

・リアル戦闘におけるスキル表示で使用されるフォントの設定は以下の個所になります
リソース>リソース使用箇所>テキストUI>スキル見出し

・(簡易戦闘でのスキル表示で使用するフォントの取得先)
リソース>リソース使用箇所>テキストUI>自軍(敵軍/同盟軍)ウィンドウ

・スキルや武器、アイテム名で入力可能な文字数の変更
ツール>オプション>サイズ>データ名の文字数

■使用方法
1.このファイルをpluginフォルダに入れる

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2022/10/17 新規作成

*/


(function() {

// スキル名を表示する関数（オーバーライド）
TextCustomEffect._drawArea = function(active, passive, skillArray, isRight) {
	var x, y, pos, width, max;
	
	if (this._battleType === BattleType.REAL) {	
		pos = this._battleObject.getEffectPosFromUnit(null, active);
		x = pos.x;
		y = pos.y - 40;
		
		// テキストUIの表示位置を左に60ずらして長いスキル名でも見切れずに描画させる
		// フォントや文字サイズにもよるが、10文字程度のスキル名ならばこの部分の変更だけで一行で表示できるようになる
		width = this._getWidth()　+ 60;
		max = RealBattleArea.WIDTH;
		if (x + width > max) {
			x = max - width;
		}
		else if (x < 0) {
			x = 0;
		}
		
		// リアル戦闘でのスキル表示を独自の関数に置き換える
		this._drawAreaTitleCustom(x, y, skillArray, active, isRight);
	}
	else {
		if (isRight) {
			y = Miscellaneous.getDyamicWindowY(active, passive, 145);
			x = LayoutControl.getCenterX(-1, this._getWidth() * 2);
		}
		else {
			y = Miscellaneous.getDyamicWindowY(passive, active, 145);
			x = LayoutControl.getCenterX(-1, this._getWidth() * 2) + this._getWidth();
		}
			
		if (y < Math.floor(root.getGameAreaHeight() / 2)) {
			y += 98;
		}
		else {
			y -= this._getHeight(skillArray);
		}
		
		this._drawAreaWindow(x, y, skillArray, active, isRight);
	}
};

// スキル名を指定範囲内に描画する関数
TextCustomEffect._drawAreaTitleCustom = function(x, y, skillArray, unit, isRight) {
	var i;
	var count = skillArray.length;
	var textui = root.queryTextUI('skill_title');
	var color = textui.getColor();
	var font = textui.getFont();
	var pic = textui.getUIImage();
	var width = TitleRenderer.getTitlePartsWidth();
	var height = TitleRenderer.getTitlePartsHeight();
	
	for (i = 0; i < count; i++) {
		TitleRenderer.drawTitleNoCache(pic, x, y, width, height, this._getTitlePartsCount(skillArray[i], font));
		//SkillRenderer.drawSkill(x + 42, y + 18, skillArray[i], color, font);
		
		// スキル名を指定した範囲内に描画する処理
		SkillRenderer.drawRangeSkill(x + 32, y + 18, skillArray[i], color, font);
		y += 40;
	}
};

// テキストUIの描画長さを取得する関数(オーバーライド)
TextCustomEffect._getTitlePartsCount = function(skill, font) {
	var titlePartsWidth = 30; // TitleRenderer.getTitlePartsWidth();// 90/3=30
	var textWidth = TextRenderer.getTextWidth(skill.getName(), font) + (titlePartsWidth * 2);
	var titleWidth = this._getWidth(); // 190;
	
	if (textWidth > titleWidth) textWidth = titleWidth;
	
	var count = Math.floor(textWidth / titlePartsWidth);
	
	return count > 4 ? count : 4;
};
		
SkillRenderer.drawRangeSkill = function(x, y, skill, color, font) {
	var range = createRangeObject();
	var handle = skill.getIconResourceHandle();
	var skillName = skill.getName();
//	var textWidth = TextRenderer.getTextWidth(skillName, font);
//	root.log(textWidth);

	range.x = x + GraphicsFormat.ICON_WIDTH + 3;
	range.y = y;
	range.width = 170; // スキル名を描画する範囲の長さ(フォントと文字サイズにもよるが160~190で、9~10文字を一行で表示可能)
	range.height = GraphicsFormat.ICON_HEIGHT;// TitleRenderer.getTitlePartsHeight();
	
	TextRenderer.drawRangeText(range, TextFormat.LEFT, skillName, -1, color, font);
	
	GraphicsRenderer.drawImage(x, y, handle, GraphicsType.ICON);
};

})();