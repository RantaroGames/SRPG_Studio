/*
■ファイル名
ItemControl_isItemUsable_mod.js

■SRPG Studio対応バージョン
ver.1.258

■プラグインの概要
ステート（封印 &　アイテム）に特定のアイテムタイプのみ封印する処理を追加します。

アイテムタイプを複数作成している場合に特定のタイプ（例えば、装備品等）のみ封印する目的で使用します。

またSスタ本体の仕様では、ステート（封印 &　アイテム）はアイテム（道具）だけでなくアイテム（杖）の使用も禁止ますが
カスタムパラメータを設定することで道具のみ使用不可にして、杖タイプのアイテムは使用可能にするということも可能です。

■使用方法
1.このプラグインをpluginフォルダに入れる
2．ステートに封印（アイテム）を設定し、カスタムパラメータに以下の値を記述する
(ステートはバッドステートでなくても良いが、封印（アイテム）の設定は必須)
カスタムパラメータを設定していない場合、通常通りすべてのアイテム（杖も含む）を使用不能にします。

{
  sealItemType: [1, 3]
}

@ sealItemType: {Array} 封印したいアイテムタイプのidを要素に持つ配列を記述します。
  配列は[]で括ります。各要素はアイテムタイプのid(数値)を記述し、複数ある場合は,(カンマ)で区切ります。

  アイテムタイプのidは、コンフィグ>武器タイプ>アイテムのタブで確認できます。
  (デフォルトでは、id:0 杖　id:1 アイテムとなっています)

■競合に関する注意点
ItemControlオブジェクトは他のプラグインでも変更が加えられていることが多いため競合が発生する可能性が大きくなります。
本スクリプトは新規プロジェクトでの動作確認を行っていますが、その範囲を超えた動作を保証するものではありません。
競合が発生した場合、該当するプラグインとの間で記述をマージしてください。
あるいは、ファイルのリネームによる読み込み順の変更で解消する場合もあります。

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2022/05/11 新規作成

*/

(function() {

var _ItemControl_isItemUsable = ItemControl.isItemUsable;
ItemControl.isItemUsable = function(unit, item) {
	var result = _ItemControl_isItemUsable.call(this, unit, item);
	
	// 本来の処理で結果がtrueならそのまま返す
	if (result) return result;
	
	// itemが武器なら本来の処理(false)を返す
	if (item.isWeapon()) return result;
	
	// 封印ステートに設定した武器タイプとアイテムのタイプが不一致の場合、改めてアイテムの使用可能条件を判定する
	if (StateControl.isBadStateFlag_isWeaponTypeMatched(unit, item) === false) {
		if (item.isWand()) {
			// アイテムが杖の場合は、クラスが杖を使用できなければならない
			if (!(unit.getClass().getClassOption() & ClassOptionFlag.WAND)) {
				return false;
			}
			// 杖の使用が禁止されているか調べる
			if (StateControl.isBadStateFlag(unit, BadStateFlag.WAND)) {
				return false;
			}
		}
		
		// ver.1.288対応
		// ItemControl._isItemTypeAllowedで専用鍵とドーピングアイテムの使用可否処理が行われるようにった
		if (root.getScriptVersion() >= 1288) {
			if (!this._isItemTypeAllowed(unit, item)) {
				return false;
			}
		} else {
			if (item.getItemType() === ItemType.KEY) {
				if (item.getKeyInfo().isAdvancedKey()) {
					// 「専用鍵」の場合は、クラスが鍵を使用できなければならない
					if (!(unit.getClass().getClassOption() & ClassOptionFlag.KEY)) {
						return false;
					}
				}
			}
		}
		
		// 「専用データ」を調べる
		if (!this.isOnlyData(unit, item)) {
			return false;
		}
		
		return true;
	}
	
	return result;
};


// StateControlオブジェクトにメソッドを追加
// ステート(封印 & アイテム)のカスタムパラメータに特定タイプのアイテムを防ぐ処理を実装する
StateControl.isBadStateFlag_isWeaponTypeMatched = function(unit, item) {
	var i, state, arr, j;
	var list = unit.getTurnStateList();
	var count = list.getCount();
	
	for (i = 0; i < count; i++) {
		state = list.getData(i).getState();
		if (state.getBadStateFlag() & BadStateFlag.ITEM) {
			arr = state.custom.sealItemType;
			// 封印ステートのカスタムパラメータが[配列]ではない(未設定も含む)場合は、封印成功
 			if (Array.isArray(arr) === false) return true;
			
			// カスタムパラメータとアイテムタイプリストのidが一致している場合のみ封印する
			for (j = 0; j < arr.length; j++) {
				if (arr[j] === item.getWeaponType().getId()) return true;
			}
		}
	}
	
	return false;
};


//----------------
// polyfill
//----------------

if(!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}

})();
