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

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md


■更新履歴
2023/01/23 環境設定の表示オンオフ設定が機能していなかった問題を修正

*/


(function() {

var _alias001 = MapIconDecorator._addDecorationData;
MapIconDecorator._addDecorationData = function(obj) {
	_alias001.call(this, obj);
	
	if (ConfigItem.IconDecoration_CLASSTYPE.getFlagValue() === 0) {
		// 引数(x座標, ｙ座標, アイコンタイプ, 点滅する:true/しない:false)
		obj.addObjectType(0, 0, IconDecorationType.CLASSTYPE, false);
	}
};


//環境設定
var aliasConfig01 = ConfigWindow._configureConfigItem;
ConfigWindow._configureConfigItem = function(groupArray) {
	aliasConfig01.call(this, groupArray);
	
	groupArray.appendObject(ConfigItem.IconDecoration_CLASSTYPE);
};

ConfigItem.IconDecoration_CLASSTYPE = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getExternalData().env.IconDacorationClassType = index;
		MapIconDecorator.setupDecoration();
	},
	
	getFlagValue: function() {
		if (typeof root.getExternalData().env.IconDacorationClassType !== 'number') {
			return 1;
		}
	
		return root.getExternalData().env.IconDacorationClassType;
	},
	
	getFlagCount: function() {
		return 2;
	},
	
	getConfigItemTitle: function() {
		return 'クラスタイプ表示';
	},
	
	getConfigItemDescription: function() {
		return 'ユニットのクラスタイプを識別するアイコンを表示します';
	}
}
);

})();