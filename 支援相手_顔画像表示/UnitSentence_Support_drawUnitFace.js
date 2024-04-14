/*
■ファイル
UnitSentence_Support_drawUnitFace.js

■SRPG Studio対応バージョン:1.291

■プラグインの概要
UnitSentenceWindowの「支援相手」表示欄にユニットの顔画像を縮小表示します。

・機能追加
支援ランクを表示できるようにしました。

■使用方法
1.このファイルをpluginフォルダに入れる

※画像のサイズや表示位置を変更したい場合は下記コード内「設定項目」の該当箇所を変更してください。


・支援ランクを文字で表示する機能用の説明
支援ランクを表示するためにユニットのカスタムパラメータに指定する値を設定しなくてはなりません。

カスタムパラメータの表記例
{
  supportDataArray:[ [1, 2], [3, 1] ]	
}

@ supportDataArray 配列
配列の要素は、[ 支援相手のid, 現在のランクの数値 ]
支援相手がプレイヤーユニット以外場合(敵同士で支援を設定しているなど)は
エディタ上のidではなく、ゲーム内で確認できるidの値を記述してください。
（例：エディタ上でid:0の敵ユニットのidは65536 ）

ゲームレイアウト > コマンドレイアウト > ユニット概要の項目を表示させることでmap上でのidが確認できるようになります。 

・ユニットのidはエディタ上のidに特定の値を加算することで求められます
ENEMY      id+65536  (=2^16)
ENEMYEVENT id+131072 (=2^16*2)
ALLY       id+196608 (=2^16*3)
ALLYEVENT  id+262144 (=2^16*4)
GUEST      id+393216 (=2^16*6)
GUESTEVENT id+458752 (=2^16*7)

※カスタムパラメータの設定方法
A.支援を成立させた時点でイベントコマンドを通じてカスタムパラメータを設定する
<スクリプトの実行>を選択

タブ：スクリプトの設定
・コード実行のコードボックスに以下のメソッドを記述する
UnitCustomParameterContorol._setArrayData(targetId, value);

targetId: 支援相手になるユニットのid
value: 支援ランクの数値

タブ：オリジナルデータの設定
ユニットの項目にカスタムパラメータを設定するユニットを指定する


双方向の支援が成立しているならAの作業をそれぞれのユニットに対して行う



B.ユニットのカスタムパラメータに事前に記述しておく
既に支援が成立した状態で登場するユニットであれば、ユニットのカスタムパラメータに値を設定しておくことができます



■競合が発生した場合は
本プラグインでは処理の都合上、元の支援対象の描画処理を使用していません。
他のプラグインとの競合が発生した場合は、本プラグイン内の変数をtrueにしたり
(119行付近) var useOriginalMethod = true;

プラグインのリネームやフォルダ階層移動によって読み込み順が変わることで解消される可能性があります。


■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2022/10/23 新規作成
2024/03/02 支援ランクを文字表示する機能を追加
2024/03/03 異なる同名ユニット(複数の同名モブ敵など)に支援を設定していた場合の表示不具合を修正
2024/04/14 NPCのid確認方法を説明欄に追記

*/

(function() {

//------------------------------------------
// 設定項目
//------------------------------------------

// 表示する顔画像のサイズ(幅,高さは同じ値と規定する)
var FaceImageSize = 24;

// 顔画像の描画開始位置のx座標補正(値を大きくすると左へ移動)
var ImagePosX = 12;

// 支援相手の名前表示開始x座標補正(値を大きくすると右へ移動)
var NamePosX = 20;
	
// 一行当たりの表示域の高さ(規定値は25)
// 顔画像のサイズをICONサイズ(24)より大きくした場合、行の高さを変更しないと画像が重なって表示されます
var UnitSentenceSpaceY = 25; //this._unitSentenceWindow.getUnitSentenceSpaceY();

// センテンスウィンドウの幅を広げたい場合
var WidthExtension = 0;

//------------------------------------------
// 支援ランク表示に関する設定
//------------------------------------------
// 支援ランクを文字表示する(true) / しない(false)
var isSupportRankDisplay = true;

// 支援相手の表示方法を元のスクリプトの表示を利用する(true)/しない(false)
// 他のプラグインと競合する場合 true に設定してみてください
var useOriginalMethod = false;

// 支援ランクを表示する文字の配列
var ConvertSupportRank = [ 'C', 'B', 'A', 'S' ];

// 支援ランク表示カラー （16進数表記）
var RankColor = [0xffffff, 0xffffff, 0xccff33, 0x66ff33];

//------------------------------------------

UnitSentence.Support._supportData = null;

var alias_Support_setCalculatorValue = UnitSentence.Support.setCalculatorValue;
UnitSentence.Support.setCalculatorValue = function(unit, weapon, totalStatus) {
	alias_Support_setCalculatorValue.call(this, unit, weapon, totalStatus);
	this._supportData = this._getSupportData(unit);
};

// ユニットが持つ支援データからオブジェクトを取得しておく
// {targetName: '相手の名前', handle: '顔画像のhandle', rank: 支援ランクの数値}
UnitSentence.Support._getSupportData = function(unit) {
	var i, count, data, targetUnit, obj;
	var supportArray = [];
	
	function f_getIndex(arr, targetUnit)
	{
		var i, data;
		for (i = 0; i < arr.length; i++) {
			data = arr[i];
			if (data !== null && data.targetUnit.getId() === targetUnit.getId()) {
				return i;
			}
		}
		return -1;
	}
	
	count = unit.getSupportDataCount();
	for (i = 0; i < count; i++) {
		obj = {};
		data = unit.getSupportData(i);
		targetUnit = data.getUnit();
		
		if (targetUnit !== null && data.isGlobalSwitchOn() && data.isVariableOn()) {			
			// 支援する相手が配列supportArrayに格納されていなければ支援ランクを取得する
			// 名前で判別すると複数の同名ユニットを支援相手に設定していた場合に不具合が生じる
			if (f_getIndex(supportArray, targetUnit) === -1) {
				obj.targetUnit = targetUnit;
				obj.rank = this._getSupportRank(unit, targetUnit);

				supportArray.push(obj);
			}
		}
	}

	return supportArray;
};

// ユニットのカスタムパラメータから支援相手のidに対応する支援ランクの値を取得する
// unit.custom.supportDataArray @ [[targetId, supportRank]]
UnitSentence.Support._getSupportRank = function(unit, targetUnit) {
	var i, count, data, targetId;
	var arr = unit.custom.supportDataArray;
	
	if (arr === null || typeof arr === 'undefined') return 0;

	targetId = targetUnit.getId();

	count = arr.length;
	for (i = 0; i < count; i++) {
		data = arr[i];
		if (data === null) continue;
		if (data[0] === targetId) {
			return data[1];
		}
	}
	return 0;
};

var _UnitSentence_Support_drawUnitSentence = UnitSentence.Support.drawUnitSentence;
UnitSentence.Support.drawUnitSentence = function(x, y, unit, weapon, totalStatus) {
	if (this._supportData !== null) {
		if (useOriginalMethod) {
			_UnitSentence_Support_drawUnitSentence.call(this, x + NamePosX, y, unit, weapon, totalStatus);
		}
		this._drawSupportData(x, y, unit, weapon, totalStatus);
	}
	else {
		_UnitSentence_Support_drawUnitSentence.call(this, x, y, unit, weapon, totalStatus);
	}
};

UnitSentence.Support._drawSupportData = function(x, y, unit, weapon, totalStatus) {
	var arr, i, count, obj, rank, rankColor, targetUnit;
	var textui = this.getUnitSentenceTextUI();
	var color = ColorValue.KEYWORD;
	var font = textui.getFont();
	var length = this._getTextLength();
	var dx = 96;
	
	if (!useOriginalMethod) {
		TextRenderer.drawKeywordText(x, y, StringTable.UnitSentence_Support, length, color, font);
	}
	y += this._unitSentenceWindow.getUnitSentenceSpaceY();

	arr = this._supportData;
	count = arr.length;
	
	for (i = 0; i < count; i++) {
		obj = arr[i];
		if (obj === null) continue;
		targetUnit = obj.targetUnit;
				
		// 顔画像を縮小表示する処理
		func_drawShrinkFace(x - ImagePosX, y, targetUnit.getFaceResourceHandle(), FaceImageSize, FaceImageSize);

		if (!useOriginalMethod) {
			TextRenderer.drawKeywordText(x + NamePosX, y, targetUnit.getName(), length, color, font);
		}
		
		// 支援ランクを文字表示する場合の処理
		if (isSupportRankDisplay) {
			rank = ConvertSupportRank[obj.rank];
			rankColor = RankColor[obj.rank];
	
			if (typeof rank !== 'undefined' && typeof rankColor !== 'undefined') {
				TextRenderer.drawKeywordText(x + dx, y, rank, -1, rankColor, font);
			}
			else {
				NumberRenderer.drawNumber(x + dx, y, obj.rank);
			}
		}

		y += this._unitSentenceWindow.getUnitSentenceSpaceY();
	}	
};

// 支援相手を表示するオブジェクト(オーバーライド)
/* UnitSentence.Support.drawUnitSentence = function(x, y, unit, weapon, totalStatus) {
	var i, count, data, targetUnit;
	var textui = this.getUnitSentenceTextUI();
	var color = ColorValue.KEYWORD;
	var font = textui.getFont();
	var length = this._getTextLength();
	
	TextRenderer.drawKeywordText(x, y, StringTable.UnitSentence_Support, length, color, font);
	
	y += this._unitSentenceWindow.getUnitSentenceSpaceY();
	
	count = unit.getSupportDataCount();
	for (i = 0; i < count; i++) {
		data = unit.getSupportData(i);
		targetUnit = data.getUnit();
		if (targetUnit !== null && data.isGlobalSwitchOn() && data.isVariableOn()) {
			// 顔画像を縮小表示する処理
			func_drawShrinkFace(x - ImagePosX, y, targetUnit.getFaceResourceHandle(), FaceImageSize, FaceImageSize);
			
			// 支援相手の名前を表示する処理
			TextRenderer.drawKeywordText(x + NamePosX, y, targetUnit.getName(), length, color, font);
			
			// 次の行の描画開始y座標を設定する
			y += UnitSentenceSpaceY;
		}
	}
}; */

// (描画先のx座標, y座標, リソースハンドル, 描画先の幅, 描画先の高さ)
function func_drawShrinkFace(xDest, yDest, handle, destWidth, destHeight)
{
	var pic = GraphicsRenderer.getGraphics(handle, GraphicsType.FACE);
	if (pic === null) return;
	
	var xSrc, ySrc;
	var srcWidth = GraphicsFormat.FACE_WIDTH;
	var srcHeight = GraphicsFormat.FACE_HEIGHT;
	
	if (root.isLargeFaceUse() && pic.isLargeImage()) {
		srcWidth = root.getLargeFaceWidth();
		srcHeight = root.getLargeFaceHeight();
	}
	
	xSrc = handle.getSrcX() * srcWidth;
	ySrc = handle.getSrcY() * srcHeight;
	
	// (描画先x, y, 拡大/縮小した幅, 高さ, 描画元のx座標(リソース上のx座標×画像タイプの幅), y座標, 描画元の幅, 高さ)
	pic.drawStretchParts(xDest, yDest, destWidth, destHeight, xSrc, ySrc, srcWidth, srcHeight);
}

// センテンスウィドウの幅を補正する
var _UnitSentenceWindow_getWindowWidth = UnitSentenceWindow.getWindowWidth;
UnitSentenceWindow.getWindowWidth = function() {
	return _UnitSentenceWindow_getWindowWidth.call(this) + WidthExtension;
};

})();


/*
ユニットが持つカスタムパラメータの中で指定したパラメータに任意の値を取得/設定します

・カスタムパラメータを取得したい
1.スクリプトの実行> コード実行に以下を記述する
UnitCustomParameterContorol.getCustomParameter();

2.オリジナルデータでユニットを指定し、キーワードに操作したいカスタムパラメータの名前を記述する
  指定したユニットがnullまたはキーワードを指定しなかった場合、カスタムパラメータが存在しなかった場合は、'undefined'が返ります
  
・カスタムパラメータを設定したい
1.スクリプトの実行> コード実行に以下を記述する
UnitCustomParameterContorol.setCustomParameter(value);

2.オリジナルデータでユニットを指定し、キーワードに操作したいカスタムパラメータの名前を記述する
3.引数(value)をカスタムパラメータに設定したい値を記述する
  value に指定する値は'Boolean', 'Number', 'String'型を推奨します
  指定した名前のカスタムパラメータが存在しなかった場合、新たに(値と共に)設定されます
  
 ・オリジナルデータの数値(1~6)で取得した値をカスタムパラメータに設定したい
1.スクリプトの実行> コード実行に以下を記述する
UnitCustomParameterContorol.setOriginalDataNumber(index);

2.オリジナルデータでユニットを指定し、キーワードに操作したいカスタムパラメータの名前を記述する
3.引数(index)に0～5の整数を記述する(数値1~6に対応しています)
  indexで指定した数値の値がカスタムパラメータに設定されます(indexが不正な場合は、何もせず処理を終了します)
  指定した名前のカスタムパラメータが存在しなかった場合、新たに(値と共に)設定されます
*/

var UnitCustomParameterContorol = {
	_getOriginalContent: function() {
		return root.getEventCommandObject().getOriginalContent();
	},
	
	_getUnit: function() {
		return this._getOriginalContent().getUnit();
	},
	
	_getKeyWord: function() {
		return this._getOriginalContent().getCustomKeyword();
	},
	
	// 数値1~6を取得する(引数indexは0~5を指定)
	_getValue: function(index) {
		return this._getOriginalContent().getValue(index);
	},
	
	getCustomParameter: function() {
		var content = this._getOriginalContent();
		var unit = content.getUnit();
		var keyword = content.getCustomKeyword();
		
		if (unit === null || keyword === '') {
			return;
		}
	
		return unit.custom[keyword];
	},
	
	setCustomParameter: function(value) {
		var content = this._getOriginalContent();
		var unit = content.getUnit();
		var keyword = content.getCustomKeyword();
		
		if (unit === null || keyword === '') {
			return;
		}
		
		unit.custom[keyword] = value;
	},
	
	// indexで指定したオリジナルデータの数値をカスタムパラメータに設定する
	setOriginalDataNumber: function(index) {
		var content = this._getOriginalContent();
		var unit = content.getUnit();
		var keyword = content.getCustomKeyword();
		var value;
		
		if (unit === null || keyword === '') {
			return;
		}
		
		if (typeof index !== 'number' || index < 0 || index > 5) {
//			root.log('index には 0~5 の整数を指定してください');
			return;
		}
		
		value = content.getValue(index);
		
		unit.custom[keyword] = value;
	},
	
	_setArrayData: function(targetId, value) {
		var arr = this.getCustomParameter();
		var i, count, data, index;
		
		if (Object.prototype.toString.call(arr) !== '[object Array]') {
			arr = [];
		}
		
		count = arr.length;
		for (i = 0; i < count; i++) {
			data = arr[i];
			if (data === null) continue;
			
			if (data[0] === targetId) {
				arr.splice(i, 1, [targetId, value])
				break;
			}
		}
		if (i === count) {
			arr.push([targetId, value]);
		}
		
		this.setCustomParameter(arr);
		
//		this._putLog(arr);
	},
	
	_putLog: function(arr) {
		var content = this._getOriginalContent();
		var unit = content.getUnit();
		var keyword = content.getCustomKeyword();
		var count = arr.length;
		var i;
		
		if (unit === null || keyword === '') {
			root.log('unit または keyword が不正');
			return;
		}
		if (count === 0) {
			root.log('unitのカスタムパラメータ ' + keyword +' が不正');
		}
		
		for (i = 0; i < count; i++) {
			root.log(unit.getName() + ' targetId:' + arr[i][0] + ' value:' + arr[i][1])
		}
	}
	
};
