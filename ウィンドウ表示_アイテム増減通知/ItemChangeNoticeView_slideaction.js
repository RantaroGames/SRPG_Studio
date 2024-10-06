/*
■ファイル
ItemChangeNoticeView_slideaction.js

■SRPG Studio対応バージョン:1.302

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

*/

(function(){

//-----------------------------------------------
// 設定項目
var SlideSetting = {
	// スライド方向 0:左からフレームイン, 1:右から, 2:上から, 3:下から, 4:左上から, 5:左下から, 6:右上から, 7:右下から, 8:スライド無し
	DIRECTION: 8
	// 画像の分割数 8なら1フレーム毎に8分割ずつスライド
,	INTERVAL: 8
	// 通知の表示総フレーム数 60フレーム=約1秒 指定したフレーム数に到達すると決定ボタンを押さなくても通知は自動で消去されます
,	FRAMEMAX: 180
	// 画像の表示位置 0:左中央, 1:右中央, 2:上中央, 3:下中央, 4:左上, 5:左下, 6:右上, 7:右下, 8:画面中央（本来の描画位置）
,	BASEPOS: 8
	// 表示位置補正x(正の値で右に, 負の値で左に補正), y(正の値で下に, 負の値で上に補正)
,	POSX: 0
,	POSY: 0
	// 通知画像のUIにタイトル(内部名が *_tietle)を使用する場合は true ウィンドウ(内部名が *_window)を使用する場合はfalse
,	UITYPE: true
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
	var obj;
	var dx = 0, dy = 0;
	var xPadding = DefineControl.getWindowXPadding();
	var yPadding = DefineControl.getWindowYPadding();

	if (this._counter.getCounter() < SlideSetting.INTERVAL) {
		obj = this._getSlideDirection(SlideSetting.DIRECTION, titleWidth, titleHeight);
		dx += obj.dx;
		dy += obj.dy;
	}
	else if (SlideSetting.FRAMEMAX - this._counter.getCounter() < SlideSetting.INTERVAL) {
		obj = this._getEraseDirection(SlideSetting.DIRECTION, titleWidth, titleHeight);
		dx -= obj.dx;
		dy -= obj.dy;
	}
	else {
		dx = 0;
		dy = 0;
	}
	
	// 表示位置 0:左中央, 1:右中央, 2:上中央, 3:下中央, 4:左上, 5:左下, 6:右上, 7:右下, 8:中央
	switch (SlideSetting.BASEPOS) {
		case 0: x = xPadding; break;
		case 1: x = root.getGameAreaWidth() - titleWidth - xPadding; break;
		case 2: y = yPadding; break;
		case 3: y = root.getGameAreaHeight() - titleHeight - yPadding; break;
		case 4: x = xPadding; y = yPadding; break;
		case 5: x = xPadding; y = root.getGameAreaHeight() - titleHeight - yPadding; break;
		case 6: x = root.getGameAreaWidth() - titleWidth - xPadding; y = yPadding; break;
		case 7: x = root.getGameAreaWidth() - titleWidth - xPadding; y = root.getGameAreaHeight() - titleHeight - yPadding; break;
		case 8: break;
		default: break;
	}
	
	x += SlideSetting.POSX;
	y += SlideSetting.POSY;
	
	if (SlideSetting.UITYPE === true) {
		TitleRenderer.drawTitle(pic, x + dx, y + dy, width, height, count);
	} else {
		WindowRenderer.drawStretchWindow(x + dx, y + dy, titleWidth, titleHeight, pic);
	}
	
	x += 30;
	y += 18;
	this.drawNoticeViewContent(x + dx, y + dy);
};

ItemChangeNoticeView._getSlideDirection = function(direction, titleWidth, titleHeight) {
	var obj = {};
		obj.dx = 0;
		obj.dy = 0;
	
	switch (direction) {
		case 0: //左からスライド
			obj.dx = Math.ceil(this._counter.getCounter() * (titleWidth / SlideSetting.INTERVAL) - titleWidth);
			obj.dy = 0;
			break;
		case 1: //右から
			obj.dx = Math.ceil(titleWidth - this._counter.getCounter() * (titleWidth / SlideSetting.INTERVAL));
			obj.dy = 0;
			break;
		case 2: //上から
			obj.dx = 0;
			obj.dy = Math.ceil(this._counter.getCounter() * (titleHeight / SlideSetting.INTERVAL) - titleHeight);
			break;
		case 3: //下から
			obj.dx = 0;
			obj.dy = Math.ceil(titleHeight - this._counter.getCounter() * (titleHeight / SlideSetting.INTERVAL));
			break;
		case 4: //左上から
			obj.dx = Math.ceil(this._counter.getCounter() * (titleWidth / SlideSetting.INTERVAL) - titleWidth);
			obj.dy = Math.ceil(this._counter.getCounter() * (titleHeight / SlideSetting.INTERVAL) - titleHeight);
			break;
		case 5: //左下から
			obj.dx = Math.ceil(this._counter.getCounter() * (titleWidth / SlideSetting.INTERVAL) - titleWidth);
			obj.dy = Math.ceil(titleHeight - this._counter.getCounter() * (titleHeight / SlideSetting.INTERVAL));
			break;
		case 6: //右上から
			obj.dx = Math.ceil(titleWidth - this._counter.getCounter() * (titleWidth / SlideSetting.INTERVAL));
			obj.dy = Math.ceil(this._counter.getCounter() * (titleHeight / SlideSetting.INTERVAL) - titleHeight);
			break;
		case 7: //右下から
			obj.dx = Math.ceil(titleWidth - this._counter.getCounter() * (titleWidth / SlideSetting.INTERVAL));
			obj.dy = Math.ceil(titleHeight - this._counter.getCounter() * (titleHeight / SlideSetting.INTERVAL));
			break;
		case 8: //スライドしない
			obj.dx = 0;
			obj.dy = 0;
			break;
		default: //左からスライド
			obj.dx = Math.ceil(this._counter.getCounter() * (titleWidth / SlideSetting.INTERVAL) - titleWidth);
			obj.dy = 0;
			break;
	}
	
	return obj;
};
	
ItemChangeNoticeView._getEraseDirection = function(direction, titleWidth, titleHeight) {
	var obj = {};
		obj.dx = 0;
		obj.dy = 0;
	
	switch (direction) {
		case 0: //左からスライド
			obj.dx = Math.ceil(titleWidth - (SlideSetting.FRAMEMAX - this._counter.getCounter()) * (titleWidth / SlideSetting.INTERVAL));
		obj.dy = 0;
			break;
		case 1: //右から
			obj.dx = Math.ceil((SlideSetting.FRAMEMAX - this._counter.getCounter()) * (titleWidth / SlideSetting.INTERVAL) - titleWidth);
			obj.dy = 0;
			break;
		case 2: //上から
			obj.dx = 0;
			obj.dy = Math.ceil(titleHeight - (SlideSetting.FRAMEMAX - this._counter.getCounter()) * (titleHeight / SlideSetting.INTERVAL));
			break;
		case 3: //下から
			obj.dx = 0;
			obj.dy = Math.ceil((SlideSetting.FRAMEMAX - this._counter.getCounter()) * (titleHeight / SlideSetting.INTERVAL) - titleHeight);
			break;
		case 4: //左上から
			obj.dx = Math.ceil(titleWidth - (SlideSetting.FRAMEMAX - this._counter.getCounter()) * (titleWidth / SlideSetting.INTERVAL));
			obj.dy = Math.ceil(titleHeight - (SlideSetting.FRAMEMAX - this._counter.getCounter()) * (titleHeight / SlideSetting.INTERVAL));
			break;
		case 5: //左下から
			obj.dx = Math.ceil(titleWidth - (SlideSetting.FRAMEMAX - this._counter.getCounter()) * (titleWidth / SlideSetting.INTERVAL));
			obj.dy = Math.ceil((SlideSetting.FRAMEMAX - this._counter.getCounter()) * (titleHeight / SlideSetting.INTERVAL) - titleHeight);
			break;
		case 6: //右上から
			obj.dx = Math.ceil((SlideSetting.FRAMEMAX - this._counter.getCounter()) * (titleWidth / SlideSetting.INTERVAL) - titleWidth);
			obj.dy = Math.ceil(titleHeight - (SlideSetting.FRAMEMAX - this._counter.getCounter()) * (titleHeight / SlideSetting.INTERVAL));
			break;
		case 7: //右下から
			obj.dx = Math.ceil((SlideSetting.FRAMEMAX - this._counter.getCounter()) * (titleWidth / SlideSetting.INTERVAL) - titleWidth);
			obj.dy = Math.ceil((SlideSetting.FRAMEMAX - this._counter.getCounter()) * (titleHeight / SlideSetting.INTERVAL) - titleHeight);
			break;
		case 8: //スライドしない
			obj.dx = 0;
			obj.dy = 0;
			break;
		default: //左からスライド
			obj.dx = Math.ceil(titleWidth - (SlideSetting.FRAMEMAX - this._counter.getCounter()) * (titleWidth / SlideSetting.INTERVAL));
			obj.dy = 0;
			break;
	}
	
	return obj;
};

	
})();
