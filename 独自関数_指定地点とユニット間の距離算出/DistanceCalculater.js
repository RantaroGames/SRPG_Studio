/*
■ファイル名
DistanceCalculater.js

■SRPG Studio対応バージョン
ver.1.251

■プラグインの概要
指定したユニットと特定地点との距離(※)を算出するメソッドを導入します
※(|ユニットx座標　- 指定x座標| + |ユニットy座標　- 指定y座標|)

・仕様
マップ開始前にこのメソッドを実行した時、ゲストやイベントユニットの出現状況によっては、リストに格納されていない場合があるので注意
ブックマークから登場させているユニットは、idが重複して割り振られる場合があるので注意が必要

距離が同値の場合はリスト上で後ろのユニットを選出する(id順ではない)
※ツール>ゲームレイアウト>コマンドレイアウト>「ユニット概要」を表示しているとリストを確認することができます

■使用方法
以下に3つの処理があります
いずれもイベントコマンド>スクリプトの実行>コード実行での使用を前提としています

・指定ユニット－座標間の距離を取得する方法
1.プロパティに以下のメソッドを記述する
Fnc_DistanceCalculater._calculateDistance();

2.「戻り値を変数で受け取る」にチェックを入れて任意の変数を指定する

3.オリジナルデータにデータを設定
ユニット：対象にしたいユニットを指定
数値1：x座標(変数も可)
数値2：y座標(変数も可)


・所属勢力のリスト中から指定地点に「最も近い/遠い」ユニットのidを取得する方法
1.プロパティに以下のメソッドを記述する
Fnc_DistanceCalculater._getPosUnitId(type, isNearest);

引数
@ type {number} player:0, enemy:1, ally:2,
@ isNearest {boolean} true:最も近いユニット　false:最も遠いユニット

2.「戻り値を変数で受け取る」にチェックを入れて任意の変数を指定する

3.オリジナルデータにデータを設定
数値1：x座標(変数も可)
数値2：y座標(変数も可)


・所属勢力のリスト中から指定地点に「最も近い/遠い」ユニットの距離を取得する方法
1.プロパティに以下のメソッドを記述する
Fnc_DistanceCalculater._getDistanceValue(type, isNearest);

引数
@ type {number} player:0, enemy:1, ally:2,
@ isNearest {boolean} true:最も近いユニット　false:最も遠いユニット

2.「戻り値を変数で受け取る」にチェックを入れて任意の変数を指定する

3.オリジナルデータにデータを設定
数値1：x座標(変数も可)
数値2：y座標(変数も可)

■作成者
ran

■更新履歴
2022/01/13 新規作成

*/

var Fnc_DistanceCalculater = {
	_calculateDistance: function() {
		var content = root.getEventCommandObject().getOriginalContent();
		var unit = content.getUnit();
		var posX = content.getValue(0);
		var posY = content.getValue(1);
		
		var distance = Math.abs(unit.getMapX() - posX) + Math.abs(unit.getMapY() - posY);
		//root.log('D:' + distance + ' unitX:' + unit.getMapX() + ' unitY:' + unit.getMapY() + ' posX:' + posX + ' posY:' + posY);

		return distance;
	},
	
	// [最も近い/遠い]ユニットを取得するメソッド
	getPosUnit: function(type, isNearest) {
		var obj = this._checkDistance(this.getDistanceArray(type), isNearest);
		//root.log('name:' + obj.unit.getName());
		return obj.unit;
	},
	
	getDistanceArray: function(type) {
		var list, i, count, unit, posUnit, distance;
		var content = root.getEventCommandObject().getOriginalContent();
		var posX = content.getValue(0);
		var posY = content.getValue(1);
		var arr = [];
		
		// 生存かつフュージョンされていないユニットのリストを取得する
		switch (type) {
			case 0   : list = PlayerList.getSortieList(); break;
			case 1   : list = EnemyList.getAliveList();   break;
			case 2   : list = AllyList.getAliveList();    break;
			default  : return -1;
		}
		
		count = list.getCount();
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			if (unit === null) continue;
			
			distance = Math.abs(unit.getMapX() - posX) + Math.abs(unit.getMapY() - posY);
			//root.log(unit.getName() + 'd:' + distance + '('+ unit.getMapX() + ', ' + unit.getMapY() + ')');
			
			arr.push([unit, distance]);
		}
		
		return arr;
	},
	
	_getPosUnitId: function(type, isNearest) {
		var obj = this._checkDistance(this.getDistanceArray(type), isNearest);
		
		if (obj.unit === null) return -1;
		
		return obj.unit.getId();
	},
	
	_getDistanceValue: function(type, isNearest) {
		var obj = this._checkDistance(this.getDistanceArray(type), isNearest);
			
		return obj.distance;
	},
	
	_checkDistance: function(arr, isNearest) {
		var distance, unit, i;
		var value = isNearest ? 500 : 0;// mapの最大は250*250
		var obj = {
				unit: null,
				distance: -1
			}
		
		if (Object.prototype.toString.call(arr) !== '[object Array]' || arr.length === 0) {
			return obj;
		}
		
		if (isNearest) {
			for (i = 0; i < arr.length; i++) {
				distance = arr[i][1];
				if (distance <= value) {
					unit = arr[i][0];
					value = distance;
				}
			}
		}
		else {
			for (i = 0; i < arr.length; i++) {
				distance = arr[i][1];
				if (distance >= value) {
					unit = arr[i][0];
					value = distance;
				}
			}
		}
		
		obj.unit = unit;
		obj.distance = value;
		
		return obj;
	}
};