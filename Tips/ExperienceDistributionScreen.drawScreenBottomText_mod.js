(function() {

ExperienceDistributionScreen.drawScreenBottomText = function(textui) {
	var mode = this.getCycleMode();
	var text = '';
	
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

		// ↓2行のコメントを外すとコンフィグ2の経験値配分レートの値を取得してヘルプに表示する（↓で1行にまとめた箇所をコメントアウトすること）
//		var rate = this._bonusInputWindow._getRate();
//		text = '(1exp = ' + rate + 'BP) ↑↓：経験値増減 ｚ：決定 ｘ:キャンセル';

		// レートも直書きで記述するなら、こんな感じで
		text = '（1exp = 10BP） ↑↓：経験値増減 ｚ：決定 ｘ:キャンセル'
	}
	
	TextRenderer.drawScreenBottomText(text, textui);
};

})();

/*

20、23行目のtext=の文字列を変更する
（※5行目、9行目のtext部分は、いじらない様に）

名前未定（）さんの「ヘルプ文字二段.js」を導入している場合
\(バックスラッシュ）は、\\のように2つ書くこと

*/