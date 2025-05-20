/*
■ファイル名
hpAbsorptionPercentChange.js

■SRPG Studio対応バージョン
ver.1.310以降

■プラグインの概要
武器に「ダメージ吸収」のオプションを設定している場合に吸収率をカスタムパラメータで指定します。
「ダメージ吸収」を持つスキルと武器の情報ウィンドウに吸収率を表示します。

■使用方法
1.このプラグインをpluginフォルダに入れる
2-1．武器のカスタムパラメータに以下の設定を記述する

例
{
  hpAbsorptionPercent: 50 // (1～100の数値)
}

■作成者
ran

■更新履歴
2025/03/16 新規作成

*/

(function() {

/*
AttackEvaluator.ActiveAction._isAbsorption = function(virtualActive, virtualPassive, attackEntry) {
	var weaponAbsorptionPercent = 0;
	var skillAbsorptionPercent = 0;
	var active = virtualActive.unitSelf;
	var passive = virtualPassive.unitSelf;
	var weapon = virtualActive.weapon;
	var skill = SkillControl.checkAndPushSkill(active, passive, attackEntry, true, SkillType.DAMAGEABSORPTION);
		
	if (skill !== null) {
		skillAbsorptionPercent = skill.getSkillValue();
	}
	
	weaponAbsorptionPercent = this._getWeaponAbsorptionPercent(weapon);
	
	// 「ダメージ吸収」は、「スキル」と「武器オプション」の2種類がある。
	// 大きいパーセントを使用しているが、両者を加算してパーセントを上昇するという方法もあるかもしれない。
	return Math.max(weaponAbsorptionPercent, skillAbsorptionPercent);
};
*/

// 武器のオプション「ダメージ吸収」にカスタムパラメータで吸収率を設定する
//var alias__getWeaponAbsorptionPercent = AttackEvaluator.ActiveAction._getWeaponAbsorptionPercent;
AttackEvaluator.ActiveAction._getWeaponAbsorptionPercent = function(weapon) {
//	var weaponAbsorptionPercent = alias__getWeaponAbsorptionPercent.call(this, weapon);
	var weaponAbsorptionPercent = 0;
	
	if (weapon !== null && weapon.getWeaponOption() === WeaponOption.HPABSORB) {
		if (typeof weapon.custom.hpAbsorptionPercent === 'number') {
			weaponAbsorptionPercent = weapon.custom.hpAbsorptionPercent;
			
			weaponAbsorptionPercent = Math.max(0, Math.min(weaponAbsorptionPercent, 100));
		}
		else {
			// 「武器オプション」の「ダメージ吸収」は、既定では常に100%
			weaponAbsorptionPercent = 100;
		}
	}
	
	return weaponAbsorptionPercent;
};


//---------------------------------------------------------
// スキル情報に吸収率の記述を追加する
//---------------------------------------------------------
var alias_001 = SkillInfoWindow.drawWindowContent;
SkillInfoWindow.drawWindowContent = function(x, y) {
	if (this._skill === null) return;
	
	var length = this._getTextLength();
	var textui = this.getWindowTextUI();
	var color = ColorValue.KEYWORD;// textui.getColor();
	var font = textui.getFont();
	var text;

	alias_001.call(this, x, y);
	y += alias_002.call(this) - ItemInfoRenderer.getSpaceY();	
	
	if (this._skill.getSkillType() === SkillType.DAMAGEABSORPTION) {
		text = 'HP吸収' + this._skill.getSkillValue() + '％';
		TextRenderer.drawKeywordText(x, y, text, length, color, font);
		y += ItemInfoRenderer.getSpaceY();
	}
	
};

var alias_002 = SkillInfoWindow.getWindowHeight;
SkillInfoWindow.getWindowHeight = function() {
	var height = alias_002.call(this);
	if (this._skill === null) return height;
	
	if (this._skill.getSkillType() === SkillType.DAMAGEABSORPTION) {
		height += ItemInfoRenderer.getSpaceY();
	}
		
	return height;
};

//---------------------------------------------------------
// 武器情報に吸収率の記述を追加する
//---------------------------------------------------------
var alias_003 = ItemSentence.WeaponOption.drawItemSentence
ItemSentence.WeaponOption.drawItemSentence = function(x, y, item) {
	var option = item.getWeaponOption();
	var text, hpAbsorptionPercent, dx;
	
	alias_003.call(this, x, y, item);
	
	if (option === WeaponOption.HPABSORB) {
		if (typeof item.custom.hpAbsorptionPercent === 'number') {
			hpAbsorptionPercent = item.custom.hpAbsorptionPercent;
			hpAbsorptionPercent = Math.max(0, Math.min(hpAbsorptionPercent, 100));
			
			text = '(' + hpAbsorptionPercent + '%）';
		}
		else {
			text = '(100%)';
		}
		
		dx = item.getAttackCount() > 1 ? 155 : 55;
		ItemInfoRenderer.drawKeyword(x + dx, y, text);
	}
};

})();
