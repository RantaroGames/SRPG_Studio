/*
■ファイル名
EC_ShowItemInfowindow.js

■SRPG Studio対応バージョン
var.1.249

■プラグインの概要
イベントコマンド〈プラグインの実行〉を使用した際に
オリジナルデータで指定したアイテムまたはスキルの情報ウィンドウを表示する

※注意点
テロップウィンドウのようにイベントコマンドを実行した時のみ表示される(キー押下でイベントを進めると表示は消える)

■使用方法
1.このプラグインをpluginフォルダに入れる

2.イベントコマンド〈プラグインの実行〉を使用する

・イベントの種類(イベントコマンド呼出し)

・オブジェクト名
OriginalEC_ShowItemInfoWindow

・プロパティ(省略可)
{
  infotype: 0 // 0:item, 1:skill, 省略または不正な値の時：item
, isCenterShow: true // Boolean値、ture:中央表示、false:座標指定、略または不正な値の時：true扱い
, x: 0 //　pixelX座標、isCenterShowがfalse以外の時は無効
, y: 0 //　pixelY座標　isCenterShowがfalse以外の時は無効 infowindowを基準に描画するためタイトルの高さ(60)未満の値を指定するとタイトル上部が見切れる
}

・オリジナルデータ
表示したいアイテムまたはスキルを指定する

■作成者
ran

■更新履歴
2021/12/21 新規作成
2021/12/22 変数宣言のミスを修正
2021/12/28 下部ウィンドウにアイテム説明文を表示するように対応


*/

(function() {

var alias1 = ScriptExecuteEventCommand._configureOriginalEventCommand;
ScriptExecuteEventCommand._configureOriginalEventCommand = function(groupArray) {
	alias1.call(this, groupArray);
	
	groupArray.appendObject(EC_ShowItemInfoWindow);
};

/* var INFOWINDOW_TYPE  = {
	ITEM   : 0,
	SKILL  : 1
}; */

var EC_ShowItemInfoWindow = defineObject(BaseEventCommand, 
{
	_item: null,
	_itemInfoWindow: null,
	
	_skill: null,
	
	_infoType: 0,
	_isCenterShow: true,
	_posX: 0,
	_posY: 0,
	
	_waitCounter: null,
	_isForceWait: true,

	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
	
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		if (!this._isForceWait) {
			if (InputControl.isSelectAction()) {
				return MoveResult.END;
			}
		}
		else if (this._waitCounter.moveCycleCounter() !== MoveResult.CONTINUE) {
			this._isForceWait = false;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawEventCommandCycle: function() {
		var pos = this._getBasePos();
		var x, y, obj, dy;
		
		if (this._isCenterShow) {
			x = pos.x;
			y = pos.y;
			//root.log('x:' + x + ', y:' + y);
		}
		else {
			x = this._posX;
			y = this._posY;
		}
		
		this._itemInfoWindow.drawWindow(x, y);
		this._drawNoticeViewWindow(x, y);
		
		obj = (this._infoType === 1) ? this._skill : this._item;
		dy = this._itemInfoWindow.getWindowHeight() + TitleRenderer.getTitlePartsHeight();
		this._drawDescription(x, y + dy, obj);
	},
	
	getEventCommandName: function() {
		return 'OriginalEC_ShowItemInfoWindow';
	},
	
	_prepareEventCommandMemberData: function() {
		var eventcommandObject = root.getEventCommandObject();
		var arg = eventcommandObject.getEventCommandArgument();
		
		this._isCenterShow = (typeof arg.isCenterShow === 'boolean') ? arg.isCenterShow : true;
		
		if (this._isCenterShow === false) {
			this._posX = (typeof arg.x === 'number') ? arg.x : 0;
			this._posY = (typeof arg.y === 'number') ? arg.y : 0;
		}
		
		switch(arg.infotype) {
			case 0:  this._infoType = 0;
					 this._itemInfoWindow = createWindowObject(ItemInfoWindow);
					 break;
			case 1:  this._infoType = 1;
					 this._itemInfoWindow = createWindowObject(SkillInfoWindow);
					 break;
			default: this._infoType = 0;
					 this._itemInfoWindow = createWindowObject(ItemInfoWindow);
					 break;
		}
		
		this._waitCounter = createObject(CycleCounter);
		this._isForceWait = true;
	},
	
	_checkEventCommand: function() {
		return this.isEventCommandContinue();
	},
	
	_completeEventCommandMemberData: function() {
		var content = root.getEventCommandObject().getOriginalContent();
		this._item = content.getItem();
		this._skill = content.getSkill();
		
		if (this._item === null || this._skill === null) {
			return  EnterResult.NOTENTER;
		}
		
		switch(this._infoType) {
			case 0:  this._itemInfoWindow.setInfoItem(this._item);
					 this._setTitlePartsCount(this._item);
					 break;
			case 1:  this._itemInfoWindow.setSkillInfoData(this._skill, ObjectType.NULL);
					 this._setTitlePartsCount(this._skill);
					 break;
			default: this._itemInfoWindow.setInfoItem(this._item);
					 this._setTitlePartsCount(this._item);
					 break;
		}
		
		this._waitCounter.disableGameAcceleration();
		this._waitCounter.setCounterInfo(30);
		
		return EnterResult.OK;
	},
	
	_drawNoticeViewWindow: function(x, y) {
		var textui = this._getTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		var titleui = this._getTitleTextUI();
		var pic = titleui.getUIImage();
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		var count = this._titlePartsCount;
		
		var dx = TitleRenderer.getTitlePartsWidth();
		var dy = height - 6;
		var dy2 = dy - 18; 
		
		if (pic !== null) {
			TitleRenderer.drawTitle(pic, x, y - dy, width, height, count);
		}
		
		if (this._infoType === 1) {
			var handle = this._skill.getIconResourceHandle();
			var RenderParam = StructureBuilder.buildGraphicsRenderParam();
			GraphicsRenderer.drawImageParam(x + dx, y - dy2, handle, GraphicsType.ICON, RenderParam);
			TextRenderer.drawKeywordText(x + dx + 28, y - dy2, this._skill.getName(), -1, color, font);
		}
		else {
			ItemRenderer.drawItem(x + dx, y - dy2, this._item, color, font, false);
		}
	},
	
	_drawDescription: function(x, y, obj) {
		var screen = root.queryScreen('UnitMenu');
		var textui = screen.getBottomFrameTextUI();
		var description = '';
		
		if (obj !== null) {
			description = obj.getDescription();
		}

		TextRenderer.drawScreenBottomText(description, textui);
	},
	
	_setTitlePartsCount: function(obj) {
		var font = this._getTitleTextUI().getFont();
		var textWidth = TextRenderer.getTextWidth(obj.getName(), font) + (TitleRenderer.getTitlePartsWidth() * 2);
		
		this._titlePartsCount = Math.floor(textWidth / TitleRenderer.getTitlePartsWidth());
	},
	
	_getNoticeViewWidth: function() {
		return (this._titlePartsCount + 2) * TitleRenderer.getTitlePartsWidth();
	},
	
	_getTextUI: function() {
		return root.queryTextUI('default_window');
	},
	
	_getTitleTextUI: function() {
		return root.queryTextUI('objective_title'); //'support_title'
	},
	
	_getBasePos: function() {
		var x = LayoutControl.getCenterX(-1, ItemRenderer.getItemWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._itemInfoWindow.getWindowHeight() + TitleRenderer.getTitlePartsHeight());
		
		return createPos(x, y);
	}
}
);

})();
