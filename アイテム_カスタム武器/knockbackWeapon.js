/*
■ファイル名
knockbackWeapon.js

■SRPG Studio対応バージョン
ver.1.302

■プラグインの概要
戦闘で攻撃が命中した場合、敵を1マス後退させることができる武器を作成します

■使用方法
1.このプラグインをpluginフォルダに入れる
2-1．武器のカスタムパラメータに以下の設定を記述する
例
{
  knockBackWeapon: true
}

2-2.ノックバック位置に対象を移動させられなかった場合に指定したステートを付与したい時
	{ knockBackStateId: ステートのid } を記述する
	封印（武器）ステートを敵に付与して疑似的なブレイク状態にするといった使用を想定
例
{
  knockBackWeapon: true
, knockBackStateId: 1
}

2-3.ノックバック成功時、敵がいたマスに（進入可能であれば）攻撃者を踏み込ませたい場合
	{ knockBackStepping: true } を記述する
例
{
  knockBackWeapon: true
, knockBackStepping: true
}
		
3.武器の情報ウィンドウにノックバック関連の記述を「表記しない」場合
本プラグイン内の該当箇所をコメントアウトする(340行付近)

4.ノックバックされたくないユニット(ボスや特定地点を守っている敵など）を作成する方法
ユニットのカスタムパラメータに以下を記述する
{
  isKnockbackAllowed: false
}

■ノックバック武器の仕様

・攻撃が命中した場合に敵を1マス後退させる（敵が攻撃者の左にいれば左に移動）
・自分から戦闘を仕掛けた場合のみ発動する
・その戦闘では必ず後攻になる
・ノックバック武器では追撃することができない(連続攻撃は許可しているが、最後の攻撃が命中していないとノックバックは発動しない）
・敵が追撃が可能な場合は、その追撃を先に処理してから後攻の攻撃に移る
・敵がノックバックを受けた時、移動先が移動できない地形だった場合は元の位置に戻る
・その戦闘で「HPが0になった」または「フュージョン攻撃でキャッチされた」敵はノックバックの対象にならない


■作成者
ran

■更新履歴
2024/10/21 新規作成


*/

(function() {
	
function Fnc_isKnockbackableWeapon(unit)
{
	var weapon = BattlerChecker.getBaseWeapon(unit);
	if (weapon === null) return false;
	
	return weapon.custom.knockBackWeapon === true;
}

// 戦闘終了後の処理にノックバックフローを加える
var _PreAttack__pushFlowEntriesEnd = PreAttack._pushFlowEntriesEnd;
PreAttack._pushFlowEntriesEnd = function(straightFlow) {
	_PreAttack__pushFlowEntriesEnd.call(this, straightFlow);
	
	straightFlow.pushFlowEntry(KnockBackFlowEntry);
};


var KnockBackFlowEntry = defineObject(BaseFlowEntry,
{
	_dynamicEvent: null,
	
	enterFlowEntry: function(preAttack) {
		this._prepareMemberData(preAttack);
		
		if (this._checkTargetUnit(preAttack) === false) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeMemberData(preAttack);
	},
	
	// ノックバック可能な相手かどうかを調べる
	_checkTargetUnit: function(preAttack) {
		var active = preAttack.getActiveUnit();
		var passive = preAttack.getPassiveUnit();
		var unitSrc = AttackControl.getAttackInfo().unitSrc;
		var order;
		
		// 戦闘を仕掛けたユニットと最後に攻撃したユニットが異なる
		// 両者がノクバ武器を所持しており、unitSrcが戦闘途中に攻撃できなくなった時、
		// 最終攻撃者activeが戦闘を仕掛けたユニットunitSrcと異なった場合に戦闘を仕掛けられた側によるノクバが発生してしまい
		// ノックバックは戦闘を仕掛けたユニットのみ発動させられるという仕様に反してしまう
		if (active !== unitSrc) return false;
		
		// 攻撃したユニットの武器がノックバック武器ではない
		if (Fnc_isKnockbackableWeapon(active) !== true) return false;
		
		// 直前の攻撃が命中しなかった
		order = AttackControl.getAttackOrder();
		if (order.isCurrentHit() === false) return false;
		
		// 攻撃を受けた側が、HP0またはフュージョンキャッチされていれば後続処理に入らない
		if (passive.getHp() < 1 || DamageControl.isSyncope(passive) === true) return false;
		
		// ユニットのカスタムパラメータにノックバック不可を設定している
		if (passive.custom.isKnockbackAllowed === false) return false;
		
		return true;
	},
	
	moveFlowEntry: function() {
		return this._dynamicEvent.moveDynamicEvent();
	},
	
	_prepareMemberData: function(preAttack) {
		this._dynamicEvent = createObject(DynamicEvent);
	},
	
	_completeMemberData: function(preAttack) {
		var generator = this._dynamicEvent.acquireEventGenerator();
		var active = preAttack.getActiveUnit();
		var passive = preAttack.getPassiveUnit();

		var directionType = PosChecker.getSideDirection(active.getMapX(), active.getMapY(), passive.getMapX(), passive.getMapY());
		var pixelIndex = 3; // [8, 16, 24, 32]
		var isSkipMode = false;
		var slideType;
				
		var faceDirection = [DirectionType.RIGHT, DirectionType.BOTTOM, DirectionType.LEFT, DirectionType.TOP, DirectionType.NULL];
		var weapon = BattlerChecker.getBaseWeapon(active);
		var isStepping = weapon.custom.knockBackStepping === true && this._isSlideAllowed(active, directionType, true) === true ? true : false;

		// passiveのノックバック予定位置が移動不可な地点の場合、位置を更新せずスライド終了
		if (this._isSlideAllowed(passive, directionType, false) === true) {
			slideType = SlideType.UPDATEEND;
		}
		else {
			slideType = SlideType.END;
		}
		
		// passiveがactiveの[左, 上, 右, 下, 正面]なら[右, 下, 左, 上, 正面]にキャラチップの向きを変更しておく
		passive.setDirection(faceDirection[directionType]);
		
		// スライドを印象付けるためにwaitを設ける
		generator.wait(16);
		
		// スライドを開始する
		generator.unitSlide(passive, directionType, pixelIndex, SlideType.START, isSkipMode);
		
		// スライドを終了する
		generator.unitSlide(passive, directionType, pixelIndex, slideType, isSkipMode);
		
		// 敵を後退させた場合、攻撃者が空いたマスに移動する
		if (slideType === SlideType.UPDATEEND && isStepping === true) {
			generator.unitSlide(active, directionType, pixelIndex, SlideType.START, isSkipMode);
			generator.unitSlide(active, directionType, pixelIndex, slideType, isSkipMode);
		}
		
		// 位置を更新せずにスライド終了した場合に指定したステートを付与する
		if (slideType === SlideType.END) {
			this.appendState(active, passive, weapon, generator, isSkipMode);
		}
		
		return this._dynamicEvent.executeDynamicEvent();
	},
	
	_isSlideAllowed: function(unit, directionType, isSrc) {
		var x = unit.getMapX() + XPoint[directionType];
		var y = unit.getMapY() + YPoint[directionType];
		var terrain = PosChecker.getTerrainFromPos(x, y);

		// ノックバック地点に他のユニットがいる
		if (isSrc === false && PosChecker.getUnitFromPos(x, y) !== null) return false;
		
		// ノックバック地点の地形が取得できない
		if (terrain === null) return false;
					
		// 地形進入に必要な消費移動力が0(移動可能のチェックが外されている）
		if (PosChecker.getMovePointFromUnit(x, y, unit) === 0) return false;
		
		// 地形に進入できる条件を満たしていない
		if (terrain.getPassableAggregation().isCondition(unit) === false) return false;
		
		return true;
	},
	
	appendState: function(active, passive, weapon, generator, isSkipMode) {
		var stateInvocation, state;
		var id = weapon.custom.knockBackStateId
		
		if (typeof id !== 'number') return;
		
		state = root.getBaseData().getStateList().getDataFromId(id);
		
		if (state !== null && StateControl.getTurnState(passive, state) === null) {
			stateInvocation	= root.createStateInvocation(state.getId(), 100, InvocationType.ABSOLUTE);
			generator.unitStateAddition(passive, stateInvocation, IncreaseType.INCREASE, active, isSkipMode);
		}
	}
}
);


//-------------------------------------------------------
// ノックバック武器使用時の戦闘における処理
//-------------------------------------------------------

// ノックバック武器は追撃不可
var _Calculator_calculateRoundCount = Calculator.calculateRoundCount;
Calculator.calculateRoundCount = function(active, passive, weapon) {
	if (weapon !== null && weapon.custom.knockBackWeapon === true) {
		return 1;
	}
	
	return _Calculator_calculateRoundCount.call(this, active, passive, weapon);
};


// ノックバック武器で攻撃を仕掛けた場合は確定で後攻にする
var _NormalAttackOrderBuilder__isDefaultPriority = NormalAttackOrderBuilder._isDefaultPriority;
NormalAttackOrderBuilder._isDefaultPriority = function(virtualActive, virtualPassive) {
	var active = virtualActive.unitSelf;
	var passive = virtualPassive.unitSelf;
	var weapon = virtualActive.weapon;
	
	if (weapon !== null && weapon.custom.knockBackWeapon === true) {
		return false;
	}
	
	return _NormalAttackOrderBuilder__isDefaultPriority.call(this, virtualActive, virtualPassive);
};


// 攻撃を仕掛けた側がノックバック武器の時、相手が追撃可能であれば先に追撃を処理して戦闘を進める
var _NormalAttackOrderBuilder__startVirtualAttack = NormalAttackOrderBuilder._startVirtualAttack;
NormalAttackOrderBuilder._startVirtualAttack = function() {
	var i, j, isFinal, attackCount, src, dest;
	var virtualActive, virtualPassive, isDefaultPriority;
	var unitSrc = this._attackInfo.unitSrc;
	var unitDest = this._attackInfo.unitDest;
	
	// 攻撃を仕掛けた側がノックバック武器でなければ通常処理
 	if (Fnc_isKnockbackableWeapon(unitSrc) !== true) {
		_NormalAttackOrderBuilder__startVirtualAttack.call(this);
		return;
	}
	
	// 以下、ノックバック武器で攻撃を仕掛けた場合の処理
	
	src = VirtualAttackControl.createVirtualAttackUnit(unitSrc, unitDest, true, this._attackInfo);
	dest = VirtualAttackControl.createVirtualAttackUnit(unitDest, unitSrc, false, this._attackInfo);

	src.isWeaponLimitless = DamageCalculator.isWeaponLimitless(unitSrc, unitDest, src.weapon);
	dest.isWeaponLimitless = DamageCalculator.isWeaponLimitless(unitDest, unitSrc, dest.weapon);
	
	// ノックバック武器で攻撃を仕掛けた場合は確定で後攻になる
	isDefaultPriority = this._isDefaultPriority(src, dest);
	if (isDefaultPriority) {
		src.isInitiative = true;
	}
	else {
		dest.isInitiative = true;
	}
		
	for (i = 0;; i++) {
		// if文とelse文が交互に実行される。
		// これにより、こちらが攻撃をした後は、相手が攻撃のように順番が変わる。
		if ((i % 2) === 0) {
			if (isDefaultPriority) {
				virtualActive = src;
				virtualPassive = dest;
			}
			else {
				virtualActive = dest;
				virtualPassive = src;
			}
		}
 		else {
			if (isDefaultPriority) {
				virtualActive = dest;
				virtualPassive = src;
			}
			else {
				virtualActive = src;
				virtualPassive = dest;
			}
		}
			
		// 攻撃者(i = 0 の時は戦闘を仕掛けられた側)のroundCount（追撃)が残っていれば連続で処理する
		while (VirtualAttackControl.isRound(virtualActive) === true) {
			VirtualAttackControl.decreaseRoundCount(virtualActive);
			
			attackCount = this._getAttackCount(virtualActive, virtualPassive);
		
			// 2回連続で攻撃するようなこともあるため、ループ処理
			for (j = 0; j < attackCount; j++) {
				isFinal = this._setDamage(virtualActive, virtualPassive);
				if (isFinal) {
					// ユニットが死亡したから、これ以上戦闘を継続しない
					virtualActive.roundCount = 0;
					virtualPassive.roundCount = 0;
					break;
				}
			}
		}	

		if (virtualActive.roundCount === 0 && virtualPassive.roundCount === 0) {
			break;
		}
	}
		
	this._endVirtualAttack(src, dest);
};


//------------------------------------------------
//アイテム情報に描画処理を追加
//------------------------------------------------
var _ItemInfoWindow__configureWeapon = ItemInfoWindow._configureWeapon;
ItemInfoWindow._configureWeapon = function(groupArray) {
	_ItemInfoWindow__configureWeapon.call(this, groupArray);
	
	// 情報を描画しない場合は下の1行をコメントアウトする ( // ダブルスラッシュを行頭につける ）
	groupArray.appendObject(ItemSentence.KnockBackWeapon);
};


ItemSentence.KnockBackWeapon = defineObject(BaseItemSentence,
{
	drawItemSentence: function(x, y, item) {
		var text, state;
		var count = this.getItemSentenceCount(item);
		var custom = item.custom;
		
		var textui = root.queryTextUI('default_window');
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		var length = ItemRenderer.getItemWindowWidth();
		
		if (count >= 2) {
			text = '命中時 敵を1マス後退させる';
			TextRenderer.drawKeywordText(x, y, text, length, color, font);
			y += ItemInfoRenderer.getSpaceY();
			
			text = '必ず後攻になる 追撃できない'
			TextRenderer.drawKeywordText(x, y, text, length, color, font);
			y += ItemInfoRenderer.getSpaceY();
			
			if (custom.knockBackStepping === true) {
				text = 'ノックバック時 1マス踏み込む'
				TextRenderer.drawKeywordText(x, y, text, length, color, font);
				y += ItemInfoRenderer.getSpaceY();
			}
			
			if (typeof custom.knockBackStateId === 'number') {
				state = root.getBaseData().getStateList().getDataFromId(custom.knockBackStateId);
				if (state !== null) {
					text = 'リバウンド時 ' + state.getName() + ' 付与';
					TextRenderer.drawKeywordText(x, y, text, length, color, font);;
					y += ItemInfoRenderer.getSpaceY();
				}
			}			
		}
	},
	
	getItemSentenceCount: function(item) {
		var count = 0;
		var custom = item.custom;

		if (item.isWeapon() === false) return 0;
		
		if (custom.knockBackWeapon === true) count = 2;
		
		if (custom.knockBackStepping === true) count++;
		
		if (typeof custom.knockBackStateId === 'number') {
			if (root.getBaseData().getStateList().getDataFromId(custom.knockBackStateId) !== null) {
				count++;
			}
		}
		
		return count;
	}
}
);

})();
