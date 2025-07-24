/*
■ファイル名
MapIconDecorator_WEAPONTYPE.js

■SRPG Studio対応バージョン
ver.1.316以上
(ver.1.280以降であれば、装備中の武器のアイコンを表示する機能を利用できます)

■プラグインの概要
装備中の武器タイプを示すアイコンをキャラチップ上に表示します
(ステートアイコンの表示と同じ処理を利用しています)

// 描画処理自体をgame.exeで行うことで、スクリプトで描画するよりも高速になる。
(公式scriptのMapHpDecoratorオブジェクトのコメントより引用)

■使用方法
1.このプラグインをpluginフォルダに入れる
2．データ設定>コンフィグ>武器タイプの各データにアイコンを設定する

※アイコンの表示位置を変更したい場合
本プラグイン内の設定項目 POSX および POSY の数値を変更してください

※アイコンの点滅方式を変更したい場合
設定項目の FLASHING の真偽値を変更してください

※表示するアイコンの種別を変更したい場合
設定項目の ICONWEAPONTYPE の真偽値を変更してください。スクリプトバージョン1.316以上で有効です
true  装備している武器の武器タイプのアイコンを表示します
false 装備している武器のアイコンを表示します

※アイコンの大きさ
キャラチップの表示を邪魔しないように規定size24*24いっぱいの絵柄よりも
16*16程度で描かれたアイコンを使用すると良いかもしれません

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md


■更新履歴
2025/07/25 新規作成

*/


(function() {
	
// 表示するアイコンの設定項目
var Setting = {
	// 描画するx座標
	POSX: 0
	// 描画するy座標
,	POSY: 0
	// 点滅させる: true 点滅させない: false
, 	FLASHING: true
	// 武器タイプのアイコンを表示する: true 装備している武器のアイコンを使用する: false
,	ICONWEAPONTYPE: true
};

var _alias001 = MapIconDecorator._addDecorationData;
MapIconDecorator._addDecorationData = function(obj) {
	_alias001.call(this, obj);
	
	if (ConfigItem.IconDecoration_WEAPONTYPE.getFlagValue() === 0) {
		var scriptVersion = root.getScriptVersion();
		
		if (scriptVersion >= 1316) {
			var iconType = Setting.ICONWEAPONTYPE ? IconDecorationType.WEAPONTYPE : IconDecorationType.EQUIPWEAPON;
			
			// 引数(x座標, ｙ座標, アイコンタイプ, 点滅する:true/しない:false)
			obj.addObjectType(Setting.POSX, Setting.POSY, iconType, Setting.FLASHING);
		}
		else if (scriptVersion >= 1280) {
			// スクリプトバージョン1280以降であれば「IconDecorationType.EQUIPWEAPON」が実装されているので装備中の武器アイコンを利用できる
			obj.addObjectType(Setting.POSX, Setting.POSY, IconDecorationType.EQUIPWEAPON, Setting.FLASHING);
		}
		else {
			root.msg('MapIconDecorator_WEAPONTYPEは ScriptVersion1316以上に対応しています');
		}
	}
};


// 環境設定
var aliasConfigItem = ConfigWindow._configureConfigItem;
ConfigWindow._configureConfigItem = function(groupArray) {
	aliasConfigItem.call(this, groupArray);
	
	groupArray.appendObject(ConfigItem.IconDecoration_WEAPONTYPE);
};

ConfigItem.IconDecoration_WEAPONTYPE = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getExternalData().env.IconDacorationWEAPONTYPE = index;
		MapIconDecorator.setupDecoration();
	},
	
	getFlagValue: function() {
		if (typeof root.getExternalData().env.IconDacorationWEAPONTYPE !== 'number') {
			return 1;
		}
	
		return root.getExternalData().env.IconDacorationWEAPONTYPE;
	},
	
	getFlagCount: function() {
		return 2;
	},
	
	getConfigItemTitle: function() {
		return '武器タイプ表示';
	},
	
	getConfigItemDescription: function() {
		return 'ユニットが装備している武器タイプを識別するアイコンを表示します';
	}
}
);

})();