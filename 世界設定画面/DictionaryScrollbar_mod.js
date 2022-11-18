/*
エクストラ画面で表示条件を満たしていない項目の表示に関していくつか変更する
2022/11/18 新規作成
*/

(function () {

// 表示条件を満たしていない項目の名前を???から項目名を灰色表示する形式に変更する
// カスタムパラメータに{hideDataName: '文字列'}を記入してあればその文字を表示し、無ければ項目名が適用される
var _DictionaryScrollbar_drawScrollContent = DictionaryScrollbar.drawScrollContent;
DictionaryScrollbar.drawScrollContent = function(x, y, object, isSelect, index) {
	var text, format, textui, color, font, pic;
	var handle = null;
	
	// 項目を表示する場合は、本来の処理
	if (this.isNameDisplayable(object, 0)) {
		_DictionaryScrollbar_drawScrollContent.call(this, x, y, object, isSelect, index);
	}
	else {
		// ???と表示していた処理を変更し、項目名を灰色で表示する
		if (typeof object.custom.hideDataName === 'string') {
			text = object.custom.hideDataName;
		}
		else {
			text = object.getName();
		}
		
		textui = this.getTextUI();
		font = textui.getFont();
		pic = textui.getUIImage();
		color = ColorValue.DISABLE;
		format = TextFormat.LEFT;	
/*
		// アイコンは表示しない
 		if (typeof object.getIconResourceHandle !== 'undefined') {
			handle = object.getIconResourceHandle();
		}
		if (handle !== null) {
			GraphicsRenderer.drawImage(x - 10, y + 10, handle, GraphicsType.ICON);
		}
*/
		TextRenderer.drawFixedTitleText(x, y, text, color, font, format, pic, this._titleCount);
	}
};

// 表示条件を満たしていない項目の説明文を任意のものに変更する
// カスタムパラメータに{hideDataDescription: '文字列'}と記入してあればその文章を表示する
var _DescriptionChanger_setDescriptionText = DescriptionChanger.setDescriptionText;
DescriptionChanger.setDescriptionText = function(scrollbar) {
	var text;
	var index = scrollbar.getIndex();
	var event = scrollbar.getObject();
	
	// if文の条件を再度判定することになるのでcall関数で呼び出すよりオーバーライドした方が良いのかもしれない
	if (index === this._prevIndex || scrollbar.isNameDisplayable(event, 0)) {
		_DescriptionChanger_setDescriptionText.call(this, scrollbar);
	}
	else {
		text = '';
		if (typeof event.custom.hideDataDescription === 'string') {
			text = event.custom.hideDataDescription;
		}
		
		this._messageAnalyzer.setMessageAnalyzerText(text);
		this._prevIndex = index;
	}
};


})();
