/*

■ファイル名
BattleMusicControl_fixedmusic.js

■SRPG Studio対応バージョン
ver.1.274

■プラグインの概要
戦闘BGMの選曲時に特定のカスタムパラメータを設定したユニットの戦闘音楽を優先させる
(自軍、敵軍共に戦闘時音楽が設定されている場合で、優先させたいBGMがある時などを想定)

■使用方法
1.このプラグインをpluginフォルダに入れる
2.ユニットのカスタムパラメータに以下を記述する

{
  fixedBattleMusic: true
}

・本プラグインでのBGM優先順位
カスタムパラメータにtrueが設定されていれば、そのユニットの詳細情報で設定した戦闘音楽が選曲される
戦闘を仕掛けたユニットと防御側ユニットの双方に{fixedBattleMusic: true}があった場合は、仕掛けた側の音楽が選曲される
戦闘音楽が「なし」だった場合は、通常の方法で選曲される
戦闘音楽が「停止」だった場合は、BGMは無音になる


・本来の戦闘時BGM選曲順
1.攻撃側ユニットに戦闘時音楽が設定されている
2.防御側ユニットに戦闘時音楽が設定されている

1,2が成立しない場合
　3.攻撃側が自軍ならマップ情報の自軍戦闘BGM
　4.攻撃側が同盟ならマップ情報の同盟戦闘BGM
　5.攻撃側が敵軍ならマップ情報の敵軍戦闘BGM


・公式追加プラグインとの関係
custom-weaponmusic.jsを導入している時
カスタムパラメータを設定した武器で攻撃を仕掛けた場合、BGMは武器で指定したものになります
(プラグインの読み込み順を変更するなどして選曲を変更することは可能です)


■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2022/12/27 新規作成

*/

(function() {

var _BattleMusicControl__getBattleMusicData = BattleMusicControl._getBattleMusicData;
BattleMusicControl._getBattleMusicData = function(battleTable) {
	var obj = {};
	var battleObject = battleTable.getBattleObject();
	var attackInfo = battleObject.getAttackInfo();
	var unitSrc = attackInfo.unitSrc;
	var unitDest = attackInfo.unitDest;
	var handleUnitSrc = unitSrc.getBattleMusicHandle();
	var handleUnitDest = unitDest.getBattleMusicHandle();
	
	// 攻撃を仕掛けた側のカスタムパラメータがtrue　かつ、戦闘音楽が設定されている
	if (unitSrc.custom.fixedBattleMusic === true && !handleUnitSrc.isNullHandle()) {
		obj.handle = handleUnitSrc;
		obj.isNew = unitSrc.isBattleMusicContinue();
	}
	// 仕掛けられた側のカスタムパラメータがtrue　かつ、戦闘音楽が設定されている
	else if (unitDest.custom.fixedBattleMusic === true && !handleUnitDest.isNullHandle()) {
		obj.handle = handleUnitDest;
		obj.isNew = unitDest.isBattleMusicContinue();
	}
	// それ以外であれば、本来の選曲方法
	else {
		obj = _BattleMusicControl__getBattleMusicData.call(this, battleTable);
	}
	
	return obj;
};

})();
