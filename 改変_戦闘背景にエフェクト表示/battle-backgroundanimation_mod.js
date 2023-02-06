// 改変元プラグイン(battle-backgroundanimation.js)の説明
/*--------------------------------------------------------------------------
  
  特定のマップにおいて、戦闘背景の上にエフェクトを表示します。
  エフェクトに背景アニメを設定することで、背景がアニメーションしているような演出にできます。
  
  使用方法:
  マップのカスタムパラメータに
  {backgroundAnimeId: 0}
  のように記述します。
  0の部分は、オリジナルエフェクトのIDです。
  
  作成者:
  サファイアソフト
  https://srpgstudio.com/
  
  更新履歴:
  2023/02/04 公開
  
--------------------------------------------------------------------------*/
// ここまで

/*
■ファイル
battle-backgroundanimation_mod.js

■改変元プラグイン
battle-backgroundanimation.js

※改変元プラグインと本プラグインは同時に使用しないでください。

■SRPG Studio対応バージョン
1.277

■改変内容および使用方法
1.地形からもエフェクトアニメを取得できるようにした

  地形効果のカスタムパラメータに以下のように記述する(XXは、オリジナルエフェクトのid)
  {backgroundAnimeId: XX}
  
  この時、数値に-1を記述するとエフェクトを表示しない地形として設定することができる
  (マップ全体で砂嵐エフェクトを表示させるが建物チップでは表示されないという風にできる)
  
  アニメの取得順位
  1．攻撃されたユニットが居る地形(レイヤーチップ) 2.下層チップ 3.マップ情報
  
  ※「レイヤーを無効化」が設定されている地形のカスタムパラメータの記述は無効になります
  (「レイヤーを無効化」 Ver1.257で実装された機能。地形情報を下層チップから取得する）

2.グローバルスイッチのON/OFFによりエフェクト表示を管理できるようにした
  管理用グローバルスイッチを作成し、下記コード内の数値(70行付近)をidの値で書き換える

■改変者
ran

■改変履歴
2023/02/06　地形のカスタムパラメータでアニメを指定できるようにした。グローバルスイッチで管理できるようにした

*/


(function() {

// エフェクトを取得するオブジェクト
var BackgroundAnimeControl = {
	
	_isAllowed: function() {
		//---------------------------
		// グローバルスイッチのidを記述する
		var globalSwitchId = 0;
		//---------------------------
		var table = root.getMetaSession().getGlobalSwitchTable();
		var index = table.getSwitchIndexFromId(globalSwitchId);
		
		// グローバルスイッチがオンの場合は戦闘背景にエフェクトを表示する
		// id不正で対応するスイッチが存在しない場合、インデックス0(リスト一番目)のスイッチの状態が返る
		return table.isSwitchOn(index);
	},
	
	// エフェクトアニメを取得する
	getAnime: function(realBattle) {
		var anime, id, attackInfo, terrain, terrainLayer;
		
		// グローバルスイッチでエフェクト表示を管理しない場合、下の一行をコメントアウトしても良い
		if (this._isAllowed() === false) return null;
		
		attackInfo = realBattle.getAttackInfo();
		terrainLayer = attackInfo.terrainLayer;
		terrain = attackInfo.terrain;
		
		// ユニットのカスパラでidを指定したい場合用
//		var unitSrc = attackInfo.unitSrc; // 攻撃を仕掛けた側
//		var unitDest = attackInfo.unitDest; // 攻撃された側
		
		if (terrainLayer !== null && typeof terrainLayer.custom.backgroundAnimeId === 'number') {
			id = terrainLayer.custom.backgroundAnimeId;
		}
		else if (terrain !== null && typeof terrain.custom.backgroundAnimeId === 'number') {
			id = terrain.custom.backgroundAnimeId;
		}
		else {
			id = cur_map.custom.backgroundAnimeId;
		}
		
		if (typeof id !== 'number' || id === -1) {
			anime = null;
		}
		else {
			anime = root.getBaseData().getEffectAnimationList(false).getDataFromId(id);
		}
	
		return anime;
	}
};

var alias1 = UIBattleLayout.setBattlerAndParent;
UIBattleLayout.setBattlerAndParent = function(battlerRight, battlerLeft, realBattle) {
	var anime = BackgroundAnimeControl.getAnime(realBattle);
	
	alias1.call(this, battlerRight, battlerLeft, realBattle);
	
	if (anime !== null) {
		this._dynamicAnime = createObject(DynamicAnimeBackgroundOnly);
		this._dynamicAnime.startDynamicAnime(anime, 0, 0);
	}
	else {
		this._dynamicAnime = null;
	}
};

var alias2 = UIBattleLayout._drawBackground;
UIBattleLayout._drawBackground = function(xScroll, yScroll) {
	alias2.call(this, xScroll, yScroll);
	if (this._dynamicAnime !== null) {
		this._dynamicAnime.drawDynamicAnime();
	}
};

var alias3 = UIBattleLayout.moveBattleLayout;
UIBattleLayout.moveBattleLayout = function() {
	if (this._dynamicAnime !== null) {
		this._dynamicAnime.moveDynamicAnime();
	}
	
	return alias3.call(this);
};

var DynamicAnimeBackgroundOnly = defineObject(DynamicAnime,
{
	moveDynamicAnime: function() {
		if (this._motion === null) {
			return MoveResult.END;
		}
		
		if (this._motion.moveMotion() !== MoveResult.CONTINUE) {
			return MoveResult.CONTINUE;
		}
		
		this._motion.nextFrame();
		if (this._motion.isLastFrame()) {
			this._motion.setFrameIndex(0);
		}
		
		return MoveResult.CONTINUE;
	},
	drawDynamicAnime: function() {
		this._motion.drawBackgroundAnime();
		this._motion.drawScreenColor();
	}
}
);

})();
