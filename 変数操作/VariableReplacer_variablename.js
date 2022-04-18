/*
■ファイル
VariableReplacer_variablename.js

■SRPG Studio対応バージョン:1.241

■プラグインの概要
以下2つの制御文字を追加します

・変数の名前を取得して表示する制御文字

・自軍ユニットの現在の名前を取得する制御文字※

※この制御文字を追加する意図
制御文字\pdb[0]は、BaseData（エディタで設定されているデータ）から自軍ユニットを取得しています
この制御文字は、自軍にまだ加入していないユニットの名前も取得できる反面、<ユニットの情報変更>で名前を変更した場合に変更後の値を取得することはできません
新たに追加した\tpn[0]を用いることで、自軍に加入しているユニットの現時点での名前を取得できるようになります
ただし、まだ自軍加入していないユニットは取得できないことに注意してください


■使用方法
このファイルをpluginフォルダに入れる

・変数の名前を取得する制御文字
\van1[0]と記述する
(他の制御文字と同様の書式)
上記の例では、1がグループ数 [0]が変数のidになります

・自軍加入済みユニットの現在の名前を取得する制御文字
\tpn[ユニットid]

■作成者
ran


■更新履歴
2022/04/18 自軍加入済みユニットの現在の名前を取得する制御文字を追加

*/

(function() {

var alias1 = VariableReplacer._configureVariableObject;
VariableReplacer._configureVariableObject = function(groupArray) {
	alias1.call(this, groupArray);
	groupArray.appendObject(DataVariable.VaName);
	groupArray.appendObject(DataVariable.TotalPlayerName);
};

DataVariable.VaName = defineObject(BaseDataVariable,
{
	getReplaceValue: function(text) {
		var page = this.getIndexFromKey(text);
		var id = this.getIdFromKey(text);
		var table = root.getMetaSession().getVariableTable(page - 1);
		var index = table.getVariableIndexFromId(id);
		
		return table.getVariableName(index)
	},
	
	getIndexFromKey: function(text) {
		var key = /\\van(\d+)\[\d+\]/;
		var c = text.match(key);
		
		return Number(c[1]);
	},
	
	getKey: function() {
		var key = /\\van\d+\[(\d+)\]/;
		
		return key;
	}
});

DataVariable.TotalPlayerName = defineObject(BaseDataVariable,
{
	getReplaceValue: function(text) {
		var i, data;
		var id = this.getIdFromKey(text);
		var result = '';
		var list = this.getList();
		var count = list.getCount();
		
		if (count < 0) {
			return 'getTotalPlayerList取得に失敗';
		}
		
		for (i = 0; i < count; i++) {
			data = list.getData(i);
			if (data.getId() === id) {
				result = data.getName();
				break;
			}
		}
		
		if (i === count) {
			return 'id:' + id +'のユニットが自軍に加入していない';
		}
		
		return result;
	},
	
	getList: function() {
		return root.getMetaSession().getTotalPlayerList();
	},
	
	getKey: function() {
		var key = /\\tpn\[(\d+)\]/;
		
		return key;
	}
}
);

})();