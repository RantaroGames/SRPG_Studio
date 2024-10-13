/*
出撃かつ生存しているユニットの現在HPの総和を求める関数

・使用方法
 スクリプトの実行>コード実行>コード欄にFnc_TotalHP(unitType, isDefault)を記述
 (引数の説明)
   unitType:  数値   0 自軍 1 敵軍 2 友軍
   isDefault: 真偽値 true フュージョンされているユニットも考慮する false フュージョンされているユニットは除く
 戻り値を変数で受け取る
*/

function Fnc_TotalHP(unitType, isDefault)
{
	var list, i, count, unit;
	var result = 0;
	
	if (root.getBaseScene() === SceneType.REST) {
		if (unitType === 0) {
			// 拠点では生存ユニットのリストを取得
			list = PlayerList.getAliveList();
		} else {
			// 拠点では敵、友軍リストは無いので0を返す
			return 0;
		}
	}
	else {
		switch (unitType) {
			case 0 : 
				list = isDefault ? PlayerList.getSortieDefaultList() : PlayerList.getSortieList();
				break;
			case 1 : 
				list = isDefault ? EnemyList.getAliveDefaultList() : EnemyList.getAliveList();
				break;
			case 2 : 
				list = isDefault ? AllyList.getAliveDefaultList() : AllyList.getAliveList();
				break;
			default: 
				return 0;
		}
	}
	
	count = list.getCount();
	for (i = 0; i < count; i++) {
		unit = list.getData(i);
		if (unit === null) continue;

		// 非表示状態のユニットのHPも加算したい場合は以下のif分をコメントアウト
		if (unit.isInvisible() === true) continue;
		
		if (unitType !== 0) {
			// 敵、友軍ユニットで出撃状態にないユニットのHPも加算したい場合は下のif分をコメントアウト
			if (unit.getSortieState() !== SortieType.SORTIE) continue;
		}		
		
		result += unit.getHp();
//		root.log(unit.getName() + ': ' + unit.getHp());
	}
	
	return result;
}