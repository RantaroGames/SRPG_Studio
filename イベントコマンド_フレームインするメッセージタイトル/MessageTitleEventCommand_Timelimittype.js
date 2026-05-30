/*
■ファイル
MessageTitleEventCommand_Timelimittype.js

■SRPG Studio対応バージョン:1.322

■プラグインの概要
イベントコマンド：<メッセージタイトル>と同等の機能で以下の機能を追加
・左からフレームインさせる形式で表示する
・指定したフレーム数が経過すると決定キーを押さなくとも表示を消去する
(決定キー押下による終了は30フレーム経過後に許可)

■使用方法
このファイルをpluginフォルダに入れる

イベントコマンド<スクリプトの実行>
>種類
・イベントコマンド呼び出し

>オブジェクト名
CEC_MessageTitleEventCommand

>プロパティの記述例

{
  text: '表示するテキスト'
, isCenterShow: false
, isUnitBase: false
, x:20
, y:40
, wait: 120
, direction: 0
, isOneway: false
, textui: 'attacknumber_title'
}

//----------------------------------------------------------
 textは、''または""で囲む
 以下は、省略可
 isCenterShow
 ：true(中央表示)/ false(座標指定) 規定値：false
 isUnitBase
 : true(指定ユニットの座標を使用)/ false(座標を直接指定します) 規定値：false
 ※ isCenterShowがtrueの場合、この値は無視されます
    ユニットを基準にできるのは戦闘マップが開かれているシーン（戦闘マップ内と戦闘準備での情報収集イベント）のみ
    イベントコマンドの「オリジナルデータ」で「ユニット」を指定します。以下のx,yを指定すると座標を補正します
 x, y
 : 表示する座標(pixel)の指定 規定値：(x = 0, y = 0)
 ※ isCenterShowがtrueの場合、この値は無視されます
 wait
 :表示させる総フレーム数(*1) 未指定または0未満の値は規定で 180
 direction
 : スライドの開始方向 「0:左から指定座標へ, 1:右, 2:上, 3:下, 4:左上, 5:左下, 6:右上, 7:右下, 8:スライド無し」未指定または無効な値の場合、規定で左からスライド
 isOnway
 : true/false 消去時にスライド方向を一定にする(左から右へ入った時にそのまま右へ抜けて消える)
 textui
 : リソース>リソース使用箇所>テキストUIのリストから内部名を''で囲って記述する。指定したtitleUIに変更できる

(*1)表示開始からカウント(実際はCycleCounterクラスの処理にて+2フレームされているものと思われる)
フレームインの時間は16フレーム(タイトル長を16分割して順次表示している)
waitの値と比してintervalが大きいと全体が表示される時間が短くなるので注意
//----------------------------------------------------------

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2021/06/20
公開
2021/06/26
ユニットを基準にした際、スクロール位置を考慮しないバグの修正
2021/07/25
表示方法を終了時に開始時とは逆方向へフレームアウトして消去する形式に変更
2022/01/15
消去時のスライド方向を一定にするプロパティを追加
2023/12/05
本体ver.1288対応
(this._getTitleCenterPos()の処理変更の際にthis._partsCountプロパティが追加された)
2026/05/30
コードのリファクタリング
使用するUIをコード実行時に変更し易くできるようにした

*/

(function () {

var alias1 = ScriptExecuteEventCommand._configureOriginalEventCommand;
ScriptExecuteEventCommand._configureOriginalEventCommand = function(groupArray) {
	alias1.call(this, groupArray);
	groupArray.appendObject(MessageTitleEventCommand_TimeLimitType);
};

var MessageTitleEventCommand_TimeLimitType = defineObject(MessageTitleEventCommand,
{
	_counter: null,
	_wait: 180,
	_interval: 16,
	_direction: 0,
	_inputallowed: false,
	_isOneway: false,

	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();

		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}

		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(this._wait);

		// 高速化を受け付けない
		this._counter.disableGameAcceleration();

		return this._completeEventCommandMemberData();
	},

	moveEventCommandCycle: function() {
		// 30フレーム経過後は決定キー押下でのイベント終了処理を許可する
		if (this._inputallowed === false && this._counter.getCounter() > 30) {
			this._inputallowed = true;
		}

		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}

		if (this._inputallowed && InputControl.isSelectAction()) {
			return MoveResult.END;
		}

		return MoveResult.CONTINUE;
	},

	drawEventCommandCycle: function() {
		var pos = this._getDrawPosition();
		var offset = this._getAnimationOffset();
		var textui = this._getTitleText();

		TextRenderer.drawFixedTitleText(
			pos.x + offset.dx,
			pos.y + offset.dy,
			this._text,
			textui.getColor(),
			textui.getFont(),
			TextFormat.CENTER,
			textui.getUIImage(),
			this._partsCount
		);
	},

	_prepareEventCommandMemberData: function() {
		var eventCommandObject = root.getEventCommandObject();
		var arg = eventCommandObject.getEventCommandArgument();
		
		this._arg = arg;
		var textui = this._getTitleText();
		var font = textui.getFont();

		var isCenterShow = arg.isCenterShow === true;
		var isUnitBase = this._isUnitBaseEnabled(arg);

		this._wait = 180;
		this._interval = 16;
		this._direction = typeof arg.direction === 'number' ? arg.direction : 0;
		this._inputallowed = false;
		this._isOneway = arg.isOneway === true;
		
		this._text = this._getMessageText(arg);
		
		if (typeof arg.wait === 'number' && arg.wait > this._interval) {
			this._wait = arg.wait;
		}

		this._textWidth = TextRenderer.getTextWidth(this._text, font);
		this._partsCount = TitleRenderer.getTitlePartsCount(this._text, font);
		this._partsWidth = TitleRenderer.getTitlePartsWidth();
		this._partsHeight = TitleRenderer.getTitlePartsHeight();

		if (isCenterShow) {
			this._xStart = -1;
			this._yStart = -1;
		}
		else if (isUnitBase) {
			this._setUnitBasePosition(eventCommandObject, arg);
		}
		else {
			this._xStart = typeof arg.x === 'number' ? arg.x : 0;
			this._yStart = typeof arg.y === 'number' ? arg.y : 0;
		}
	},

	_isUnitBaseEnabled: function(arg) {
		var sceneType = root.getBaseScene();

		if (sceneType !== SceneType.BATTLESETUP &&
			sceneType !== SceneType.FREE) {
			return false;
		}

		return arg.isUnitBase === true;
	},

	_getMessageText: function(arg) {
		var text, variableReplacer;

		if (typeof arg.text === 'string') {
			text = arg.text;
			// text文字数が32文字を超える場合は32文字のみ取り出す
			if (text.length > 32) {
				text = text.slice(0, 32);
			}
		}
		else {
			text = 'error: arg.textが文字列ではありません';
		}

		return text;
	},

	_setUnitBasePosition: function(eventCommandObject, arg) {
		var content = eventCommandObject.getOriginalContent();
		var unit = content.getUnit();
		var session = root.getCurrentSession();

		var dx = typeof arg.x === 'number' ? arg.x : 0;
		var dy = typeof arg.y === 'number' ? arg.y : 0;

		var unitX;
		var unitY;

		if (unit === null || session === null) {
			this._xStart = 0;
			this._yStart = 0;
			return;
		}

		unitX = unit.getMapX();
		unitY = unit.getMapY();

		if (!MapView.isVisible(unitX, unitY)) {
			this._xStart = 0;
			this._yStart = 0;
			return;
		}

		this._xStart =
			LayoutControl.getPixelX(unitX) -
			session.getScrollPixelX() +
			dx;

		this._yStart =
			LayoutControl.getPixelY(unitY) -
			session.getScrollPixelY() +
			dy;
	},

	_getDrawPosition: function() {
		if (this._xStart === -1 && this._yStart === -1) {
			return this._getTitleCenterPos();
		}

		return {
			x: this._xStart,
			y: this._yStart
		};
	},

	_getAnimationOffset: function() {
		var count = this._counter.getCounter();
		var remain = this._wait - count;

		var titleWidth = this._partsWidth * (this._partsCount + 2);
		var titleHeight = this._partsHeight;

		var offset;

		if (count < this._interval) {
			return this._getDirectionOffset(
				this._direction,
				titleWidth,
				titleHeight,
				count / this._interval - 1
			);
		}

		if (remain < this._interval) {
			offset = this._getDirectionOffset(
				this._direction,
				titleWidth,
				titleHeight,
				remain / this._interval - 1
			);

			if (this._isOneway) {
				offset.dx *= -1;
				offset.dy *= -1;
			}

			return offset;
		}

		return {
			dx: 0,
			dy: 0
		};
	},

	_getDirectionOffset: function(direction, width, height, rate) {
		var dx = Math.ceil(width * rate);
		var dy = Math.ceil(height * rate);

		switch (direction) {
			case 0:
				return { dx: dx, dy: 0 };

			case 1:
				return { dx: -dx, dy: 0 };

			case 2:
				return { dx: 0, dy: dy };

			case 3:
				return { dx: 0, dy: -dy };

			case 4:
				return { dx: dx, dy: dy };

			case 5:
				return { dx: dx, dy: -dy };

			case 6:
				return { dx: -dx, dy: dy };

			case 7:
				return { dx: -dx, dy: -dy };

			case 8:
				return { dx: 0, dy: 0 };
		}

		return { dx: dx, dy: 0 };
	},

	_getTitleText: function() {
		var textui = null;

		if (
			this._arg &&
			typeof this._arg.textui === 'string' &&
			this._arg.textui !== ''
		) {
			textui = root.queryTextUI(this._arg.textui);
		}

		if (textui === null) {
			textui = root.queryTextUI('eventmessage_title');
		}

		return textui;
	},

	getEventCommandName: function() {
		return 'CEC_MessageTitleEventCommand';
	}
});

})();