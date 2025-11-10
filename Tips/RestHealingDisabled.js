/*
■ファイル名
RestHealingDisabled.js

■SRPG Studio対応バージョン
ver.1.317

■プラグインの概要
拠点に入った際に自軍のHPの値を引き継ぐ（回復させない）ようにします。

本来は、「戦闘準備画面に入った際に自軍を回復する」のチェックを外している場合でも拠点を経由するとHPが回復しますが
この仕様を回避したい場合に導入してください。

■使用方法
1．このファイルをpluginフォルダに入れる
2．エディタのデータ設定>コンフィグ>オプション>「戦闘準備画面に入った際に自軍を回復する」のチェックを外す
3．拠点でHP回復を許可するグローバルスイッチを作成する
4.本プラグイン内に3で作成したグローバルスイッチのIDを記述する（51行目）
5．3で作成したグローバルスイッチをオフにする
(※グローバルスイッチIDが不正の場合、index：0（リスト1番目）のスイッチの状態で判別されてしまうので注意）

■自軍回復の場合分け
・「戦闘準備画面に入った際に自軍を回復する」のチェックあり
>マップクリア時：回復あり, 拠点；回復あり

・「戦闘準備画面に入った際に自軍を回復する」のチェックなし＋グローバルスイッチON
>マップクリア時：回復なし, 拠点；回復あり

・「戦闘準備画面に入った際に自軍を回復する」のチェックなし＋グローバルスイッチOFF
>マップクリア時：回復なし, 拠点；回復なし

■負傷ユニットに関するSRPG Studioの仕様
難易度設定で「負傷許可」にチェックしている場合、戦闘でHPが0になったユニットは「負傷」状態(AliveType.INJURY)となります。

マップをクリアすることで「負傷」状態は解除されて「生存」状態（AliveType.ALIVE）に戻りますが
この時、ユニットはHP0(ChronicInjuryHp.ZERO)として扱われ、ユニットリストには表示されますが出撃はできないようになります。

そのため負傷ユニットを出撃できる状態に戻すには、別途イベントコマンドなどで該当ユニットのHPを1以上にする必要があります。

■作成者
ran

■更新履歴
2025/11/10 新規作成

*/

(function() {

// 拠点でHPを回復させる場合にONにするグローバルスイッチのID(数値)
var GLOBALSWITCH_ID = 0;

var alias01 = BattleResultSaveFlowEntry._recoveryPlayerList;
BattleResultSaveFlowEntry._recoveryPlayerList = function() {
	var switchTable = root.getMetaSession().getGlobalSwitchTable();
	var index = switchTable.getSwitchIndexFromId(GLOBALSWITCH_ID);
	
	// データ設定>コンフィグ>オプション「戦闘準備画面に入った際に自軍を回復する」がオフ、かつ特定のグローバルスイッチがオフなら拠点を経由しても自軍を回復させない
	if (DataConfig.isBattleSetupRecoverable() === false && switchTable.isSwitchOn(index) === false) {
		UnitProvider.recoveryPlayerListWithoutHp();
	}
	else {
		alias01.call(this);
	}
};
	
})();
