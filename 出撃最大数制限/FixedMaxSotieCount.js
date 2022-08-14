/*
■ファイル
FixedMaxSotieCount.js

■SRPG Studio対応バージョン:1.263

■プラグインの概要
mapの最大出撃数をエディタで設定した数値以下に制限します

・プラグインの使用例
エディタで出撃位置を10か所設定した上で出撃ユニットを5人に絞りたい場合に使用します
(本来の仕様では、自軍ユニット数が多い場合、設定した出撃位置数まで出撃可能になってしまうため)

■使用方法
1.このファイルをpluginフォルダに入れる
2.mapのカスタムパラメータに最大出撃許可数を設定する

{
  fixedSortieMaxCount: 1以上の整数値(※)
}

※mapの最大出撃数を超える値を設定した場合は、最大出撃数を採用する

■他プラグインへの対策
RequiredSotieUnitCount.js(最低出撃数を設定するプラグイン。以下、該当プラグイン)を導入している場合
FixedMaxSotieCount.js(以下、本プラグイン)で設定した最大出撃数よりも該当プラグインで設定した最低出撃数が大きいと出撃開始が許可されません。
その場合は、カスタムパラメータの設定を見直してください。

2022/08/13付けで該当プラグインに本プラグインに対応する処理を加えてあります。
該当プラグインの66行目付近のコメントアウトを解除してください。

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2022/08/13 新規作成
2022/08/14 カスタムパラメータのスペルミスを修正

*/
(function() {

// 出撃最大数をマップ情報のカスタムパラメータで指定した値に制限する関数
function f_SortieFixedMaxCount(maxCount)
{
	var mapInfo = root.getCurrentSession().getCurrentMapInfo();
	var fixedMaxCount = mapInfo.custom.fixedSortieMaxCount;
	
	if (typeof fixedMaxCount === 'number' &&
		fixedMaxCount > 0 &&
		fixedMaxCount < maxCount)
	{
		maxCount = fixedMaxCount;
	}
	
	return maxCount;
}


SortieSetting._getSortieFixedMaxCount = function(maxCount) {
	return f_SortieFixedMaxCount(maxCount);
};

SortieSetting._setInitialUnitPos = function() {
	var i, unit;
	var list = PlayerList.getAliveList();
	var count = list.getCount();
	var maxCount = this._sortiePosArray.length;
	var sortieCount = 0;
	
	// マップ情報のカスタムパラメータで制限した最大出撃許可数を取得する
	maxCount = this._getSortieFixedMaxCount(maxCount);

	// 現在のマップの戦闘準備画面で一度でもセーブを行うと、isFirstSetupはfalseを返す
	if (!root.getMetaSession().isFirstSetup()) {
		// 現在のユニット位置を基準に、_sortiePosArrayのunitを初期化する
		this._arrangeUnitPos();
		return;
	}

	// 初めて戦闘準備画面が表示される場合は、後続の処理によって出撃状態が自動で設定される
	
	this._clearSortieList();
		
	// 強制出撃(位置指定あり)のユニットを、順に出撃状態にする
	for (i = 0; i < count && sortieCount < maxCount; i++) {
		unit = list.getData(i);
		if (this.isForceSortie(unit)) {
			if (this._sortieFixedUnit(unit)) {
				sortieCount++;
			}
		}
	}
	
	// 強制出撃(位置指定なし)のユニットを、順に出撃状態にする
	for (i = 0; i < count && sortieCount < maxCount; i++) {
		unit = list.getData(i);
		if (this.isForceSortie(unit) && unit.getSortieState() !== SortieType.SORTIE) {
			if (this._sortieForceUnit(unit)) {
				sortieCount++;
			}
		}
	}
	
	// それ以外のユニットを、順に出撃状態にする
	for (i = 0; i < count && sortieCount < maxCount; i++) {
		unit = list.getData(i);
		if (unit.getSortieState() !== SortieType.SORTIE) {
			if (this._sortieUnit(unit)) {
				sortieCount++;
			}
		}
	}
};

SortieSetting.nonsortieUnit = function(unit) {
	var i;
	var count = this._sortiePosArray.length;

	count = this._getSortieFixedMaxCount(count);
	
	for (i = 0; i < count; i++) {
		if (typeof this._sortiePosArray[i] === 'undefined') {
			break;
		}
		if (this._sortiePosArray[i].unit === unit) {
			this._sortiePosArray[i].unit = null;
			break;
		}
	}
	
	unit.setSortieState(SortieType.UNSORTIE);
};

SortieSetting._sortieUnit = function(unit) {
	var i;
	var count = this._sortiePosArray.length;

	count = this._getSortieFixedMaxCount(count);
	
	for (i = 0; i < count; i++) {
		if (typeof this._sortiePosArray[i] === 'undefined') {
			break;
		}
		if (this._sortiePosArray[i].unit === null && this.isSortie(unit)) {
			unit.setSortieState(SortieType.SORTIE);
			this.assocUnit(unit, this._sortiePosArray[i]);
			return true;
		}
	}
	
	return false;
};

/*
SceneManager.getActiveScene().getSortieSetting().getDefaultSortieMaxCount();だと
〈マップの情報変更〉でエディタで設定していた出撃数よりも多く出撃数を変更した時に最大数の取得が正しく行われなくなる
*/

UnitSortieListScrollbar._getSortieFixedMaxCount = function() {
	var maxCount = SceneManager.getActiveScene().getSortieSetting().getSortieArray().length;

	return f_SortieFixedMaxCount(maxCount);
};

UnitSortieListScrollbar.playSelectSound = function() {
	var object = this.getObject();
	var isSelect = true;
	
	if (this._isForceSortie(object)) {
		isSelect = false;
	}
	else if (!this._isSortie(object)) {
		isSelect = false;
	}
	else if (SceneManager.getActiveScene().getSortieSetting().getSortieCount() === this._getSortieFixedMaxCount()) {
		if (object.getSortieState() === SortieType.SORTIE) {
			isSelect = true;
		}
		else {
			isSelect = false;
		}
	}
	
	if (isSelect) {
		MediaControl.soundDirect('commandselect');
	}
	else {
		MediaControl.soundDirect('operationblock');
	}
};


UnitSortieScreen._getSortieFixedMaxCount = function() {
	var maxCount = SceneManager.getActiveScene().getSortieSetting().getSortieArray().length;

	return f_SortieFixedMaxCount(maxCount);
};

UnitSortieScreen._drawMemberData = function(x, y, textui) {
	var text;
	var color = textui.getColor();
	var font = textui.getFont();
	var digitWidth = DefineControl.getNumberSpace();
	var count = SceneManager.getActiveScene().getSortieSetting().getSortieCount();
//	var maxCount = SceneManager.getActiveScene().getSortieSetting().getDefaultSortieMaxCount();
	var maxCount = this._getSortieFixedMaxCount();
	
	NumberRenderer.drawNumberColor(x, y, count, 1, 255);
	
	x += digitWidth;
	text = '/';
	TextRenderer.drawKeywordText(x, y, text, -1, color, font);
	
	x += TextRenderer.getTextWidth(text, font);
	x += digitWidth;
	NumberRenderer.drawNumberColor(x, y, maxCount, 1, 255);
};

})();
