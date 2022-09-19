/*
■ファイル
restrictedAutoTurnSkip.js

■SRPG Studio対応バージョン:1.267

■プラグインの概要
環境設定の項目「敵ターンスキップ」で「瞬時」を削除します
本プラグインを導入すると「敵ターンスキップ」の項目は「早送り」か「なし」の二択になります(規定で「なし」)

これにより、敵ターン(および同盟ターン）を丸ごとスキップできないようになります
本プラグインの意図は、スキップに起因するプラグインやイベント関連の不具合の発生を回避するものになります

プレイヤー視点では、ターンスキップができないことはゲームをプレイするうえでストレスに感じられる場合もあります
そのため、製作上どうしても不具合の対策ができないというような場合のを除いて本プラグインの導入は慎重に検討なさってください

※細かい挙動
本プラグインで制限するターンスキップは、ターンを丸ごとスキップすることを意味します
戦闘が発生した際の戦闘アニメーションや戦闘時会話などのイベントは、通常通りスキップすることが可能です

敵ターンスキップを「早送り」にしている場合であっても、一定の条件で早送りが解除される場合があります
(UnitDeathFlowEntryクラスで死亡台詞のイベントが発生する際に「早送り」が解除される仕様)


■使用方法
　このファイルをpluginフォルダに入れる


■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2022/09/19 新規作成

*/

(function() {

// ターンスキップを許可しない
CurrentMap.setTurnSkipMode = function(isSkipMode) {
	this._isSkipMode = false;//isSkipMode;
	root.setEventSkipMode(false);//(isSkipMode);
};

// 敵軍、または同盟軍の場合におけるオートターンスキップは無効化する
BaseTurnLogoFlowEntry._isAutoTurnSkip = function() {
	return false; //EnvironmentControl.getAutoTurnSkipType() === 0;
};

// 敵ターンスキップのコンフィグ設定でindex === 0の時はスキップではなく[早送り]として扱う
Miscellaneous.isGameAcceleration = function() {
	if (root.getBaseScene() === SceneType.FREE) {
		if (root.getCurrentSession().getTurnType() !== TurnType.PLAYER &&
			EnvironmentControl.getAutoTurnSkipType() === 0 &&
			CurrentMap.isEnemyAcceleration())
		{
			return true;
		}
	}
	
	return InputControl.isSystemState();
};

// [敵ターンスキップ]のコンフィグ設定で「瞬時」の項目を削除する
// ターンスキップのフラグが1より大きい場合は1として返す
// 本来であれば、フラグの初期値は2(「敵ターンスキップ：なし」に設定されている)
ConfigItem.AutoTurnSkip.getFlagValue = function() {
	var result = root.getMetaSession().getDefaultEnvironmentValue(4);
	
	if (result > 1) result = 1;
	return result;
};

//　ターンスキップ「瞬時」を削除したので項目数は2
ConfigItem.AutoTurnSkip.getFlagCount = function() {
	return 2;
};

// ['早送り', 'なし']
ConfigItem.AutoTurnSkip.getObjectArray = function() {
	return [StringTable.AutoTurnSkip_Quick, StringTable.AutoTurnSkip_None];
};


})();
