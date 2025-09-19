(function() {

ExperienceDistributionScreen.drawScreenBottomText = function(textui) {
	var mode = this.getCycleMode();
	var text = '';
	var rate;
	
	if (this._itemUserWindow.getSkillInteraction().isInteraction()) {
		// スキル選択時はスキルの説明が表示される
		text = this._itemUserWindow.getSkillInteraction().getHelpText();
	}
	else if (mode === ExperienceDistributionScreenMode.TOP) {
		// ユニット選択時のヘルプ用テキスト
		text = '↑↓：ユニット変更 ｚ：決定 ｘ:キャンセル';		
	}
	else if (mode === ExperienceDistributionScreenMode.INPUT) {
		// 経験値増減時のヘルプ

		// コンフィグ2の経験値配分レートの値を取得する
		rate = this._bonusInputWindow._getRate();
		text = '(1exp = ' + rate + 'BP) ';
		text += '↑↓：経験値増減 ｚ：決定 ｘ:キャンセル';

		// レートも直書きで記述するなら、こんな感じで (上3行をコメントアウトして下1行のコメントを外す)
//		text = '（1exp = 10BP） ↑↓：経験値増減 ｚ：決定 ｘ:キャンセル'
		
		TextRenderer.drawScreenBottomText(text, textui);
	}
	
	TextRenderer.drawScreenBottomText(text, textui);
};

})();

/*

名前未定（）さんの「ヘルプ文字二段.js」を導入している場合
\(バックスラッシュ）は、\\のように2つ書くこと

*/