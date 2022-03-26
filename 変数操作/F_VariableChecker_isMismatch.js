/*
■ファイル
F_VariableChecker_isMismatch.js

■プラグインの概要
　引数で指定したvalueと参照した変数の値が「異なっていたら」trueを返す

■使用方法
　このファイルをpluginフォルダに入れる
　イベントコマンドの「コマンドの実行条件：スクリプト」にチェックを入れて以下の一文を記述する


f_VariableChecker_isMismatch (pageindex, id, value);


・引数に指定する数値の説明:
pageindex = ページ左から0,1,2,3,4,5(5=id変数)
id = 比較する変数のid
value = 判定に使用する数値

※指定した変数を取得できなかった場合
指定されたページのid:0の値が参照される(id:0が存在しない場合、値は0として扱われる。エディタの仕様？)
ページ指定が不正だった場合は、オブジェクトが取得できずnullとなってエラーになります

■SRPG Studio対応バージョン:1.220
*/

//スクリプト--------
function f_VariableChecker_isMismatch(pageindex, id, value)
{
	var table = root.getMetaSession().getVariableTable(pageindex);
	var index = table.getVariableIndexFromId(id);
	var variable = table.getVariable(index);
	
	return variable !== value;
}
//----------ここまで
