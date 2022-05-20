/*
このファイルは、キュウブ氏が作成されたプラグイン(ReinforcementNotice.js)を基に改変したものになります。

以下、改変元ファイルの規約
//-------------------------------------------------------------

　増援を可視化する ver 1.0

■作成者
キュウブ

■概要
増援が出現するターンになると該当マスにランタイムの!アイコンが表示されるようになります。
これにより即時行動してくる増援の初見殺し感を軽減させる事ができます。

アイコンが出現する条件は以下の通りです
1.増援が出現する自軍ターンである事
2.増援の出現条件を満たしている事(特定スイッチのオン/オフなど。特殊な条件を含んでいる場合それらを満たした時点で表示されるようになります)

■使い方

■更新履歴
ver1.0 2020/4/20
new entry

■対応バージョン
SRPG Studio Version:1.161

■規約
・利用はSRPG Studioを使ったゲームに限ります。
・商用・非商用問いません。フリーです。
・加工等、問題ありません。
・クレジット明記無し　OK (明記する場合は"キュウブ"でお願いします)
・再配布、転載　OK (バグなどがあったら修正できる方はご自身で修正版を配布してもらっても構いません)
・wiki掲載　OK
・SRPG Studio利用規約は遵守してください。

//-------------------------------------------------------------
元ファイル名
ReinforcementNotice.js

改変ファイル名
ReinforcementNotice_mod.js

改変内容
・増援リストを保存するためのプロパティ「MapLayer._ReinforcementNoticeArr」を追加
・MapLayer._drawReinforcementNoticeメソッドで増援出現を判定していたのを「MapLayer._setReinforcementNotice」に分離
・MapLayer._setReinforcementNotice()の実行個所をターン切り替わり時などに限定
・元の処理では「自軍ターン終了時に登場」の援軍のみ表示する設定になっているところを
　指定する変数の値を切り替えることで「敵軍ターン終了時に登場する援軍の座標も表示する設定を追加

改変者
ran

最終改変日
2021/12/03
2022/03/15

*/

(function(){
	// アイコンを変えたい場合はこの設定をいじってください
	var REINFORCEMENT_NOTICE_ICON = {
		isRuntime: true,	//ランタイム画像ならtrue,オリジナルならfalse
		id: 0,				//画像のID
		xSrc: 0,			//左から何番目のアイコンか(左端を0番目とする)
		ySrc: 9 			//上から何番目のアイコンか(上端を0番目とする)
	};
	
	//-------------------------------------------------------------------------
	// 追加した処理
	// 自軍ターン終了時に登場する援軍の座標を表示する場合は0を指定
	// 0以外の値を指定した場合、敵軍ターン終了時に登場する援軍の座標も表示するようになります
	var APPEAR_TURNTYPE = 0;
	
	// 敵軍ターン終了時に登場する援軍座標用アイコンを変えたい場合
	// 上のREINFORCEMENT_NOTICE_ICONと同じ設定でも問題はない
	var ENEMYTURN_APPEAE_ICON = {
		isRuntime: true,	//ランタイム画像ならtrue,オリジナルならfalse
		id: 0,				//画像のID
		xSrc: 3,			//左から何番目のアイコンか(左端を0番目とする)
		ySrc: 9 			//上から何番目のアイコンか(上端を0番目とする)
	};
	
	// 増援リストを配列@[x, y, handle]で保存
	MapLayer._ReinforcementNoticeArr = null;
	//-------------------------------------------------------------------------
	
	var alias = MapLayer.drawUnitLayer;

	MapLayer.drawUnitLayer = function() {
		var turnType;
		var session = root.getCurrentSession();
		
		alias.call(this);
		
		// マップ攻略中シーンのみ描画
		if (root.getBaseScene() !== SceneType.FREE) return;
			
		// 増援の座標とハンドルを保存した配列が無い場合
		if (Object.prototype.toString.call(this._ReinforcementNoticeArr) !== '[object Array]') return;
		
		// イベントが実行中の時は描画しない
		if (root.isEventSceneActived()) return;
		
		if (session !== null) {
			turnType = session.getTurnType();
			
			if (turnType === TurnType.PLAYER && this._counter.getAnimationIndex2() % 2 === 0) {
				this._drawReinforcementNotice(this._ReinforcementNoticeArr, session);
			}
		}
	};

	MapLayer._drawReinforcementNotice = function(arr, session) {
		var i, data, handle, x, y;
		
		for (i= 0; i < arr.length; i++) {
			data = arr[i];
			if (data === null) continue;
		
			// 画面外の地点は描画しない
			if (!CurrentMap.isMapInside(data[0], data[1]) || !MapView.isVisible(data[0], data[1])) continue;
			
			// 出現座標を描画用のpixel座標に変換
			x = data[0] * GraphicsFormat.MAPCHIP_WIDTH - session.getScrollPixelX();
			y = data[1] * GraphicsFormat.MAPCHIP_HEIGHT - session.getScrollPixelY();
			handle = data[2];
			//root.log(x + ':' + y);
				
			GraphicsRenderer.drawImage(x, y, handle, GraphicsType.ICON);
		}
	};
	
	MapLayer._setReinforcementNotice = function() {
		var i, j, posData, posDataCount, handle, x, y;
		var session = root.getCurrentSession();
		
		// 援軍リスト保存用配列を初期化
		this._ReinforcementNoticeArr = [];
		
		if (session === null) return;
		
		// マップ攻略中以外のシーン
		if (root.getBaseScene() !== SceneType.FREE) return;
		
		var mapInfo = session.getCurrentMapInfo();
		var mapInfoCount = mapInfo.getReinforcementPosCount();
		
		for (i = 0; i < mapInfoCount; i++) {
			posData = mapInfo.getReinforcementPos(i);
			posDataCount = posData.getReinforcementPageCount();
			x = posData.getX();
			y = posData.getY();
			handle = null;

			for (j = 0; j < posDataCount; j++) {
				pageData = posData.getReinforcementPage(j);
				
				// 「自軍ターン終了時に登場」の援軍のみ表示する場合
				if (APPEAR_TURNTYPE === 0) {
					if (pageData.getTurnType() !== TurnType.PLAYER) continue;
				}
				
				if (pageData.isRelativeTurn()) {
					turnCount = session.getRelativeTurnCount();
				}
				else {
					turnCount = session.getTurnCount();
				}
				
				if (pageData.getStartTurn() <= turnCount && pageData.getEndTurn() >= turnCount) {
					if (pageData.isCondition()) {
						if (pageData.getTurnType() === TurnType.PLAYER) {
							// 「自軍ターン終了時に登場する援軍」用のアイコン
							handle = root.createResourceHandle(REINFORCEMENT_NOTICE_ICON.isRuntime, REINFORCEMENT_NOTICE_ICON.id, 0, REINFORCEMENT_NOTICE_ICON.xSrc, REINFORCEMENT_NOTICE_ICON.ySrc);
						} else {
							// 「敵軍ターン終了時に登場する援軍」用のアイコン
							handle = root.createResourceHandle(ENEMYTURN_APPEAE_ICON.isRuntime, ENEMYTURN_APPEAE_ICON.id, 0, ENEMYTURN_APPEAE_ICON.xSrc, ENEMYTURN_APPEAE_ICON.ySrc);
						}
						
						// isNullHandle()は「空のリソースハンドル」というオブジェクトか否かを判定している 「空のリソースハンドル」はroot.createEmptyHandle()メソッドで生成する
						// root.createResourceHandle(isRuntime, id, colorIndex, xSrc, ySrc)メソッドはオブジェクトを返す(nullを返さない。リソースの存在の有無を考慮しない)
						// そのため、以下のif文が実行されることは無い？
						if (handle === null) continue;
						
						// 出現地点座標x,yとiconハンドルを配列に格納
						this._ReinforcementNoticeArr.push([x, y, handle]);
						//root.log('増援座標：' + x + ', ' + y);
					}
				}
			}
		}
	};
	
	// 増援リストを保存する
	var _MapLayer_prepareMapLayer = MapLayer.prepareMapLayer;
	MapLayer.prepareMapLayer = function() {
		_MapLayer_prepareMapLayer.call(this);
		
		this._setReinforcementNotice();
	};
	
	// ターン切り替わり時に増援の表示用リストを取得する
	var _PlayerTurn_openTurnCycle = PlayerTurn.openTurnCycle;
	PlayerTurn.openTurnCycle = function () {
		_PlayerTurn_openTurnCycle.call(this);
		
		MapLayer._setReinforcementNotice();
	};
	
	var _EnemyTurn_openTurnCycle = EnemyTurn.openTurnCycle;
	EnemyTurn.openTurnCycle = function () {
		_EnemyTurn_openTurnCycle.call(this);
		
		MapLayer._setReinforcementNotice();
	};
	
	// 何らかのイベント終了時に増援の実行可能条件の変更があった場合に備えて表示用リストを更新する
	var _PlayerTurn_doEventEndAction = PlayerTurn._doEventEndAction;
	PlayerTurn._doEventEndAction = function () {
		_PlayerTurn_doEventEndAction.call(this);
		
		MapLayer._setReinforcementNotice();
	};
	
	// エネミーターン終了時に実行可能な増援リストを保存
	// イベント条件切替の設定状況によっては、このタイミングでのリスト取得だと漏れが生じる可能性もある
	var _EnemyTurn__moveEndEnemyTurn = EnemyTurn._moveEndEnemyTurn;
	EnemyTurn._moveEndEnemyTurn = function() {
		MapLayer._setReinforcementNotice();

		return _EnemyTurn__moveEndEnemyTurn.call(this);
	};
	
})();