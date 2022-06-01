/*
■ファイル
customskill-guardbydistance.js

■SRPG Studio対応バージョン:1.256

■プラグインの概要
攻撃者との距離に応じて受けるダメージを軽減します。

・ダメージ軽減率の計算
=基礎軽減率+距離(マス数)×係数
(合計が100以上は軽減率100=ダメージ0, 軽減率0以下の場合はスキルが発動しない)

・ダメージ軽減の計算順序
 攻撃のダメージ算出
→本スキルの効果(端数切捨て)
→ダメージガードスキル(エディタのスキル)効果(端数切捨て)
→生き残りの効果


■使用方法
1.このファイルをpluginフォルダに入れる
2.カスタムスキルを作成してキーワードに GuardbyDistance を記述する
3．スキルにカスタムパラメータを記述する(未設定でも可)

カスタムパラメータの値
guardParam:{
   baseValue: 'number' // 基礎ダメージ減少率、負の整数指定も可, 未設定時:0
 , magnification: 'number' // 距離毎の減少率増加の係数、負の整数指定も可, 未設定時:10
 , weaponTypeList: 'Array' // スキル発動の対象になる攻撃者の武器タイプ。未設定時：全ての武器を対象
}

// weaponTypeListの記述方法
 @ weaponTypeList: [ { categoryType: 'number', weaponTypeId: 'Array' } ]
   // 配列の要素は、オブジェクト(連想配列)
 @ categoryType: 'number'
   // データ設定>武器タイプ>タブに対応 *注意 武器カテゴリーであり、物理/魔法の区分ではない*
      WeaponCategoryType.PHYSICS (または0):戦士系
      WeaponCategoryType.SHOOT   (または1）:弓兵兵
      WeaponCategoryType.MAGIC   (または2):魔道士系
 @ weaponTypeId: 'Array'
   // データリストのidを格納した配列
   {categoryType: 0, weaponTypeId: [0, 3]} の場合、戦士系のid:0, id:3の武器が対象
   weaponTypeId:[] と指定することでそのカテゴリー全てを有効対象にする


・カスタムパラメータの設定例
{
// 他のプラグインのカスタムパラメータと併記する場合は、ここから

  guardParam:{
     baseValue: 10
   , magnification: 20 // dmg軽減率=10+20*距離(1マス=30, 2マス=50,...5マス=110...)
   , weaponTypeList: [
      { categoryType:WeaponCategoryType.PHYSICS, weaponTypeId:[1,2] } // { 戦士系, [剣,槍] }
     ,{ categoryType: 2, weaponTypeId:[] }     // { 魔道士系, [空の配列=その武器タイプ全て] }
     ,{ categoryType: 1, weaponTypeId:[0] }    // { 弓兵系, [弓] }
    ]
  }

// ここまで。記載位置に応じて　,(カンマ)を記述してください
}

■polyfill
本プラグインにはjavascriptのポリフィルをコード内に組み込んであります。
(*勉強のために導入しましたが、まだ理解不足なため正確に使用できていない部分があるかもしれません。間違いなどあれば、是非ご指摘ください)

組み込みpolyfill
Array.isArray()
Array.prototype.filter()
Array.prototype.forEach()
Array.prototype.some()
Array.prototype.reduce()

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2022/03/29 新規作成

*/

(function() {
	
// カスタムスキルのキーワード
var CustomSkillKeyword = 'GuardbyDistance';

var alias1 = SkillRandomizer.isCustomSkillInvokedInternal;
SkillRandomizer.isCustomSkillInvokedInternal = function(active, passive, skill, keyword) {
	if (keyword === CustomSkillKeyword) {
		return this._isSkillInvokedInternal(active, passive, skill);
	}
	
	return alias1.call(this, active, passive, skill, keyword);
};

// 本スキルの効果でダメージを減少させた後にエディタの「ダメージガード」スキルの発動チェックが入る
var _AttackEvaluator_ActiveAction__arrangePassiveDamage = AttackEvaluator.ActiveAction._arrangePassiveDamage;
AttackEvaluator.ActiveAction._arrangePassiveDamage = function(virtualActive, virtualPassive, attackEntry) {
	var damagePassive = attackEntry.damagePassive;
	
	// ダメージが1未満の場合は本来の処理を即座に実行する
	if  (damagePassive < 1) {
		return _AttackEvaluator_ActiveAction__arrangePassiveDamage.call(this, virtualActive, virtualPassive, attackEntry);
	}
	
	var active = virtualActive.unitSelf;
	var passive = virtualPassive.unitSelf;
	var i,　skill, guardParam;
	var distance, baseValue, magnification, curvalue, refList;
	var successedSkill = null;
	var value = 0;
	var weaponType = virtualActive.weapon.getWeaponType();
	
	var arr = SkillControl.getDirectSkillArray(passive, SkillType.CUSTOM, CustomSkillKeyword);
	var count = arr.length;
	
	for (i = 0; i < count; i++) {
		curvalue = 0;
		distance = 0;
		baseValue = 0;
		magnification = 10;
		refList = null;
		
		skill = arr[i].skill;
		if (skill === null) continue;
		
		// 彼我の距離を算定
		distance = Math.abs(active.getMapX() - passive.getMapX()) + Math.abs(active.getMapY() - passive.getMapY());
				
		guardParam = skill.custom.guardParam;
		if (typeof guardParam !== 'undefined') {
			if (typeof guardParam.baseValue === 'number') {
				baseValue = guardParam.baseValue;
			}
			if (typeof guardParam.magnification === 'number') {
				magnification = guardParam.magnification;
			}
			// @ {Array} weaponTypeList: [ { categoryType: number, weaponTypeId: array } ]
			if (Array.isArray(guardParam.weaponTypeList)) {
				refList = guardParam.weaponTypeList;
			}
		}
		
		// ダメージ軽減率を算出する
		curvalue = baseValue + distance * magnification;
//		root.log(passive.getName() + ' skill:' + skill.getName() + '　dmg軽減率: ' + curvalue);
		
		// 軽減率が1未満なら発動チェックをしない
		if (curvalue < 1) continue;
		
		// 特定のカテゴリの、特定の武器タイプIDであるか調べる
		function f_isWeaponTypeAllowed(refList, weaponType)
		{
			// 対象武器を設定したカスタムパラメータが配列ではない場合は発動を許可
			if (!Array.isArray(refList) || refList.length === 0) return true;
			
			var result = false;
			var isCategoryMatched, weaponTypeIdArray;
			
			// 対象武器とカテゴリーが一致していればカスタムパラメータに設定されたオブジェクトを返す
			// find()が良いのだろうけど、ポリフィルを導入しても上手く行かなかったのでfilter()を使用
			isCategoryMatched = refList.filter(
				function(obj)
				{
					return obj.categoryType === weaponType.getWeaponCategoryType();
				}
			);
			
//			root.log('length'  + isCategoryMatched.length);
			// カスタムパラメータの設定で同一カテゴリーを複数指定することは、そもそも設定ミスなので要素数は1が望ましい
			if (isCategoryMatched.length !== 0) {
				weaponTypeIdArray = isCategoryMatched[0].weaponTypeId;
				
				// 武器タイプのidが配列ではない/要素数0の場合、カテゴリーが一致していればスキル発動
				if (!Array.isArray(weaponTypeIdArray) || weaponTypeIdArray.length === 0) {
					return true;
				}		
				
				return weaponTypeIdArray.some(
						function(weaponId)
						{
							return weaponId === weaponType.getId();
						}
				);
			}
			
			return result;
		}
	
		// 攻撃者の武器がスキル発動許可対象ではない
		if (!f_isWeaponTypeAllowed(refList, weaponType)) {
			continue;
		}
		// スキルの発動率が成立しなかった
		if (!SkillRandomizer.isCustomSkillInvoked(passive, active, skill, CustomSkillKeyword)) {
			continue;
		}
		
		// 軽減率が最大のスキルを保存する
		if (value < curvalue) {
			value = curvalue;
			successedSkill = skill;
		}
	}
	
	if (successedSkill !== null) {
		if (successedSkill.isSkillDisplayable()) {
			attackEntry.skillArrayPassive.push(successedSkill);
		}
	}
	
	value = (100 - value) / 100;
	if (value < 0) {
		value = 0;
	}

	attackEntry.damagePassive = Math.floor(damagePassive * value);
	return _AttackEvaluator_ActiveAction__arrangePassiveDamage.call(this, virtualActive, virtualPassive, attackEntry);
};


//----------------------------
//スキル情報追加
//----------------------------
var _SkillInfoWindow_drawWindowContent = SkillInfoWindow.drawWindowContent;
SkillInfoWindow.drawWindowContent = function(x, y) {
	if (this._skill === null) return;
	
	var length = this._getTextLength();
	var textui = this.getWindowTextUI();
	var color = ColorValue.DEFAULT;//textui.getColor();
	var font = textui.getFont();
		
	_SkillInfoWindow_drawWindowContent.call(this, x, y);
	y += _SkillInfoWindow_getWindowHeight.call(this) - ItemInfoRenderer.getSpaceY();
	
	if (this._skill.getCustomKeyword() === CustomSkillKeyword) {
		var text = '';
		var	baseValue = 0;
		var magnification = 10;
		var guardParam = this._skill.custom.guardParam;
		var refList = null;
		var weaponCategory, weaponType, id;
		var TypeName = [];
		
		if (typeof guardParam !== 'undefined') {
			if (typeof guardParam.baseValue === 'number') {
				baseValue = guardParam.baseValue;
			}
			if (typeof guardParam.magnification === 'number') {
				magnification = guardParam.magnification;
			}
			if (Array.isArray(guardParam.weaponTypeList)) {
				refList = guardParam.weaponTypeList;
			}
		}
		
		if (baseValue !== 0) {
			text += baseValue + '+';
		}
		text += '距離×' + magnification + '％';
		
		TextRenderer.drawKeywordText(x, y, 'dmg軽減', length, ColorValue.KEYWORD, font);
		TextRenderer.drawKeywordText(x + ItemInfoRenderer.getSpaceX() + 6, y, text, length, color, font);
		y += ItemInfoRenderer.getSpaceY();
	
		if (refList !== null) {
			if (refList.length !== 0) {
				var isCategoryMatched, weaponTypeIdArray;
			
				refList.forEach(
					function(obj)
					{
						weaponCategory = obj.categoryType;
						weaponType = obj.weaponTypeId;
						
						if (typeof weaponCategory !== 'number' ||
							weaponCategory < 0 || weaponCategory > 2)
							/* 正確には3まで有効だが、3はカテゴリー「アイテム」で本スキルでは対応していない*/
						{
							TypeName.push('category不正');
							return;
						}

						if (Array.isArray(weaponType) && weaponType.length !== 0) {
							var list = root.getBaseData().getWeaponTypeList(weaponCategory);
							weaponType.forEach(
								function(id)
								{
									var data = list.getDataFromId(id);
									if (data !== null) { 
										TypeName.push( data.getName() );
									}
									else {
										// weaponTypeIdが不正
										TypeName.push('Id不正:' + id);
									}
								}
							);
						}
						else {
							// 武器種のidが指定されていない場合は、カテゴリ名を表示
							// データ設定>武器タイプ>タブの名前に準拠(武器カテゴリ)
							switch(weaponCategory) {
								case WeaponCategoryType.PHYSICS: TypeName.push('戦士タイプ'); break;
								case WeaponCategoryType.SHOOT  : TypeName.push('弓タイプ');   break;
								case WeaponCategoryType.MAGIC  : TypeName.push('魔法タイプ'); break;
								default: TypeName.push('category, id不正'); break;
							}
						}
					}
				);
			}
		}
		
		text = TypeName.length > 0 ? '対象武器' : '対象武器 全タイプ';
		TextRenderer.drawKeywordText(x, y, text, length, ColorValue.KEYWORD, font);
		y += ItemInfoRenderer.getSpaceY();
		
		if (TypeName.length === 0) return;
		
		var xBase = x;
		var i = 0;
		
		TypeName.forEach(
			function(typeName)
			{
				TextRenderer.drawKeywordText(x, y, typeName, length, ColorValue.DEFAULT, font);
				if (i % 2 === 1) {
					x = xBase;
					y += ItemInfoRenderer.getSpaceY();
				}
				else {
					x += 90;
				}
				i++;
			}
		);
	}
};
	
var _SkillInfoWindow_getWindowHeight = SkillInfoWindow.getWindowHeight;
SkillInfoWindow.getWindowHeight = function() {
	var height = _SkillInfoWindow_getWindowHeight.call(this);
	var objecttype = this._objecttype;
	var spaceY = ItemInfoRenderer.getSpaceY();
	
	if (this._skill === null) return height;
	
	if (this._skill.getCustomKeyword() === CustomSkillKeyword) {
		height += spaceY * 2;
		
		var guardParam = this._skill.custom.guardParam;
		var refList = null;
		var weaponCategory, weaponType;
		var count = 0;
	
		if (typeof guardParam !== 'undefined' && Array.isArray(guardParam.weaponTypeList)) {
			refList = guardParam.weaponTypeList;
			
			if (refList !== null) {
				count = refList.reduce(
					function(prev, cur)
					{
						weaponCategory = cur.categoryType;
						weaponType = cur.weaponTypeId;
						
						if (Array.isArray(weaponType)) {
							return prev + weaponType.length;
						}
						else if (typeof weaponCategory === 'number') {
							return prev++;
						}
					}
					, 0
				);
				
				height += Math.ceil(count / 2) * spaceY;
			}
		}
	}
	
	return height;
};


//----------------
// polyfill
//----------------

if(!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}


if (!Array.prototype.some)
{
  Array.prototype.some = function(fun /*, thisArg */)
  {
    'use strict';
    if (this === void 0 || this === null)
      throw new TypeError();
    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== 'function')
      throw new TypeError();
    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    for (var i = 0; i < len; i++)
    {
      if (i in t && fun.call(thisArg, t[i], i, t))
        return true;
    }
    return false;
  };
}


if (!Array.prototype.filter){
  Array.prototype.filter = function(func, thisArg) {
    'use strict';
    if ( ! ((typeof func === 'Function' || typeof func === 'function') && this) )
        throw new TypeError();

    var len = this.length >>> 0,
        res = new Array(len), // preallocate array
        t = this, c = 0, i = -1;

    var kValue;
    if (thisArg === undefined){
      while (++i !== len){
        // checks to see if the key was set
        if (i in this){
          kValue = t[i]; // in case t is changed in callback
          if (func(t[i], i, t)){
            res[c++] = kValue;
          }
        }
      }
    }
    else{
      while (++i !== len){
        // checks to see if the key was set
        if (i in this){
          kValue = t[i];
          if (func.call(thisArg, t[i], i, t)){
            res[c++] = kValue;
          }
        }
      }
    }

    res.length = c; // shrink down array to proper size
    return res;
  };
}

// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.com/#x15.4.4.18
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function (callback, thisArg) {
    var T, k;
    if (this == null) {
      throw new TypeError(" this is null or not defined");
    }
    // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
    var O = Object(this);
    // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = O.length >>> 0;
    // 4. If IsCallable(callback) is false, throw a TypeError exception.
    // See: http://es5.github.com/#x9.11
    if (typeof callback !== "function") {
      throw new TypeError(callback + " is not a function");
    }
    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
    if (thisArg) {
      T = thisArg;
    }
    // 6. Let k be 0
    k = 0;
    // 7. Repeat, while k < len
    while (k < len) {
      var kValue;
      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      if (k in O) {
        // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
        kValue = O[k];
        // ii. Call the Call internal method of callback with T as the this value and
        // argument list containing kValue, k, and O.
        callback.call(T, kValue, k, O);
      }
      // d. Increase k by 1.
      k++;
    }
    // 8. return undefined
  };
}

if ( 'function' !== typeof Array.prototype.reduce ) {
  Array.prototype.reduce = function( callback /*, initialValue*/ ) {
    'use strict';
    if ( null === this || 'undefined' === typeof this ) {
      throw new TypeError(
         'Array.prototype.reduce called on null or undefined' );
    }
    if ( 'function' !== typeof callback ) {
      throw new TypeError( callback + ' is not a function' );
    }
    var t = Object( this ), len = t.length >>> 0, k = 0, value;
    if ( arguments.length >= 2 ) {
      value = arguments[1];
    } else {
      while ( k < len && ! k in t ) k++;
      if ( k >= len )
        throw new TypeError('Reduce of empty array with no initial value');
      value = t[ k++ ];
    }
    for ( ; k < len ; k++ ) {
      if ( k in t ) {
         value = callback( value, t[k], k, t );
      }
    }
    return value;
  };
}

})();
