/*
■ファイル名
customSkill_proxybattle.js

■SRPG Studio対応バージョン
ver.1.248

■プラグインの概要
隣接する味方ユニットが戦闘(武器を使った戦闘)を仕掛けられた際に代理で戦闘を行う

※複数のスキル所有者が存在していた場合、[左、上、右、下]の順にユニットを選定します
※スキルの「有効相手」を設定していた場合、攻撃者の情報(武器やクラスタイプなど)を参照します
※スキルの「発動時に表示する」にチェックを入れていた場合、戦闘の受け手側スキルとして表示されます

■使用方法
1.このプラグインをpluginフォルダに入れる
2.カスタムスキルを作成する。「キーワード: proxybattler」
3.2で作成したスキルのカスタムパラメータに{coverType: 数値}を設定(未設定は0として扱う)
  設定値の説明　0：所属が同じユニットを庇う, 1：自軍のスキル所持ユニットは自軍と同盟を庇い、同盟は同盟と自軍を庇う。(敵軍は敵軍のみ)

■競合するプラグイン
o-to氏作のOT_ExtraConfigSkillプラグインには、暫定的に対応している状況です
動作確認が不足しているため、併用する際は各自の責任において実装してください

■作成者
ran

■利用規約
https://github.com/RantaroGames/SRPG_Studio/blob/be1b84ab349a0ac1a3573bf645e5c78cb3ab12c3/README.md

■更新履歴
2021/12/07 新規作成
2021/12/20 強制戦闘ではスキル発動を許可しない方式に変更
2023/01/11　戦闘後に捕獲する(フュージョンキャッチ)際、代理ユニットが捕獲条件に合致しない場合に起きる不具合を修正

*/

(function () {

// カスタムスキルのキーワード
var CUSTOMSKILL_KEYWORD = 'proxybattler';

// o-to氏作のOT_ExtraConfigSkillプラグインと併用したい場合はtrue
var OT_ExtraConfigSkill_COMPATIBLE = false;


// カスタムスキルの発動チェック
var alias000 = SkillRandomizer.isCustomSkillInvokedInternal;
SkillRandomizer.isCustomSkillInvokedInternal = function(active, passive, skill, keyword) {
	if (keyword === CUSTOMSKILL_KEYWORD) {
		return this._isSkillInvokedInternal(active, passive, skill);
	}
	
	return alias000.call(this, active, passive, skill, keyword);
};

// 代理戦闘を実行できるユニットを選定し、必要なプロパティを設定する
var Fnc_createAttackParam_getProxyTareget = function(attackParam) {
	var proxyBattler = null;
	var i, j, targetUnit, skill, skillArray, count, curskill;
	var posX = attackParam.targetUnit.getMapX();
	var posY = attackParam.targetUnit.getMapY();
	var keyword = CUSTOMSKILL_KEYWORD;
	
	attackParam.proxyBattler = null;
	attackParam.proxyBattlerprePosX = 0;
	attackParam.proxyBattlerprePosY = 0;
/* 	
	// 強制戦闘の場合はスキルの発動を不可とする(戦闘相手を変更しない)
	if (attackParam.attackStartType === AttackStartType.FORCE) {
		attackParam.proxyBattler = null;
		attackParam.proxyBattlerprePosX = posX;
		attackParam.proxyBattlerprePosY = posY;
		return attackParam;
	}
*/	
	//root.log(active.getName() + ' vs ' + passive.getName());
	// 庇護対象に隣接するユニットが該当スキルを発動できるかどうかを判定する[左、上、右、下]
	// var XPoint = [-1, 0, 1, 0];var YPoint = [0, -1, 0, 1];constants-enumeratedtype.js
	for (i = 0; i < 4; i++) {
		targetUnit = PosChecker.getUnitFromPos(posX + XPoint[i], posY + YPoint[i]);
	
		if (targetUnit !== null) {
			//root.log(targetUnit.getName());
		
			// 該当スキルの配列
			skillArray = SkillControl.getDirectSkillArray(targetUnit, SkillType.CUSTOM, keyword);
			count = skillArray.length;
			
			for (j = 0; j < count; j++) {
				skill = skillArray[j].skill;
				if (skill !== null) {
					// 自軍が同盟とかばい合うか否かの判定
					if (skill.custom.coverType === 1) {
						// 庇護対象とスキルチェック候補の所属が敵対している関係だった
						if (FilterControl.isReverseUnitTypeAllowed(targetUnit, attackParam.targetUnit)) continue;
					}
					else {
						// 庇護対象とスキルチェック候補の所属が異なった
						if (attackParam.targetUnit.getUnitType() !== targetUnit.getUnitType()) continue;
					}
					
					
					// o-to氏作のOT_ExtraConfigSkillプラグインに暫定対応するための処理
					if (OT_ExtraConfigSkill_COMPATIBLE === true) {
						targetUnit.custom.tmpNowVirtualAttack = {};
						targetUnit.custom.tmpNowVirtualAttack.isSrc　= false;
						targetUnit.custom.tmpNowVirtualAttack.hp = targetUnit.getHp();
					}
					
					// スキルの発動率が成立しなかった
					if (!SkillRandomizer.isCustomSkillInvoked(targetUnit, attackParam.unit, skill, keyword)) {
						root.log(targetUnit.getName() + 'スキル発動失敗:'+ skill.getName());
						continue;
					}
					
					proxyBattler = targetUnit;
					//root.log(proxyBattler.getName() + ' skill:' + skill.getName());
					break;
				}
			} 
		}
		
		if (proxyBattler !== null) break;
	}
	
	//　attackParamに代理戦闘を行うユニットと元座標およびスキルidを格納
	if (proxyBattler !== null) {
		attackParam.proxyBattler = proxyBattler;
		attackParam.proxyBattlerprePosX = proxyBattler.getMapX();
		attackParam.proxyBattlerprePosY = proxyBattler.getMapY();
		
		if (skill.isSkillDisplayable()) {
			proxyBattler.custom.skillProxyBattleId = skill.getId();
		}
		
		// 庇う対象の座標を代理ユニット設定する
		proxyBattler.setMapX(posX);
		proxyBattler.setMapY(posY);
		attackParam.targetUnit = proxyBattler;
		
		// EPFP消費
		if (OT_ExtraConfigSkill_COMPATIBLE === true) {
			Fnc_Calculate_UseSkillExpendData(proxyBattler, skill); 
		}
	}
	
	return attackParam;
};

// 戦闘に入る前に対戦するユニットを代理戦闘用のものに変更しておく
var _UnitCommand_Attack__createAttackParam = UnitCommand.Attack._createAttackParam
UnitCommand.Attack._createAttackParam = function() {
/*
 	var attackParam = StructureBuilder.buildAttackParam();
	attackParam.unit = this.getCommandTarget();
	attackParam.targetUnit = this._posSelector.getSelectorTarget(false);
	attackParam.attackStartType = AttackStartType.NORMAL;
*/
	var attackParam = _UnitCommand_Attack__createAttackParam.call(this);
	Fnc_createAttackParam_getProxyTareget(attackParam);

	return attackParam;
};


// 戦闘終了時に不要なデータを削除する
var _PreAttack__doEndAction = PreAttack._doEndAction;
PreAttack._doEndAction = function() {
	_PreAttack__doEndAction.call(this);
	
	// 強制戦闘ではattackParamを変更していないので座標を戻す必要はない
	if (this._attackParam.attackStartType === AttackStartType.FORCE) return;
	
	var targetUnit = this._attackParam.targetUnit;

	// 代理人が戦闘相手ではない＝スキル効果が発揮されていないので座標を戻す必要はない
	if (this._attackParam.proxyBattler !== targetUnit) return;
	
	delete targetUnit.custom.skillProxyBattleId;
	
	// 代理戦闘を行ったユニットの座標を元に戻しておく(HP0ではない、かつ、捕獲されていない場合)
	if (targetUnit.getHp() !== 0 && !targetUnit.isSyncope()) {
		targetUnit.setMapX(this._attackParam.proxyBattlerprePosX);
		targetUnit.setMapY(this._attackParam.proxyBattlerprePosY);
	}
};

// AIが武器戦闘を行う際にattackParamのデータを代理戦闘用に変更
var _WeaponAutoAction__createAttackParam = WeaponAutoAction._createAttackParam;
WeaponAutoAction._createAttackParam = function() {
/*
 	var attackParam = StructureBuilder.buildAttackParam();
	attackParam.unit = this.getCommandTarget();
	attackParam.targetUnit = this._posSelector.getSelectorTarget(false);
	attackParam.attackStartType = AttackStartType.NORMAL;
*/	
	var attackParam = _WeaponAutoAction__createAttackParam.call(this);
	Fnc_createAttackParam_getProxyTareget(attackParam);

	return attackParam;
};

// 強制戦闘ではattackParamを変更する処理（現ver.では元の処理のまま。スキル発動を考慮しないようにしている）
/*
var _ForceBattleEventCommand__createAttackParam = ForceBattleEventCommand._createAttackParam;
ForceBattleEventCommand._createAttackParam = function() {
// 	var attackParam = StructureBuilder.buildAttackParam();
//	attackParam.unit = this._unitSrc;
//	attackParam.targetUnit = this._unitDest;
//	attackParam.attackStartType = AttackStartType.FORCE;
//	attackParam.forceBattleObject = this._obj;
//	if (this._fusionData !== null && this._fusionData.getFusionType() === FusionType.ATTACK) {
//		attackParam.fusionAttackData = this._fusionData;
//	}
	
	var attackParam = _ForceBattleEventCommand__createAttackParam.call(this);
//	Fnc_createAttackParam_getProxyTareget(attackParam);
	
	return attackParam;
};
*/

// スキルを発動させるために必要なデータを設定しておく
var _NormalAttackOrderBuilder__setInitialSkill = NormalAttackOrderBuilder._setInitialSkill;
NormalAttackOrderBuilder._setInitialSkill = function(virtualActive, virtualPassive, attackEntry) {
	_NormalAttackOrderBuilder__setInitialSkill.call(this, virtualActive, virtualPassive, attackEntry);
	
	var id = virtualPassive.unitSelf.custom.skillProxyBattleId;
	var skill;
	
	if (typeof id === 'number') {
		skill = root.getBaseData().getSkillList().getDataFromId(id);
		if (skill !== null) {
			attackEntry.skillArrayPassive.push(skill);
		}
		delete virtualPassive.unitSelf.custom.skillProxyBattleId;
	}
};

//-----------------------------------------------
// 代理ユニットが捕獲できない対象だった場合に処理を変更する
//-----------------------------------------------
var _CatchFusionFlowEntry__completeMemberData = CatchFusionFlowEntry._completeMemberData;
CatchFusionFlowEntry._completeMemberData = function(preAttack) {
	var active = preAttack.getActiveUnit();
	var passive = preAttack.getPassiveUnit();
	var attackParam = preAttack._attackParam;
	var fusionData = FusionControl.getFusionAttackData(active);
	
	if (fusionData === null) {
		return EnterResult.NOTENTER;
	}
	
	if (!DamageControl.isSyncope(passive)) {
		return EnterResult.NOTENTER;
	}
	
	// 代理ユニットが捕獲される状況になった場合
	if (attackParam.proxyBattler === passive) {
		// 代理ユニットが捕獲できる条件に適合しない場合
		if (FusionControl.isCatchable(active, passive, fusionData) === false) {
			// 撃破された代理ユニットに捕獲状態が設定されているのでfalseにする
			passive.setSyncope(false);
			
			// HPが0になっていた場合は死亡(負傷)状態を設定する
			if (passive.getHp() < 1) {
				DamageControl.setDeathState(passive);
			}
			return EnterResult.NOTENTER;
		}
	}
	
	return _CatchFusionFlowEntry__completeMemberData.call(this, preAttack);
};

// o-to氏作のOT_ExtraConfigSkillプラグインと併用する場合にスキル発動時にEP消費するための処理
// EC_SkillCheck._UseSkillExpendDataと同様の処理
var Fnc_Calculate_UseSkillExpendData = function(unit, skill) {
	var value = 0;
	
	// EPを消費
	if (skill.custom.EC_UseEP != null) {
		if (typeof OT_GetUseEP === 'undefined') {
			root.log('EP使用:EPシステムが未導入です');
		}
		else {
			value = OT_GetUseEP(unit, skill.custom.EC_UseEP);
		}
		OT_UseNowEP(unit, value);
	}
	
	// FPを消費
	value = 0;
	if (skill.custom.EC_UseFP != null) {
		if (typeof OT_GetUseFP === 'undefined') {
			root.log('FP使用:FPシステムが未導入です');
		}
		else {
			value = OT_GetUseFP(unit, skill.custom.EC_UseFP);
		}
		OT_UseNowFP(unit, value);
	}
};


})();