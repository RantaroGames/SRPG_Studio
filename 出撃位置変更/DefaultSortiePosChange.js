/*
■ファイル
DefaultSortiePosChange.js

■SRPG Studio対応バージョン:1.263

※注意点
Ver 1.257以降でのみ使用可能

■プラグインの概要
ユニットの初期出撃位置を動的に変更する

■使用方法
1.このファイルをpluginフォルダに入れる

2.イベントコマンド〈スクリプトの実行〉・コード実行に
NewDefaultSortiePos.setPosArray(arr);を記述する

※この関数は、オープニングイベントまたはコミュニケーションイベント内でのみ実行可能です


引数arrは出撃位置の座標を要素にもつ配列を含む多次元配列
[
  [出撃位置1のx座標, y座標]
 ,[出撃位置2のx座標, y座標]
 ,[出撃位置3のx座標, y座標]
 ,...
]

・記述例
NewDefaultSortiePos.setPosArray(
 [ [3, 1], [4, 2], [5, 7], [2, 5] ]
);

指定した配列の値が不正な場合は、本来の出撃位置の座標が適用される

出撃位置の変更を解除したい場合は、下記のように記述する(引数に[])
NewDefaultSortiePos.setPosArray([]);


■使用上の注意点
・関数 NewDefaultSortiePos.setPosArray(arr)は、
マップのオープニングイベントまたはコミュニケーションイベント内でのみ実行可能です

・マップクリア時（BattleResultSceneに入った時）に出撃位置の変更を記録したグローバルパラメータは削除する仕様になっていますが、
シーンの変更を通じてマップを離れた場合、グローバルパラメータが削除されない恐れもあり得ます

※想定される状況例：
本スクリプトで出撃位置を変更したマップで〈シーンの変更〉を実行してエンディングを経た後に
クリアデータを保存した拠点からクエストマップに入った時、グローバルパラメータのデータが残ってしまい、出撃位置が変更されてしまう

対策：
シーンの変更(戦闘結果は問題なし)を使ってマップクリアを経ないでマップを離れる場合、
シーンの変更を行う前にイベントコマンド〈スクリプトの実行〉・コード実行で下記のコードを実行してください
NewDefaultSortiePos._deleteGlobal();

・他のプラグインによってBattleResultSceneを介さずにシーン変更でマップを離れる場合、
該当プラグイン内でシーン変更する処理の前に下記コードを追加してください
NewDefaultSortiePos._deleteGlobal();

■作成者
ran

■更新履歴
2022/08/11 新規作成
2022/08/14 配列の重複を削除するようにした

*/

var NewDefaultSortiePos = {
	setPosArray: function(arr) {
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		if (mapInfo === null) return;
		
		if (Object.prototype.toString.call(arr) !== '[object Array]') {
			//root.log('コード実行のプロパティが配列ではない');
			return;
		}
		
		// 重複を削除してカスタムパラメータに保存する
		root.getMetaSession().global.sortiePosArr = this._correctSortiePosArr(arr);
		
		// 変更した出撃位置に合わせてユニットの座標も変更する(ユニットの非表示状態は解除する)
		SceneManager.getActiveScene().getSortieSetting().startSortieSetting(false);
	},
	
	_deleteGlobal: function() {
		delete root.getMetaSession().global.sortiePosArr;
	},
	
	_correctSortiePosArr: function(sortiePosArr) {
		var mapIndexArray = [];
		var i, new_array;
		var result = [];
		
		// 二次元配列の重複を判定する方法が難しかったのでマップindexの配列に変換してから重複を判定している
		for (i = 0; i < sortiePosArr.length; i++) {
			mapIndexArray.push(CurrentMap.getIndex(sortiePosArr[i][0], sortiePosArr[i][1]));
		}
		//root.log('mapIndexArray ' + mapIndexArray);
		
		// 重複を取り除いておく
		function f_unique(array)
		{
			var storage = {};
			var uniqueArray = [];
			var i,value;
			
			for (i = 0; i < array.length; i++) {
				value = array[i];
				if (!(value in storage)) {
					storage[value] = true;
					uniqueArray.push(value);
				}
			}
			return uniqueArray;
		}
		
		new_array = f_unique(mapIndexArray);
		//root.log('new_array ' + new_array);
		
		for (i = 0; i < new_array.length; i++) {
			result.push([CurrentMap.getX(new_array[i]), CurrentMap.getY(new_array[i])]); 
		}
		
		return result;
	}
};


(function() {

/*
cur_map = root.getCurrentSession().getCurrentMapInfo();
新しいマップに入る際にSceneManager.resetCurrentMap();でリセットされる
*/

// マップクリア時に出撃位置変更用のグローバルパラメータを削除しておく
// グローバルパラメータの配列を残していると別のマップの出撃位置が変更されてしまう
var _BattleResultScene_setSceneData = BattleResultScene.setSceneData;
BattleResultScene.setSceneData = function() {
	delete root.getMetaSession().global.sortiePosArr;
	
	_BattleResultScene_setSceneData.call(this);
};

/* var _MapVictoryFlowEntry_enterFlowEntry = MapVictoryFlowEntry.enterFlowEntry;
MapVictoryFlowEntry.enterFlowEntry = function(battleResultScene) {
	_MapVictoryFlowEntry_enterFlowEntry.call(this, battleResultScene);
	delete root.getMetaSession().global.sortiePosArr;
}; */

// エディタで設定した出撃位置と重複するカスタムパラメータの指定は無視する
function f_correctArray(x, y, defaultsortiePosArray)
{
	var i, sortiePos;
	var count = defaultsortiePosArray.length;
	
	for (i = 0; i < count; i++) {
		sortiePos = defaultsortiePosArray[i];
		if (typeof sortiePos !== 'undefined') {
			if (sortiePos.x === x && sortiePos.y === y) {
				//root.log('重複' + i + ' x:' + sortiePos.x + ' y:' + sortiePos.y);
				return false;
			}
		}
	}
	
	return true;
}

// 重複を判定するためにエディタで設定した出撃位置の配列を変数に保存しておく
SortieSetting._defaultSortiePosArray = null;
SortieSetting._createDefaultSortiePosArray = function() {
	var i, sortiePos;
	var mapInfo = root.getCurrentSession().getCurrentMapInfo();
	var count = mapInfo.getSortieMaxCount();
	var defaultSortiePosArray = [];
	
	for (i = 0; i < count; i++) {
		sortiePos = StructureBuilder.buildSortiePos();
		sortiePos.x = mapInfo.getSortiePosX(i);
		if (sortiePos.x === -1) {
			// 本来の出撃数を超える変更がされている場合は、処理を続行しない
			break;
		}
		sortiePos.y = mapInfo.getSortiePosY(i);
		defaultSortiePosArray.push(sortiePos);
	}
	return defaultSortiePosArray;
};

var _SortieSetting_startSortieSetting = SortieSetting.startSortieSetting;
SortieSetting.startSortieSetting = function(isInvisible) {
	this._defaultSortiePosArray = this._createDefaultSortiePosArray();
	
	_SortieSetting_startSortieSetting.call(this, isInvisible);
};

// グローバルパラメータで指定した出撃位置の変更後座標(配列)を取得する
SortieSetting._getNewDefaultSortiePosArray = function(i) {
	var sortiePosArr = root.getMetaSession().global.sortiePosArr;
	var x, y, width, hight;
	
	if (cur_map === null) {
		return false;
	}
	
	if (Object.prototype.toString.call(sortiePosArr) !== '[object Array]') {
		//root.log('sortiePosArr が配列ではない');
		return false;
	}
	
	if (sortiePosArr.length <= i) {
		//root.log('sortiePosArrの要素数 ' + sortiePosArr.length + '<= 出撃位置数 '　+ i);
		return false;
	}
	
	if (typeof sortiePosArr[i] === 'undefined') {
		//root.log('sortiePosArr[' + i + '] 未定義' );
		return false;
	}
	
	if (typeof sortiePosArr[i][0] !== 'number' || typeof sortiePosArr[i][1] !== 'number') {
		//root.log('sortiePosArrの要素 ' + i + '　配列の値が数値ではない');
		return false;
	}
	
	x = sortiePosArr[i][0];
	y = sortiePosArr[i][1];
	width = cur_map.getMapWidth() - 1;
	hight = cur_map.getMapHeight() - 1;
	
	if (x < 0 || x > width || typeof x === 'undefined') {
		//root.log('sortiePosArr[' + i + ']　x座標が不正');
		return false;
	}
	if (y < 0 || y > hight || typeof y === 'undefined') {
		//root.log('sortiePosArr[' + i + ']　ｙ座標が不正');
		return false;
	}
	
	if (f_correctArray(x, y, this._defaultSortiePosArray) === false) {
		//root.log('重複エディタ ' + i + ':' + x + ', ' + y);
		return false;
	}

	return [x, y];
};

var _SortieSetting__getDefaultSortiePosX = SortieSetting._getDefaultSortiePosX;
SortieSetting._getDefaultSortiePosX = function(i) {
	var newPosArr = this._getNewDefaultSortiePosArray(i);
	
	if (newPosArr === false) {
//		return cur_map.getSortiePosX(i);
		return _SortieSetting__getDefaultSortiePosX.call(this, i);
	}
	else {
		//root.log(i + ' x ' + newPosArr[0]);
		return newPosArr[0];
	}
};

var _SortieSetting__getDefaultSortiePosY = SortieSetting._getDefaultSortiePosY;
SortieSetting._getDefaultSortiePosY = function(i) {
	var newPosArr = this._getNewDefaultSortiePosArray(i);
	
	if (newPosArr === false) {
//		return cur_map.getSortiePosY(i);
		return _SortieSetting__getDefaultSortiePosY.call(this, i);
	}
	else {
		//root.log(i + ' y ' + newPosArr[1]);
		return newPosArr[1];
	}
};


})();
