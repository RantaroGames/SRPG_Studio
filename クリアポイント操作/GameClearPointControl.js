/*
■ファイル
GameClearPointControl.js

■SRPG Studio対応バージョン:1.262


■プラグインの概要
周回プレイ特典で残ったポイントの取扱いを「次回に引き継ぐ」に設定していた場合に
特典ショップでクリアポイントを消費した状態で別データでニューゲームを始めるとポイントが減少した状態になる現象への対策

・本プラグインでのクリアポイントの扱い
ゲームクリア時に〈環境ファイルの操作〉でクリアポイントを10点付与→(環境パラメータにクリアポイント10が保存される)
ニューゲームを開始した際(2周目)にポイントを3消費してマップ攻略に移る→(消費したポイント3をグローバルパラメータに記録する)
2周目のゲームクリア時にクリアポイント10を付与→(環境パラメータにクリアポイントの累計20-3(その周回データで消費していたポイント)=17が保存される)
3周目のニューゲーム開始時のクリアポイントは17

■使用方法
1.このファイルをpluginフォルダに入れる

※「残ったポイントの取扱い」は「次回に引き継ぐ」に設定すること

■注意事項
本プラグインはテスト段階であり、検証不足です
期待される動作が実現できないなどの不具合が発生する可能性があります


■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2022/07/07 新規作成
*/


// クリアポイントを操作する関数
// 外部から使用する可能性も想定して即時関数の外に記述している
var GameClearPointControl = {
	// カスタムパラメータの存在チェックと初期化
	_init: function() {
		// その周回データで使用したクリアポイントの値を記録する
		// グローバルパラメータに保存するのでセーブデータに依存する
		var CurrentUsePoint = root.getMetaSession().global.CurrentUsePoint;
		if (typeof CurrentUsePoint !== 'number' || CurrentUsePoint < 0) {
			root.getMetaSession().global.CurrentUsePoint = 0;
		}
		
		// ゲームのクリア回数を環境パラメータに記録する
		// root.getExternalData().getGameClearCount()で記録されるクリア回数と比較して
		// その周回データでクリアポイントの調整を行うか否かを判定する目的で使用する
		var ClearCount = root.getExternalData().env.ClearCount;
		if (typeof ClearCount !== 'number' || ClearCount < 0) {
			root.getExternalData().env.ClearCount = 0;
		}
	},
	
	// その周回データで使用したクリアポイントの値をグローバルパラメータに記録する
	setCurrentUsePoint: function(value) {
		this._init();
		
		if (typeof value !== 'number' || value < 0) {
			root.log('GameClearPointControl.setCurrentUsePoint(value)の引数が不正です');
			return;
		}
		
		root.getMetaSession().global.CurrentUsePoint = value;
	},
	
	getCurrentUsePoint: function() {
		this._init();
		
		return  root.getMetaSession().global.CurrentUsePoint;
	},
	
	// 累積したクリアポイントからその周回データで使用済みのポイントを減算する
	_calculateCarryOverPoint: function() {
		var point = root.getExternalData().getGameClearPoint();
		var value = this.getCurrentUsePoint();
		root.log('使用済みポイント:' + value);
		
		point -= value;
		if (point < 0) point = 0;
		
		root.getExternalData().setGameClearPoint(point);
	},
	
	// 累積ポイントの調整を行うか否かの判定
	_checkCarryOver: function() {
		var type = root.getBaseData().getClearPointType();
		
		// 「ポイントを引き継ぐ」設定でなければfalseを返す
		if (type !== ClearPointType.CARRYOVER) {
			return false;
		}
		
		// ゲームをクリアした回数が環境パラメータに記録している値より大きければture
		return root.getExternalData().getGameClearCount() > this._getClearCount();
	},
	
	_getClearCount: function() {
		this._init();
		return root.getExternalData().env.ClearCount;
	},
	
	// チェック用のゲームクリア回数に+1
	_setClearCount: function() {
		this._init();
		root.log('チェック用count+1');
		root.getExternalData().env.ClearCount++;
	}
};


(function() {

// (上書き) ショップを抜ける時にクリアポイントを更新する関数
ClearPointFlowEntry._savePoint = function() {
	var type = root.getBaseData().getClearPointType();
	
	if (type === ClearPointType.CARRYOVER) {
		// ClearPointFlowEntryを抜けた時にクリアポイントが書き換えられるので、一旦この処理を無効化する
		// ポイント使用してゲームを開始した後に、別データでニューゲームを始めてもポイントが減少した状態になってしまう
//		root.getExternalData().setGameClearPoint(this._pointLayoutScreen.getGold());

		// 代わりに消費したクリアポイントをグローバルパラメータに保存しておく
		var point = root.getExternalData().getGameClearPoint();
		point -= this._pointLayoutScreen.getGold();
		GameClearPointControl.setCurrentUsePoint(point);
		
		root.log('クリアP:' + root.getExternalData().getGameClearPoint() + ' 使用P:' + point);
	}
	else if (type === ClearPointType.ZERO) {
		root.getExternalData().setGameClearPoint(0);
	}
};

// エンディングシーン(ゲームクリア時)に入った時にクリアポイントを調整する
var _EndingScene_setSceneData = EndingScene.setSceneData;
EndingScene.setSceneData = function() {
	_EndingScene_setSceneData.call(this);
	
	var count = root.getExternalData().getGameClearCount();
	root.log('クリア回数:' + count + ':' + GameClearPointControl._getClearCount());
	
	// root.getExternalData().getGameClearCount()で記録されたクリア回数がチェック用のクリア回数より大きい場合
	if (GameClearPointControl._checkCarryOver()) {
		// クリア回数をsetGameClearCount()とは別に記録しておく
		GameClearPointControl._setClearCount();
		
		// その周回データで使用していたクリアポイント分を減算する
		GameClearPointControl._calculateCarryOverPoint();
	}
};

})();
