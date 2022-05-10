/*
■ファイル名
playMapVictory_mod.js

■SRPG Studio対応バージョン
ver.1.258

■プラグインの概要
マップクリア時に流れるＳＥを任意のものに変更します。

（通常のクリア時ＳＥに設定していた陽気なサウンドが、悲愴なシナリオのエンドに流れるのを防いだりできます）

■使用方法
1.このプラグインをpluginフォルダに入れる
2．マップのカスタムパラメータに以下の値を設定する

{
  MapVictorySound: {isRuntime: true, soundId: 226}
}

@ isRuntime: {boolean} ランタイムのサウンドを使用する場合はtrue, オリジナルの場合はfalse
@ soundId: {number} SEのリソースID
  soundidは、エディタのリソース>音楽データの確認>soundで参照できます。
  リソースが存在しないidを指定した場合、SEは鳴りません。


■マップクリア時の画像とＳＥの実行条件について
以下の条件を満たしている場合にマップクリア時にMAP CLEAR! というロゴを表示してＳＥを鳴らします。

MapVictoryFlowEntry._isDisplayable()のコメントから引用
// トロフィーが1つでもプールされている場合は、実際に入手する(※)
// ゲームオプションで有効にされており、さらに「マップクリア」で有効にされているかどうか

※ トロフィーを入手する場合、マップクリアで「クリア画像を表示する」にチェックを入れていなくてもロゴが表示されます。

・ロゴの変更方法
リソース>リソース使用箇所>UI>マップクリア


■作成者
ran

■更新履歴
2022/05/10 新規作成

*/

(function() {


// クリア時のジングルを任意に変更
var _MapVictoryFlowEntry__playMapVictory = MapVictoryFlowEntry._playMapVictory;
MapVictoryFlowEntry._playMapVictory = function() {
	var mapInfo = root.getCurrentSession().getCurrentMapInfo();
	var mapVictorySound = mapInfo.custom.MapVictorySound;
	var handle = null;
	var isRuntime, soundId;
	
	if (typeof mapVictorySound !== 'undefined' &&
		typeof mapVictorySound.isRuntime === 'boolean' &&
		typeof mapVictorySound.soundId === 'number') 
	{
		isRuntime = mapVictorySound.isRuntime;
		soundId = mapVictorySound.soundId;
		handle = root.createResourceHandle(isRuntime, soundId, 0, 0, 0);
	}
	
	if (handle !== null) {
		MediaControl.soundPlay(handle);
	}
	else {
		//MediaControl.soundDirect('mapvictory'); // 本来の処理
		_MapVictoryFlowEntry__playMapVictory.call(this);
	}
};

})();
