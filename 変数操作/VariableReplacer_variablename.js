/*
■ファイル
VariableReplacer_variablename.js

■SRPG Studio対応バージョン:1.241

■プラグインの概要
変数の名前を取得して表示する制御文字の処理を実装します

■使用方法
このファイルをpluginフォルダに入れる

\van1[0]と記述する
(他の制御文字と同様の書式)
上記の例では、1がグループ数 [0]が変数のidになります

■作成者
ran
*/

(function() {

var alias1 = VariableReplacer._configureVariableObject;
VariableReplacer._configureVariableObject = function(groupArray) {
	alias1.call(this, groupArray);
	groupArray.appendObject(DataVariable.VaName);
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

})();