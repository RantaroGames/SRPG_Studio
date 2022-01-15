/*
■ファイル
MessageTitleEventCommand_Timelimittype.js

■SRPG Studio対応バージョン:1.238

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
 : スライドの開始方向 「0:左から指定座標へ, 1:右, 3:上, 4:下, 5:左上, 6:右上, 7:右下, 8:スライド無し」未指定または無効な値の場合、規定で左からスライド
 isOnway
 : true/false 消去時にスライド方向を一定にする(左から右へ入った時にそのまま右へ抜けて消える)

(*1)表示開始からカウント(実際はCycleCounterクラスの処理にて+2フレームされているものと思われる)
フレームインの時間は16フレーム(タイトル長を16分割して順次表示している)
waitの値と比してintervalが大きいと全体が表示される時間が短くなるので注意
//----------------------------------------------------------

■作成者
ran

■更新履歴
2021/06/20
公開
2021/06/26
ユニットを基準にした際、スクロール位置を考慮しないバグの修正
2021/07/25
表示方法を終了時に開始時とは逆方向へフレームアウトして消去する形式に変更
2022/01/15
消去時のスライド方向を一定にするプロパティを追加
*/

(function() {

var alias1 = ScriptExecuteEventCommand._configureOriginalEventCommand;
ScriptExecuteEventCommand._configureOriginalEventCommand = function(groupArray) {
	alias1.call(this, groupArray);
	
	groupArray.appendObject(MessageTitleEventCommand_TimeLimitType);
};

var MessageTitleEventCommand_TimeLimitType = defineObject(MessageTitleEventCommand,
{
	_counter: null,
	_wait: 0,
	_interval: 0,
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
		
		//高速化を受け付けないようにする
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
		
		if (InputControl.isSelectAction()) {
			if (this._inputallowed === true) {
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_prepareEventCommandMemberData: function() {
		var eventcommandObject = root.getEventCommandObject();
		var arg = eventcommandObject.getEventCommandArgument();
		
		var textui = this._getTitleText();
		var font = textui.getFont();
		var content, unit;
		
		var isCenterShow = (typeof arg.isCenterShow === 'boolean') ? arg.isCenterShow : false;
		var isUnitBase = false;
		var session = root.getCurrentSession();
		var sceneType = root.getBaseScene();
		//「戦闘準備画面」でイベントを実行し、イベント中にこのメソッドroot.getBaseSceneを呼び出すと、SceneType.BATTLESETUPが返る
		// ユニットを基準にできるのはマップが開かれているシーン
		if (sceneType === SceneType.BATTLESETUP || sceneType === SceneType.FREE) {
			if (typeof arg.isUnitBase === 'boolean') {
				isUnitBase = arg.isUnitBase;
			}
		}
//		root.log(sceneType + ': isUnitBase:' + isUnitBase);
		var dx = (typeof arg.x === 'number') ? arg.x : 0;
		var dy = (typeof arg.y === 'number') ? arg.y : 0;
		
		this._wait = 180;
		this._interval = 16;
		this._direction = (typeof arg.direction === 'number') ? arg.direction : 0;
		this._inputallowed = false;
		
		if (typeof arg.text === 'string') {
			this._text = arg.text;
			// text文字数が32文字を超える場合は32文字のみ取り出す
			if (this._text.length > 32) this._text = this._text.slice(0, 32);
		} else {
			this._text = 'error: arg.textが文字列ではありません';
		}
		
		if (typeof arg.wait === 'number') {
			if (arg.wait > this._interval) {
				this._wait = arg.wait;
			}
		}
		
		if (typeof arg.isOneway === 'boolean') {
			this._isOneway = arg.isOneway;
		}
		
		this._textWidth = TextRenderer.getTextWidth(this._text, font);
		this._partsWidth = TitleRenderer.getTitlePartsWidth();
		this._partsHeight = TitleRenderer.getTitlePartsHeight();
		
		if (isCenterShow === true) {
			// 特定の背景ベースであるか、マップベースであるかによって、root.getGameAreaWidthの値は変化し、
			// 中央位置は異なるため、ここで_getTitleCenterPosを呼び出さない。
			this._xStart = -1;
			this._yStart = -1;
		}
		else if (isUnitBase === true) {
			content = eventcommandObject.getOriginalContent();
			unit = content.getUnit();

			if (unit !== null) {
				unitX = unit.getMapX();
				unitY = unit.getMapY();
//				root.log(unit.getName() +'x:'+ unitX + ' y:'+ unitY);
				
				// ユニット基準の場合、ユニットが画面内にいること
				if (session !== null && MapView.isVisible(unitX, unitY)) {
					this._xStart = LayoutControl.getPixelX(unitX) - session.getScrollPixelX() + dx;
					this._yStart = LayoutControl.getPixelX(unitY) - session.getScrollPixelY() + dy;
				}
				else {
					this._xStart = 0;
					this._yStart = 0;
				}
			}
			else {
				this._xStart = 0;
				this._yStart = 0;
			}
		}
		else {
			this._xStart = dx;
			this._yStart = dy;
		}
	},
	
	drawEventCommandCycle: function() {
		var x, y, pos, obj;
		var textui = this._getTitleText();
		var pic = textui.getUIImage();
		var color = textui.getColor();
		var font = textui.getFont();
//		var alpha = 255;
		var dx = 0;
		var dy = 0;
		
		var text = this._text;
		var count = TitleRenderer.getTitlePartsCount(text, font);
		var titleWidth = 30 * (count + 2);// 30はthis._partsWidth (UIFormat.TITLE_WIDTH / 3)に等しい
		var titleHeight = 60;// this._partsHeight (UIFormat.TITLE_HEIGHT)に等しい
		
		if (this._xStart === -1 && this._xStart === -1) {
			pos = this._getTitleCenterPos();
			x = pos.x;
			y = pos.y;
		}
		else {
			x = this._xStart;
			y = this._yStart;
		}
		
		if (this._counter.getCounter() < this._interval) {
			obj = this._getSlideDirection(this._direction, titleWidth, titleHeight);
			dx += obj.dx;
			dy += obj.dy;
		} else if (this._wait - this._counter.getCounter() < this._interval) {
			obj = this._getEraseDirection(this._direction, titleWidth, titleHeight);
			if (this._isOneway) {
				dx += obj.dx;
				dy += obj.dy;
			}
			else {
				dx -= obj.dx;
				dy -= obj.dy;
			}
		}
		else {
			dx = 0;
			dy = 0;
		}
		
		TextRenderer.drawFixedTitleText(x + dx, y + dy, text, color, font, TextFormat.CENTER, pic, count);
//		TextRenderer.drawFixedTitleAlphaText(x + dx, y + dy, text, color, font, TextFormat.CENTER, pic, alpha, count);
//		root.log(this._counter.getCounter() + ' : ' + this._inputallowed);
	},
	
	_getSlideDirection: function(direction, titleWidth, titleHeight) {
		var obj = {};
			obj.dx = 0;
			obj.dy = 0;
		
		switch (direction) {
			case 0: //左からスライド
				obj.dx = Math.ceil(this._counter.getCounter() * (titleWidth / this._interval) - titleWidth);
				obj.dy = 0;
				break;
			case 1: //右から
				obj.dx = Math.ceil(titleWidth - this._counter.getCounter() * (titleWidth / this._interval));
				obj.dy = 0;
				break;
			case 2: //上から
				obj.dx = 0;
				obj.dy = Math.ceil(this._counter.getCounter() * (titleHeight / this._interval) - titleHeight);
				break;
			case 3: //下から
				obj.dx = 0;
				obj.dy = Math.ceil(titleHeight - this._counter.getCounter() * (titleHeight / this._interval));
				break;
			case 4: //左上から
				obj.dx = Math.ceil(this._counter.getCounter() * (titleWidth / this._interval) - titleWidth);
				obj.dy = Math.ceil(this._counter.getCounter() * (titleHeight / this._interval) - titleHeight);
				break;
			case 5: //左下から
				obj.dx = Math.ceil(this._counter.getCounter() * (titleWidth / this._interval) - titleWidth);
				obj.dy = Math.ceil(titleHeight - this._counter.getCounter() * (titleHeight / this._interval));
				break;
			case 6: //右上から
				obj.dx = Math.ceil(titleWidth - this._counter.getCounter() * (titleWidth / this._interval));
				obj.dy = Math.ceil(this._counter.getCounter() * (titleHeight / this._interval) - titleHeight);
				break;
			case 7: //右下から
				obj.dx = Math.ceil(titleWidth - this._counter.getCounter() * (titleWidth / this._interval));
				obj.dy = Math.ceil(titleHeight - this._counter.getCounter() * (titleHeight / this._interval));
				break;
			case 8: //スライドしない
				obj.dx = 0;
				obj.dy = 0;
				break;
			default: //左からスライド
				obj.dx = Math.ceil(this._counter.getCounter() * (titleWidth / this._interval) - titleWidth);
				obj.dy = 0;
				break;
		}
		
		return obj;
	},
	
	_getEraseDirection: function(direction, titleWidth, titleHeight) {
		var obj = {};
			obj.dx = 0;
			obj.dy = 0;
		
		switch (direction) {
			case 0: //左からスライド
				obj.dx = Math.ceil(titleWidth - (this._wait - this._counter.getCounter()) * (titleWidth / this._interval));
				obj.dy = 0;
				break;
			case 1: //右から
				obj.dx = Math.ceil((this._wait - this._counter.getCounter()) * (titleWidth / this._interval) - titleWidth);
				obj.dy = 0;
				break;
			case 2: //上から
				obj.dx = 0;
				obj.dy = Math.ceil(titleHeight - (this._wait - this._counter.getCounter()) * (titleHeight / this._interval));
				break;
			case 3: //下から
				obj.dx = 0;
				obj.dy = Math.ceil((this._wait - this._counter.getCounter()) * (titleHeight / this._interval) - titleHeight);
				break;
			case 4: //左上から
				obj.dx = Math.ceil(titleWidth - (this._wait - this._counter.getCounter()) * (titleWidth / this._interval));
				obj.dy = Math.ceil(titleHeight - (this._wait - this._counter.getCounter()) * (titleHeight / this._interval));
				break;
			case 5: //左下から
				obj.dx = Math.ceil(titleWidth - (this._wait - this._counter.getCounter()) * (titleWidth / this._interval));
				obj.dy = Math.ceil((this._wait - this._counter.getCounter()) * (titleHeight / this._interval) - titleHeight);
				break;
			case 6: //右上から
				obj.dx = Math.ceil((this._wait - this._counter.getCounter()) * (titleWidth / this._interval) - titleWidth);
				obj.dy = Math.ceil(titleHeight - (this._wait - this._counter.getCounter()) * (titleHeight / this._interval));
				break;
			case 7: //右下から
				obj.dx = Math.ceil((this._wait - this._counter.getCounter()) * (titleWidth / this._interval) - titleWidth);
				obj.dy = Math.ceil((this._wait - this._counter.getCounter()) * (titleHeight / this._interval) - titleHeight);
				break;
			case 8: //スライドしない
				obj.dx = 0;
				obj.dy = 0;
				break;
			default: //左からスライド
				obj.dx = Math.ceil(titleWidth - (this._wait - this._counter.getCounter()) * (titleWidth / this._interval));
				obj.dy = 0;
				break;
		}
		
		return obj;
	},
	
	_getTitleText: function() {
		//タイトル枠(画像)を変更したい場合 リソース使用箇所>テキストUI>内部名を記述すればよい
		return root.queryTextUI('eventmessage_title');
	},
	
	getEventCommandName: function() {
		return 'CEC_MessageTitleEventCommand';
	}
}
);


})();
