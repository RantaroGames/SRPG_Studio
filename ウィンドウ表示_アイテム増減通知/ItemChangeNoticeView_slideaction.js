/*
■ファイル
ItemChangeNoticeView_slideaction.js

■SRPG Studio対応バージョン:1.322

■プラグインの概要
アイテム増減時の通知をスライドさせて表示できるようにします。

■使用方法
1.このファイルをpluginフォルダに入れる

2.本プラグイン内の設定項目(30行目付近)を用途に合わせて数値を変更する

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2024/10/06 新規作成
2026/05/31 コードのリファクタリング

*/

(function(){

//-----------------------------------------------
// 設定項目
//-----------------------------------------------
var SlideSetting = {
	// スライド方向 0:左からフレームイン, 1:右から, 2:上から, 3:下から, 4:左上から, 5:左下から, 6:右上から, 7:右下から, 8:スライド無し
	DIRECTION: 8
	// 画像の分割数 8なら1フレーム毎に8分割ずつスライド(※0を指定しない)
,	INTERVAL: 8
	// 通知の表示総フレーム数 60フレーム=約1秒 指定したフレーム数に到達すると決定ボタンを押さなくても通知は自動で消去されます
,	FRAMEMAX: 180
	// 画像の表示位置 0:左中央, 1:右中央, 2:上中央, 3:下中央, 4:左上, 5:左下, 6:右上, 7:右下, 8:画面中央（本来の描画位置）
,	BASEPOS: 8
	// 表示位置補正x(正の値で右に, 負の値で左に補正), y(正の値で下に, 負の値で上に補正)
,	POSX: 0
,	POSY: 0
	// 通知画像のUIにタイトル(内部名が *_tietle)を使用する場合は true ウィンドウ(内部名が *_window)を使用する場合はfalse
,	USE_TITLE_UI: true
	// 通知画像のUI リソース使用箇所>テキストUIの内部名を''で括って記述する  //'default_window'
,	TEXTUI: 'support_title'
};

//-----------------------------------------------

ItemChangeNoticeView._counter = null;

var _ItemChangeNoticeView_setItemChangeData = ItemChangeNoticeView.setItemChangeData;
ItemChangeNoticeView.setItemChangeData = function(item, type) {
	this._counter = createObject(CycleCounter);
	this._counter.setCounterInfo(SlideSetting.FRAMEMAX);
	//高速化を受け付けないようにする
	this._counter.disableGameAcceleration();
	
	_ItemChangeNoticeView_setItemChangeData.call(this, item, type);
};

var _ItemChangeNoticeView_moveNoticeView = ItemChangeNoticeView.moveNoticeView;
ItemChangeNoticeView.moveNoticeView = function() {
	if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
		return MoveResult.END;
	}
	
	return _ItemChangeNoticeView_moveNoticeView.call(this);
};

ItemChangeNoticeView.getTitleTextUI = function() {
	return root.queryTextUI(SlideSetting.TEXTUI);
};

ItemChangeNoticeView.drawNoticeView = function(x, y) {
	var textui = this.getTitleTextUI();
	var pic = textui.getUIImage();
	var width = TitleRenderer.getTitlePartsWidth();
	var height = TitleRenderer.getTitlePartsHeight();
	var count = this.getTitlePartsCount();
	
	var titleWidth = this.getNoticeViewWidth();
	var titleHeight = this.getNoticeViewHeight();
	var obj = this._getAnimationOffset(SlideSetting.DIRECTION, titleWidth, titleHeight);
	var pos = this._getBasePosition(x, y, titleWidth, titleHeight);

	x = pos.x + SlideSetting.POSX;
	y = pos.y + SlideSetting.POSY;
	
	if (SlideSetting.USE_TITLE_UI === true) {
		TitleRenderer.drawTitle(pic, x + obj.dx, y + obj.dy, width, height, count);
	} else {
		WindowRenderer.drawStretchWindow(x + obj.dx, y + obj.dy, titleWidth, titleHeight, pic);
	}
	
	x += this._getNoticeStartX();
	y += this._getNoticeStartY();
	this.drawNoticeViewContent(x + obj.dx, y + obj.dy);
};

ItemChangeNoticeView._getBasePosition = function(x, y, width, height) {
	var xPadding = DefineControl.getWindowXPadding();
	var yPadding = DefineControl.getWindowYPadding();

	switch (SlideSetting.BASEPOS) {
		case 0:
			x = xPadding;
			break;
		case 1:
			x = root.getGameAreaWidth() - width - xPadding;
			break;
		case 2:
			y = yPadding;
			break;
		case 3:
			y = root.getGameAreaHeight() - height - yPadding;
			break;
		case 4:
			x = xPadding;
			y = yPadding;
			break;
		case 5:
			x = xPadding;
			y = root.getGameAreaHeight() - height - yPadding;
			break;
		case 6:
			x = root.getGameAreaWidth() - width - xPadding;
			y = yPadding;
			break;
		case 7:
			x = root.getGameAreaWidth() - width - xPadding;
			y = root.getGameAreaHeight() - height - yPadding;
			break;
	}

	return {
		x: x,
		y: y
	};
};

ItemChangeNoticeView._getAnimationOffset = function(direction, width, height) {
	if (!this._counter) {
		return {
			dx: 0,
			dy: 0
		};
	}
	
	var count = this._counter.getCounter();
	var remain = SlideSetting.FRAMEMAX - count;
	var interval = Math.max(1, SlideSetting.INTERVAL);

	if (count < interval) {
		return this._getDirectionOffset(
			direction,
			width,
			height,
			count / interval - 1
		);
	}

	if (remain < interval) {
		return this._getDirectionOffset(
			direction,
			width,
			height,
			remain / interval - 1
		);
	}

	return {
		dx: 0,
		dy: 0
	};
};

ItemChangeNoticeView._getDirectionOffset = function(direction, width, height, rate) {
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
};

})();
