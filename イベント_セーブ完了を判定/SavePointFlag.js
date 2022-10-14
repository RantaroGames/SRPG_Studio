/*
■ファイル
SavePointFlag.js

■SRPG Studio対応バージョン:1.269

■プラグインの概要
マップ上にセーブポイントを設定しているゲームで
セーブ画面が開かれた後にキャンセルした（セーブせずにセーブ画面を閉じた）時、再びセーブポイントを踏んでもセーブ画面が開かれない問題に対応します。
(一度しかセーブポイントのイベントを発生させない設定にしている場合に、この問題に直面しやすいようです)

※注意点※
マップコマンドでのセーブが可能になっている場合は本プラグインは正しく動作しません。
本プラグインは、マップコマンドでのセーブを許可せず、マップ上の場所イベント等で一度だけセーブを許可するようにデザインされたゲームでの使用を想定しています。

■使用方法
1.このファイルをpluginフォルダに入れる
2.下記コード内の変数「GlobalSwitch_ID」に数値（＝画像表示を制御するためのグローバルスイッチid)を設定する
3.セーブポイント用(セーブ画面の呼出し)イベントを作成する
3-1.イベントの実行条件に「対応するグローバルスイッチ:OFF」を設定する
3-2．イベントを〈イベントの状態変更〉で「実行済み解除」を設定しておく(※)
※注意点：「実行済み解除」は、〈セーブ画面の呼出し〉コマンドより前の時点に設定してください(後にすると実行済みが解除されていない状態でセーブされます)

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2022/10/14 新規作成

*/

(function() {

// セーブ完了を記録するグローバルスイッチのid
// idの指定が不正の場合、エディタのリスト上で一番上(index0)のスイッチが判定対象になります（isSwitchOn（index）関数の仕様である模様）
var GlobalSwitch_ID = 0;


function fnc_setGlobalSwitch(value)
{
	var table = root.getMetaSession().getGlobalSwitchTable();
	var index = table.getSwitchIndexFromId(GlobalSwitch_ID);
	
	table.setSwitch(index, value);	
}

// 戦闘準備画面に入る際にグローバルスイッチをオフ(false)にしておく
var _BattleSetupScene_setSceneData = BattleSetupScene.setSceneData;
BattleSetupScene.setSceneData = function() {
	_BattleSetupScene_setSceneData.call(this);
	
	fnc_setGlobalSwitch(false);
};

// セーブ画面で実際にセーブする場合、グローバルスイッチをオン(true)にした状態でセーブする
var _LoadSaveScreen__executeSave = LoadSaveScreen._executeSave;
LoadSaveScreen._executeSave = function() {
	fnc_setGlobalSwitch(true);

	_LoadSaveScreen__executeSave.call(this);
};

})();
