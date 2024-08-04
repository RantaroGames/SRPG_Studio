/*
■ファイル
Fnc_RestAreaControl.js

■SRPG Studio対応バージョン:1.300

■プラグインの概要
拠点シーンのエリアを任意のデータに変更します

通常、拠点エリアの選定はRestSceneに入る際にのみ実行されますが、拠点内でイベントコマンドを通じてエリアを変更します

■使用方法
1. このファイルをpluginフォルダに入れる

2. 変更用の拠点エリアを作成する
※通常使用する拠点と競合しないように条件設定をしてください

3. エリア変更イベントを作成する
3.1. 事前に変更用の拠点エリアに合わせた表示条件を成立させておく
3.2. 拠点のイベントで<スクリプトの実行>を作成して・コード実行を選択し、コード欄に以下のメソッドを記述する

Fnc_RestAreaControl.setRestArea();


※仕様
・コードを実行すると即座に背景が変更されます
イベントコマンド<画面効果>を使用して疑似的なトランジション効果を発生させることで画像変更が滑らかなものになります

・変更後の拠点エリアに設定しているBGMが、変更前と異なっていた場合BGMも切り替わります

■作成者
ran

■更新履歴
2024/08/04 新規作成

*/


var Fnc_RestAreaControl = {
	setRestArea: function() {
		if (this._checkScene() === false) return;

		var area = root.getRestPreference().getActiveRestArea();
		
		if (area !== null) {
			SceneManager.getActiveScene()._scrollBackground.startScrollBackground(area.getBackgroundImage());
			this._playSetupMusic(area);
		}
		else {
			root.msg('ERROR: 条件が成立する拠点エリアがありません');
		}
	},

	_checkScene: function() {
		var scene = root.getBaseScene();
		if (scene !== SceneType.REST) {
			root.msg('Fnc_RestAreaControl.setRestArea: 拠点シーン以外での呼出しは無効');
			return false;
		}
		
		return true;
	},
	
	_playSetupMusic: function(area) {
		var handle = area.getMusicHandle();
		var handleActive = root.getMediaManager().getActiveMusicHandle();
		
		if (!handle.isEqualHandle(handleActive)) {
			MediaControl.clearMusicCache();
			MediaControl.musicPlayNew(handle);
		}
	}
};
