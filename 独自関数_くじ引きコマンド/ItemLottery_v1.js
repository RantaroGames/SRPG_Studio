/*
■注意事項
本スクリプトを使用するにはQBU氏が作成されたプラグイン"CSVをパースする.js"を導入する必要があります。
QBU氏のGitHubへのリンク https://github.com/QBE256

■ファイル名
ItemLottery_v1.js

■SRPG Studio対応バージョン
ver.1.254

■プラグインの概要
イベントコマンドを通じてランダムに武器やアイテムを入手します。(いわゆる「ガシャ」方式）

正確には、本プラグインで取得するのはアイテムのidです。
イベントコマンド<スクリプトの実行>でコードを実行した結果を任意の変数で受け取り、
その変数を基に<アイテムの増減>イベントを通じてアイテムを入手する形式になります。

■使用方法
本プラグインを使用してアイテム抽選イベントを実装するには、主として２つの準備が必要になります。
一つは、プラグイン導入時の設定で、もう一つはイベントコマンドの設定になります。

1.プラグイン導入時の設定方法
1-1．本プラグインおよび、CSVをパースする.jsをPluginフォルダにいれる
1-2-1．Materialフォルダに 'LotterySample' フォルダを作成する
1-2-2.'LotterySample' フォルダ内に 'LotteryItems.csv' と 'Rarity.csv' ファイルを作成する
1-3．'LotteryItems.csv' および 'Rarity.csv' ファイルにcsv形式※でデータを設定する

* フォルダ名とファイル名は任意のものを付けても構いません。
  ただし、その場合は本プラグインの設定項目も変更してください。(設定項目は180行付近にあります)

※'Rarity.csv' の設定項目

rarity(*1), weight(*2)

*1:レアリティ。整数値を指定してください。(文字列の場合、一致するか否かの判定に一手間いったり、設定ミスが発生しやすいので整数に限定しています)
   数値は任意に決めて構いませんが、連番にしてレアリティの高い物を大きな値にする方が判別し易いと思われます。
*2:レアリティ毎の重み。1以上の整数値で設定すること。
   この時、1は確率1%(0.01)「ではない」点に注意してください。確率は、重み/重みの総和になります。
   
   下記の例1だとレアリティ５の確率は1/1000=0.1%, レアリティ0は89/1000=8.9%ですが、例2ではレアリティ5の確率は1/1011です。
   この確率は、レアリティを決定するものです。同一レアリティに複数の景品を設定した場合、特定の景品が抽選される確率は、1/同レアリティの景品総数になります。
   例1でレアリティ5のアイテムを10個登録していた場合、特定の景品が出現する確率は0.1/10= 0.01%ということです。

//設定例1-------------------
5,1
4,10
3,100
2,300
1,500
0,89
//-------------------------

//設定例2-------------------
5,1
4,10
3,1000
//-------------------------

※'LotteryItems.csv' の設定項目

id(*3),rarity(*4),ItemName(*5)

*1:id。武器は、エディタ上のidを記入。アイテムは、エディタのid+100000。ハズレ(景品無し)を設ける場合id:-1にしてください
*2:該当アイテムのレアリティ。 'Rarity.csv' で設定したレアリティに存在する数値を設定してください。 
*3:アイテム名。データ設定の際、認識し易くする為の項目。テストプレイ時、コンソールに表示されます。(省略可)

//景品リスト設定例------------
100012,5,蘇生の杖
4,4,連撃の剣
15,4,邪悪な斧
1,3,吸収の槍
100013,3,回復の杖
8,2,
100000,5,クリティカルガード
100004,3,武術の教え
100001,2,癒しの葉
0,1,修行用の剣
7,1,修行用の槍
12,1,舞い上がる風
-1,0,ハズレ
//-------------------------

2.エディタ上での「くじ引きイベント」実行方法
2-1.以下の操作でコードの実行に関する手順は
    イベントコマンド <スクリプトの実行> を使用し、種類「・コード実行」を選択します

2-2.くじデータの初期化
    タイトルシーンに入った時、csvファイルからデータを環境ファイルにコピーします
	この処理は、毎回自動で行われます(ゲームファイルの更新時にDBを変更していた場合を想定しています)

2-3．くじ引きイベントの実行
 　　Fnc_getLottery.getRandomItems(); をコードに記述し
 
	「戻り値を変数で受け取る」にチェックを入れて、任意の「id変数」を指定してください
	(※id変数のタブが表示されていない場合、変数設定のオプションタブで該当項目にチェックを入れてください）
	
2-4.当選アイテムの入手方法
    イベントコマンド <アイテムの増減> を使用して、2-3で指定した「id変数」をアイテム欄に設定してください
	(ハズレを設けている場合は、「コマンドの条件：指定のid変数が-1ちょうど」で任意のイベント(メッセージタイトル等)を実行してください)


■オプション
3.特定のレアリティの出現率を操作するには
3-1.くじ引きイベントの前に次のコードを実行します。*引数には配列を指定します

   Fnc_getLottery._setTempRarity(*配列);
   
   ※記述例(上記、設定例1から変更した時)
   Fnc_getLottery._setTempRarity(
     [ [5,10], [4, 100], [3, 100], [2, 300], [1, 490], [0, 0] ]
   );
   
   この時、重みの総和を変更していないのでレアリティ5とレアリティ4の出現率は元の10倍になり、レアリティ1は2％低下し、レアリティ0は出現しなくなります
   
3-2.レアリティの出現率を元のcsvデータに戻すには、次のコードを実行します
   
   Fnc_getLottery._resetTempRarity();
   
4．特定のアイテムを出現しやすくするには
4-1.くじ引きイベントの前に次のコードを実行します。*引数には配列を指定します

   Fnc_getLottery.setPickUp_EnvData(*配列);
   
   ※記述例(景品リスト設定例を基に変更）
   Fnc_getLottery.setPickUp_EnvData(
     [ [100012, 3], [4, 2], [15, 4], [1, 5] ]
   );
   
   id:100012(蘇生の杖)は追加で3つレアリティ毎の景品リストに登録されます(これはピックアップされていない景品と比べて4倍抽選されやすいという意味を持ちます)
   同様にid:4(連撃の剣)は2つ、id:15(邪悪な斧)は４つ、id:1(吸収の槍)は5つ、各レアリティ毎のリストに追加登録されます
   
4-3.ピックアップを元に戻すには、次のコードを実行します

   Fnc_getLottery.setPickUp_GlobalData([]);


■動作説明
本プラグインにおけるランダムアイテムのid取得方式は
SRPG Studioの乱数取得関数root.getRandomNumber()とcsvファイルで設定したデータを使用します。

乱数は、(1~'Rarity.csv' で設定した重みの総和)の整数値を取ります。
得られた乱数を基に'Rarity.csv'で設定したレアリティを抽選します。

'LotteryItems.csv'で設定した景品リストから同一レアリティにあるアイテムのみを抽出し
その中から獲得する景品のエディタ上のid(*アイテムは+65536)を返します。

例：(レアリティ群が設定例1の場合)
乱数103の時。重みを加算して{103 <= 1+10+100(=111)}となるので当選レアリティは3
景品リストでレアリティ3の品は[1, 100013, 100004]の3品(indexは左から0,1,2)
ここからindexを求めて(103mod3=1) index:1の'回復の杖'のid:100013を得ます。
id:100000台はエディタ上でのアイテム(武器ではない)を意味するので、この値に（-10000+65536)を計算して最終的にid:65549を返します。

■作成者
ran

■更新履歴
2022/03/01 新規作成
2022/03/06 乱数の取得に関する不具合を修正

*/

(function() {

// ゲーム起動時にcsvファイルからデータを環境パラメータにコピーする
var _SetupControl_setup = SetupControl.setup;
SetupControl.setup = function() {
	_SetupControl_setup.call(this);
	
//	root.watchTime();	
	Fnc_getLottery.setUpData();	
//	root.log('time:Fnc_getLottery.setUpData ' + root.getElapsedTime() + 'ms');	
};

})();

//---------------------------------------------------------
// Materialフォルダに置いたDB用のフォルダとcsvファイル名
// フォルダ名とファイル名を変更した時は、以下の変数の値を対応させてください
//---------------------------------------------------------
// フォルダ名
var LOTTERY_FOLDER_NAME = 'LotterySample';
// レアリティの出現率を設定したcsvファイル
var LOTTERY_DB_RARITY_NAME = 'Rarity.csv';
// 景品リストを設定したcsvファイル
var LOTTERY_DB_PRIZES_NAME = 'LotteryItems.csv';

//---------------------------------------------
// csvファイルの設定データを基に抽選を行う関数
//---------------------------------------------

var Fnc_getLottery = {
	
	_rarity: null,
	_sample: null,
	_random: 0,
	
	// くじ引きイベントに必要なデータの初期設定を行います
	setUpData: function() {
		this.setRarity_EnvData();
		this.setSample_EnvData();
	},
	
	init: function() {
		this._rarity = this.getCurrentRarity();
		this._sample = this.getSample_EnvData();
		this._random = 0;
	},
	
	// 現在使用するのレアリティ別出現度合いを取得する
	getCurrentRarity: function() {
 		var tempRarity = this._getTempRarity();
		if (typeof tempRarity !== 'undefined') {
			return tempRarity;
		}
		return this.getRarity_EnvData();
	},
	
	getRarity_EnvData: function() {
		if (Object.prototype.toString.call(root.getExternalData().env.LotteryDB_Rarity) !== '[object Array]') {
			root.getExternalData().env.LotteryDB_Rarity = [];
		}
		
		return root.getExternalData().env.LotteryDB_Rarity;
	},
	
	// 環境パラメータにレアリティ毎の出現度合いを記録する
	setRarity_EnvData: function() {
		var rarity = readCSVFile(LOTTERY_FOLDER_NAME, LOTTERY_DB_RARITY_NAME);
		
		root.getExternalData().env.LotteryDB_Rarity = rarity;
	},
	
	_getTempRarity: function() {
		return root.getMetaSession().global.LotteryDB_TempRarity;
	},
	
	// レアリティ毎の出現度合いを一時的に変更する
	// セーブデータに依存させたいのでglobalパラメータに保存する
	_setTempRarity: function(arr) {
		if (Object.prototype.toString.call(arr) !== '[object Array]') {
			root.msg('Fnc_getLottery._setTempRarity　の引数が配列型でありません');
			return;
		}
 		
		var i, data;
		for (i = 0; i < arr.length; i++) {
			data = arr[i];
			if (data === null) {
				root.msg('Fnc_getLottery._setTempRarity 引数'+ i +'番のデータがありません');
				return;
			}
			if (typeof arr[i][0] !== 'number') {
				root.msg('Fnc_getLottery._setTempRarity 引数'+ i +'番データ rarityが数値ではありません');
				return;
			}
			if (typeof arr[i][1] !== 'number') {
				root.msg('Fnc_getLottery._setTempRarity 引数'+ i +'番データ weightが数値ではありません');
				return;
			}
		}
//		root.log('tempRarity:' + arr);

		root.getMetaSession().global.LotteryDB_TempRarity = arr;
	},
	
	_resetTempRarity: function() {
		delete root.getMetaSession().global.LotteryDB_TempRarity;
	},
	
	// 景品データをcsvファイルから取得する
	getEventsFromCSVFile: function() {
		return readCSVFile(LOTTERY_FOLDER_NAME, LOTTERY_DB_PRIZES_NAME);
	},
	
	getSample_EnvData: function() {
		if (typeof root.getExternalData().env.LotteryDB_Sample === 'undefined') {
			root.getExternalData().env.LotteryDB_Sample = {};
		}
		
		return root.getExternalData().env.LotteryDB_Sample;
	},
	
	// csvファイルのデータを基に環境パラメータにレアリティ毎の景品リストを記録する(pickUpは考慮しない)
	// この処理は、game.exe起動時にに毎回行われる(ゲームのプロジェクトファイル更新時に、くじのDBが変更されていた時に環境パラメータの情報も更新するため)
	// LotteryDB_Sampleオブジェクトはrarityの数値を名前(arr_5等)にした配列を作成する。この配列は要素に[id, name]を持つ
	setSample_EnvData: function() {
		var events = this.getEventsFromCSVFile();
		var rarity = this.getRarity_EnvData();
		
		root.getExternalData().env.LotteryDB_Sample = this._getSample(events, rarity);
	},

 	getPickUp_GlobalData: function() {
		if (Object.prototype.toString.call(root.getMetaSession().global.LotteryDB_PickUp) !== '[object Array]') {
			root.getMetaSession().global.LotteryDB_PickUp = [];
		}
		
		return root.getMetaSession().global.LotteryDB_PickUp;
	},
	
	// pickUpする景品のidと追加挿入する回数をグローバルパラメータに記録する
	// pickUpは、セーブデータに依存させた方が良いのでenvではなくglobalに保存する
	// arr @ [ [itemId, addCount]... ]
	setPickUp_GlobalData: function(arr) {
		if (Object.prototype.toString.call(arr) !== '[object Array]') {
			root.msg('Fnc_getLottery.setPickUp_EnvData の引数が配列型ではありません\n空の配列で代替します');
			arr = [];
		}
		
		root.getMetaSession().global.LotteryDB_PickUp = arr;
	},
	
	// レアリティ毎に景品を分けた配列を持つオブジェクトを作成する
	// このメソッドではpickUpを考慮しない
	_getSample: function(events, rarity) {
		var i, j, obj;
		var count = events.length;
		var sample = {};
		var arrName = '';
		
		for (i = 0; i < count; i++) {
			if (events[i] === null || typeof events[i] === 'undefined') continue;
			
			obj = events[i];
			
			if (typeof obj[1] !== 'number') {
				root.msg('LotteryItems.csvの'+ i　+'番' + obj[2] + ' レアリティが数値ではありません\nリストの最後が改行されて空欄になっている可能性もあります');
				continue;
			}
			if (this._checkRarity(obj[1], rarity) === false) {
				root.msg(obj[2] + 'のレアリティがRarity.csvに存在しません');
				continue;
			}
			
			// LotteryItems.csvから取得したアイテムのレアリティ(数値)を加えた名前の配列を作成してアイテムを追加していく
			arrName = 'arr_' + obj[1];
//			root.log(i + ':' + obj[2]+ ':' + arrName);
			if (typeof sample[arrName] === 'undefined') {
				sample[arrName] = [];
			}
			
			// sample[arrName] @ [[id, アイテム名]...]
			sample[arrName].push([obj[0], obj[2]]);
		}
		
		return sample;
	},
	
	// ピックアップアイテムを当選レアリティ別の景品リストに追加した配列を返す
	_setPickUpItems: function(table) {
		var i, j, obj;
		var pickUpItems = [];
		var pickUpCount = 0;
		var pickUp = this.getPickUp_GlobalData();
		
		//　pickUpアイテムを追加で格納する
		for (i = 0; i < table.length; i++) {
			obj = table[i];
			pickUpCount = this._getPickUpItems(obj[0], pickUp);
//			root.log('pickUp:' + pickUpCount + ':' + obj[1]);
				
			for (j = 0; j < pickUpCount; j++) {
				// sample[arrName] @ [[id, アイテム名]...]
				pickUpItems.push([obj[0], obj[1]]);
			}
		}
		
		table = table.concat(pickUpItems);
		
		return table;
	},
	
	_checkRarity: function(value, rarity) {
		for (var i = 0; i < rarity.length; i++) {
			if (rarity[i][0] === value) {
				return true;
			}
		}
		return false;
	},
	
	// 乱数を取得する
	getRandom: function() {
		var probTotal = 0;
		var i;
		
		// Rarity.csvで設定したレアリティ毎の重みの総和を求める
		for (i = 0; i < this._rarity.length; i++) {
			if (typeof this._rarity[i][1] !== 'number') continue;
			probTotal += this._rarity[i][1];
		}
		
		root.log('probTotal:' + probTotal);
		if (probTotal < 1) {
			root.msg('probTotalが不正です。値が1未満な為、1を返します');
			return 1;
		}
		
		// randomは、1～重みの総和
		return root.getRandomNumber() % probTotal + 1;
	},
	
	// 取得した乱数から当選の有無を決定して景品のidを返す
	getRandomItems: function() {
		
		this.init();
		root.log('RarityArr:' + this._rarity);
		
		this._random = this.getRandom();
		root.log('random:' + this._random);
		
		// レアリティを抽選する
		var rarity = this._getRarityBylot();
		root.log('当選Rarity:' + rarity);
		
		if (this._checkRarity(rarity, this._rarity) === false) {
			root.msg('当選したレアリティの値:' + rarity + 'がRarity.csvに存在しません');
			return -1;
		}
		
		var arrName = 'arr_' + rarity;
		var itemesTable = [];
		var index, count;
		var id = -1;
		
		//root.log('samplearr:' + this._sample[arrName].length);
		// 当選レアリティを基にアイテムテーブルを選択し、pickUp中のアイテムを追加する
		itemesTable = this._setPickUpItems(this._sample[arrName]);
		count = itemesTable.length;
		
		// indexを求めて景品のidを取得する
		if (count < 1) {
			id = -1;
			root.msg('レアリティ' + rarity + 'のリストにアイテムがありません');
		}
		else {
			index = root.getRandomNumber() % count;
			//root.log('itemsTable' + rarity + ' index:' + index + ' len:' + count);
			
			// csvファイルのデータをidに代入した値をエディタ側が変数で受け取ってくれなかったのでparseInt()で整数値に変換している
			id = parseInt(itemesTable[index][0], 10);
		}

		// DBでid100000台は、アイテム(武器ではない)として設定している。これからItemIdValue.BASEの値を引くとエディタのアイテムidになる
		// その上で id+65536 にすることでid変数を利用してアイテムの増減コマンドを利用できる
		// ItemIdValue.BASE = 100000; @ constants-enumeratedtype.js
		if (id >= 100000) {
			id += -100000 + 65536;
		}
		root.log('結果:' + itemesTable[index][1] + ' id:' + id);
		
		return id;
	},
	
	_getRarityBylot: function() {
		var i, result = -1;
		var accum = 0;
		
		for (i = 0; i < this._rarity.length; i++) {
			if (typeof this._rarity[i][1] !== 'number') continue;
			
			accum += this._rarity[i][1];
			//root.log('accum:' + accum);
			
			if (this._random <= accum) {
				result = this._rarity[i][0];
				break;
			}
		}
		
		return result;
	},
	
	// pickUpで指定した値の回数、景品群の配列に余分に追加する
	_getPickUpItems: function(id, pickUp) {
		var i, data;
		
		for (i = 0; i < pickUp.length; i++) {
			data = pickUp[i];
			
			if (data === null) continue;
			if (data[0] !== id) continue;
			
			if (typeof data[1] !== 'number') {
				return 1;
			}
			else {
				return data[1];
			}
		}
		
		return 0;		
	}
};
