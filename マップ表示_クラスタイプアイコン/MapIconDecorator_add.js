/*
■ファイル名
MapIconDecorator_add.js

■SRPG Studio対応バージョン
ver.1.249

■プラグインの概要
クラスタイプを示すアイコンをキャラチップ上に表示します
(ステートアイコンの表示と同じ処理を利用しています)

// 描画処理自体をgame.exeで行うことで、スクリプトで描画するよりも高速になる。
(公式scriptのMapHpDecoratorオブジェクトのコメントより引用)

■使用方法
1.このプラグインをpluginフォルダに入れる
2．データ設定>コンフィグ>クラスタイプの各データにアイコンを設定する

※アイコンの表示位置を変更したい場合
addObjectTypeオブジェクトの引数の座標の値を変更してください

※アイコンを点滅させたい場合
同addObjectTypeオブジェクトのfalseをtrueに変更してください

※アイコンの大きさ
キャラチップの表示を邪魔しないように規定size24*24いっぱいの絵柄よりも
16*16程度で描かれたアイコンを使用すると良いかもしれません

■作成者
ran

*/


(function() {

var _alias001 = MapIconDecorator._addDecorationData;
MapIconDecorator._addDecorationData = function(obj) {
	_alias001.call(this, obj);
	
	// 引数(x座標, ｙ座標, アイコンタイプ, 点滅する:true/しない:false)
	obj.addObjectType(0, 0, IconDecorationType.CLASSTYPE, false);
};

})();