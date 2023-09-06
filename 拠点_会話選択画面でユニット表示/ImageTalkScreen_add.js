/*

■ファイル名
ImageTalkScreen_add.js

■SRPG Studio対応バージョン
ver.1.286

■プラグインの概要
拠点の「会話選択」画面でイベントに関連したユニットの顔画像などを表示します。
エディタ本来の機能で画像を設定していた場合、その上に本プラグインによる画像が描画されます。


※注意点
本プラグインを導入すると、拠点設定>詳細>オプション>「ゲーム時に会話選択で画像を表示する」にチェックを入れていない場合でも
会話イベントリストのウィンドウの表示位置が画面下部に固定されます。


■使用方法
1．このファイルをpluginフォルダに入れる
2.拠点イベントの設定>会話イベント>各イベントのカスタムパラメータに以下の値を設定する
3.本プラグイン内の設定項目に必要な値を記述する(66行目付近)

・会話イベント>詳細情報>カスタムパラメータに設定する値（配列）

{
  UnitIdArr: [
    {id:3, posX: 100, posY: 0}
  , {id:0, posX: 300, posY: 0}
  ]
}

・ユニットidだけ指定したい場合

{
  UnitIdArr: [
    {id:1}, {id:0}, {id:4}
  ]
}

id: 表示したいユニットのID 自軍に加入済みのユニットのみ対応。NPCや敵などは表示できません
posX: キャライラストを表示したい場合に使用する描画開始位置のx座標
posY: 同じくy座標

※posXとposYはキャライラストを表示しない場合は省略可能です
※配列の順番に従って描画されます。イラストが重なる場合、後ろのイラスト程上に描画されます
※idで指定したユニットに紐づけられた画像（顔画像、立ち絵、キャラチップ）が表示されます
※顔画像は96*96サイズで描画されます（大きい顔画像を使用している場合でも同じです）
※表情差分は考慮されません。表情id:0の物を使用します


■作成者
ran

■更新履歴
2023/09/05 新規作成

*/


(function() {

//-----------------------------------
// 設定項目
//-----------------------------------
var Config_ImageTalk = {
	
	// 表示させたい画像の形式
	// 0:顔画像 1:キャライラスト(立ち絵) 2:キャラチップ
	GraphicsType: 0
	,
	// 使用したいウィンドウUI
	// ツール>リソース箇所>テキストUIのウィンドウ項目の内部名 ''で囲う
	WindowUI: 'default_window'
	,
	// 顔画像やキャラチップの表示位置を調整したい時は以下の数値を変更してください
	// 立ち絵を表示している場合は、この数値は無視されます（カスタムパラメータで個別に調整可能なため）
	ImagePosX: 0
	,
	ImagePosY: 0
	,
	// ウィンドウ画像の描画位置を調整したい場合
	WindowPosX: 0
	,
	WindowPosY: 0
	
};

//-----------------------------------

// エディタの拠点設定>詳細>オプション>「ゲーム時に会話選択で画像を表示する」にチェックを入れていない場合でも会話イベントリストのウィンドウを画面下部に表示させる

ImageTalkScreen.drawScreenCycle = function() {
	if (root.getRestPreference().isTalkGraphicsEnabled()) {
		// エディタで設定した画像を表示する関数
		// 本プラグインで追加する処理と競合しかねないが、ここで背景イラストを表示させてその上に追加でユニットを表示したりといった演出も可能なため残している
		this._drawTalkImage();
	}
	
	// カスタムパラメータで設定したユニットを表示する関数(新規)
	this._drawRelationshipUnit();
	
	// 会話イベントリストウィンドウの表示位置を画面下部に固定する
	this._drawBottomWindow();
/* 		}
		else {
			this._drawCenterWindow();
		} */
};


ImageTalkScreen._drawRelationshipUnit = function() {
	var entry = this._imageTalkWindow.getChildScrollbar().getObject();
	var idArray, arr, unit, id, i, count, list;
	var posX = 0;
	var posY = 0;
	
	// 会話イベントが取得できない時は即終了する
	if (entry === null) return;

	// 会話イベントのカスタムパラーメータに表示したいユニットのidを配列で設定しておく
	// 配列が取得できない場合は終了
	idArray = entry.event.custom.UnitIdArr;
 	if (Object.prototype.toString.call(idArray) !== '[object Array]') return;

	list = PlayerList.getMainList();
	count = idArray.length;
	arr = [];
	
	for (i = 0; i < count; i++) {
		id = idArray[i].id;
		if (typeof id !== 'number') continue;

		unit = list.getDataFromId(id);
		if (unit === null) continue;

		posX = typeof idArray[i].posX === 'number' ? idArray[i].posX : 0;
		posY = typeof idArray[i].posY === 'number' ? idArray[i].posY : 0;
		
		arr.push([unit, posX, posY]);
//		root.log(unit.getName() + 'posX' + posX + ' posY' + posY);
	}
	
	switch (Config_ImageTalk.GraphicsType) {
		case 0: this._drawFaceImage(arr); break;
		case 1: this._drawCharaIllustImage(arr); break;
		case 2: this._drawCharaChipImage(arr); break;
		default: return;
	}
};

// 顔画像を表示する関数
// 大きい顔画像を使用している場合も96*96サイズで描画している
ImageTalkScreen._drawFaceImage = function(arr) {
	var unit, i, pic, x, y, dx, dy;
	var count = arr.length;
	var windowpic = null;
	var textui = root.queryTextUI(Config_ImageTalk.WindowUI);
	var xPadding = 16;
	var yPadding = 3;
	var width = GraphicsFormat.FACE_WIDTH;//root.isLargeFaceUse() ? root.getLargeFaceWidth() : GraphicsFormat.FACE_WIDTH;
	var totalwidth = width * count + 10 * (count - 1) + xPadding * 2;
	var height = GraphicsFormat.FACE_HEIGHT;//root.isLargeFaceUse() ? root.getLargeFaceHeight() : GraphicsFormat.FACE_HEIGHT;
		height = height + yPadding * 2;
		
	//root.log(totalwidth);
	
	x = Math.floor( (root.getGameAreaWidth() - totalwidth) / 2 );
	
	// 会話イベントリストウィンドウの高さ（y座標）を求めてその分を差し引いている
	dy = Math.floor(root.getGameAreaHeight() * 0.125);
	y = root.getGameAreaHeight() - this._imageTalkWindow.getWindowHeight() - dy - height;
	
	
	// ウィンドウを描画する
	if (textui !== null) {
		windowPic = textui.getUIImage();
	}
		
	if (windowPic !== null) {
		WindowRenderer.drawStretchWindow(x + Config_ImageTalk.WindowPosX, y + Config_ImageTalk.WindowPosY, totalwidth, height, windowPic);
	}	
	
	// 	顔画像を表示する
	for (i = 0; i < count; i++) {
		unit = arr[i][0];
		if (unit === null) continue;
		
		// 余白+顔画像サイズ+10
		dx = xPadding + (GraphicsFormat.FACE_WIDTH + 10) * i + Config_ImageTalk.ImagePosX;
		dy = yPadding + Config_ImageTalk.ImagePosY;
		
		ContentRenderer.drawUnitFace(x + dx, y + dy, unit, false, 255);
	}
};

// キャライラスト(立ち絵)を表示する処理
// イラストはたとえキャンパスのサイズが一定だったとしても実際に描画される人物の向きや背の高さなどが異なるので画一的な位置の算出が難しい
// 描画開始位置をカスタムパラメータで直接指定することで対応してもらう
ImageTalkScreen._drawCharaIllustImage = function(arr) {
	var unit, i, pic;
	var count = arr.length;
	var facialExpressionId = 0;
	var x = 0;
	var y = 0;
	
	for (i = 0; i < count; i++) {
		unit = arr[i][0];
		if (unit === null) continue;
		
		pic = unit.getCharIllustImage(facialExpressionId);
		if (pic === null) continue;
		
		x = arr[i][1];
		y = arr[i][2];
		
		pic.draw(x, y);
	}
};

// キャラチップを表示する処理
ImageTalkScreen._drawCharaChipImage = function(arr) {
	var unit, i, pic, x, y, dx, dy;
	var count = arr.length;
	var windowpic = null;
	var textui = root.queryTextUI(Config_ImageTalk.WindowUI);
	var xPadding = 16;
	var yPadding = 3;
	var width = GraphicsFormat.CHARCHIP_WIDTH;
	var totalwidth = width * count + 10 * (count - 1) + xPadding * 2;
	var height = GraphicsFormat.CHARCHIP_HEIGHT;
		height = height + yPadding * 2;
		
	//root.log(totalwidth);
	
	x = Math.floor( (root.getGameAreaWidth() - totalwidth) / 2 );
	
	// 会話イベントリストウィンドウの高さ（y座標）を求めてその分を差し引いている
	dy = Math.floor(root.getGameAreaHeight() * 0.125);
	y = root.getGameAreaHeight() - this._imageTalkWindow.getWindowHeight() - dy - height;
	
	
	// ウィンドウを描画する
	if (textui !== null) {
		windowPic = textui.getUIImage();
	}
		
	if (windowPic !== null) {
		WindowRenderer.drawStretchWindow(x + Config_ImageTalk.WindowPosX, y + Config_ImageTalk.WindowPosY, totalwidth, height, windowPic);
	}	
	
	var unitRenderParam = StructureBuilder.buildUnitRenderParam();
	
	for (i = 0; i < count; i++) {
		unit = arr[i][0];
		if (unit === null) continue;
		
		dx = 30 + (GraphicsFormat.CHARCHIP_WIDTH + 10) * i + Config_ImageTalk.ImagePosX;
		dy = 20 + Config_ImageTalk.ImagePosY;
		
		unitRenderParam.handle = null;
		UnitRenderer.drawDefaultUnit(unit, x + dx, y + dy, unitRenderParam);
	}
};


})();
