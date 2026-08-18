var RantaroGames = RantaroGames || {};

/*---------------------------------------------------------------------------
* コマンドリストから指定オブジェクトのインデックスを取得する
---------------------------------------------------------------------------*/
RantaroGames.getCommandIndex = function(groupArray, name) {
    var i, command;

    for (i = 0; i < groupArray.length; i++) {
        command = groupArray[i];

        if (command.getCommandName &&
            command.getCommandName() === name) {
            return i;
        }
    }

    return -1;
};

/*---------------------------------------------------------------------------
* RenderManager
---------------------------------------------------------------------------*/
RantaroGames.RenderManager = {
	getAlphaFromCounter: function(
		min,
		max,
		counter
	) {
		var t = counter.getCounter() / this._getCounterMax(counter);
		var rate = (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2;

		rate = Math.pow(rate, 2.5);
		return Math.floor(min + (max - min) * rate);
	},
	
	_getCounterMax: function(counter) {
		return counter._max;
	}
};

/*
ユニットが持つカスタムパラメータの中で指定したパラメータに任意の値を取得/設定します

・カスタムパラメータを取得したい
1.スクリプトの実行> コード実行に以下を記述する
UnitCustomParameterContorol.getCustomParameter();

2.オリジナルデータでユニットを指定し、キーワードに操作したいカスタムパラメータの名前を記述する
  指定したユニットがnullまたはキーワードを指定しなかった場合、カスタムパラメータが存在しなかった場合は、'undefined'が返ります
  
・カスタムパラメータを設定したい
1.スクリプトの実行> コード実行に以下を記述する
UnitCustomParameterContorol.setCustomParameter(value);

2.オリジナルデータでユニットを指定し、キーワードに操作したいカスタムパラメータの名前を記述する
3.引数(value)をカスタムパラメータに設定したい値を記述する
  value に指定する値は'Boolean', 'Number', 'String'型を推奨します
  指定した名前のカスタムパラメータが存在しなかった場合、新たに(値と共に)設定されます
  
 ・オリジナルデータの数値(1~6)で取得した値をカスタムパラメータに設定したい
1.スクリプトの実行> コード実行に以下を記述する
UnitCustomParameterContorol.setOriginalDataNumber(index);

2.オリジナルデータでユニットを指定し、キーワードに操作したいカスタムパラメータの名前を記述する
3.引数(index)に0～5の整数を記述する(数値1~6に対応しています)
  indexで指定した数値の値がカスタムパラメータに設定されます(indexが不正な場合は、何もせず処理を終了します)
  指定した名前のカスタムパラメータが存在しなかった場合、新たに(値と共に)設定されます
*/

RantaroGames.UnitCustomParameterContorol = {
	_getOriginalContent: function() {
		return root.getEventCommandObject().getOriginalContent();
	},
	
	_getUnit: function() {
		return this._getOriginalContent().getUnit();
	},
	
	_getKeyWord: function() {
		return this._getOriginalContent().getCustomKeyword();
	},
	
	// 数値1~6を取得する(引数indexは0~5を指定)
	_getValue: function(index) {
		return this._getOriginalContent().getValue(index);
	},
	
	getCustomParameter: function() {
		var content = this._getOriginalContent();
		var unit = content.getUnit();
		var keyword = content.getCustomKeyword();
		
		if (unit === null || keyword === '') {
			return;
		}
	
		return unit.custom[keyword];
	},
	
	setCustomParameter: function(value) {
		var content = this._getOriginalContent();
		var unit = content.getUnit();
		var keyword = content.getCustomKeyword();
		
		if (unit === null || keyword === '') {
			return;
		}
		
		unit.custom[keyword] = value;
	},
	
	// indexで指定したオリジナルデータの数値をカスタムパラメータに設定する
	setOriginalDataNumber: function(index) {
		var content = this._getOriginalContent();
		var unit = content.getUnit();
		var keyword = content.getCustomKeyword();
		var value;
		
		if (unit === null || keyword === '') {
			return;
		}
		
		if (typeof index !== 'number' || index < 0 || index > 5) {
//			root.log('index には 0~5 の整数を指定してください');
			return;
		}
		
		value = content.getValue(index);
		
		unit.custom[keyword] = value;
	},
	
	_setArrayData: function(targetId, value) {
		var arr = this.getCustomParameter();
		var i, count, data, index;
		
		if (Object.prototype.toString.call(arr) !== '[object Array]') {
			arr = [];
		}
		
		count = arr.length;
		for (i = 0; i < count; i++) {
			data = arr[i];
			if (data === null) continue;
			
			if (data[0] === targetId) {
				arr.splice(i, 1, [targetId, value])
				break;
			}
		}
		if (i === count) {
			arr.push([targetId, value]);
		}
		
		this.setCustomParameter(arr);
		
//		this._putLog(arr);
	},
	
	_putLog: function(arr) {
		var content = this._getOriginalContent();
		var unit = content.getUnit();
		var keyword = content.getCustomKeyword();
		var count = arr.length;
		var i;
		
		if (unit === null || keyword === '') {
			root.log('unit または keyword が不正');
			return;
		}
		if (count === 0) {
			root.log('unitのカスタムパラメータ ' + keyword +' が不正');
		}
		
		for (i = 0; i < count; i++) {
			root.log(unit.getName() + ' targetId:' + arr[i][0] + ' value:' + arr[i][1])
		}
	}
	
};


//-----------------------------------------------------------------
// ItemSentenceStateInfoオブジェクト
// O-to氏のEP/FPプラグインを導入している場合はEP/FPの補正値、回復値も表示可能
//-----------------------------------------------------------------
var BaseItemStateInfoSentence_RG = defineObject(BaseObject,
{
	_stateInfoWindow: null,
	_state: null,
	
	setParentWindow: function(stateInfoWindow, state) {
		this._stateInfoWindow = stateInfoWindow;
		this._state = state;
	},
	
	moveStateSentence: function() {
		return MoveResult.CONTINUE;
	},
	
	drawStateSentence: function(x, y, turnState) {
	},
	
	getStateSentenceCount: function(state) {
		return 0;
	}
}
);

RantaroGames.ItemSentenceStateInfo = {};

RantaroGames.ItemSentenceStateInfo.Name = defineObject(BaseItemStateInfoSentence_RG,
{
	drawStateSentence: function(x, y, state) {
		var text;
		
//		ItemInfoRenderer.drawColorVariationText(x + 116, y - 14, 'C 押下中 非表示', ColorValue.DISABLE);
		
		text = (state.isBadState() === true) ? '異常' : '状態';
		ItemInfoRenderer.drawKeyword(x, y, text);
		x += ItemInfoRenderer.getSpaceX();

		text = state.getName();
		ItemInfoRenderer.drawDefault(x, y, text);
	},
	
	getStateSentenceCount: function(state) {
		return 1;
	}
}
);

RantaroGames.ItemSentenceStateInfo.Turn_RecoveryValue = defineObject(BaseItemStateInfoSentence_RG,
{
	drawStateSentence: function(x, y, state) {
		var text, recoveryValue;
		var turn = state.getTurn();
		
		text = 'ターン';
		ItemInfoRenderer.drawKeyword(x, y, text);
		x += ItemInfoRenderer.getSpaceX();
		
		if (turn !== 0) {
			NumberRenderer.drawRightNumber(x, y, turn);
		}
		else {
			TextRenderer.drawSignText(x, y, StringTable.SignWord_Limitless);
		}

		if (typeof state.custom.oneTimeState === 'number') {
			TextRenderer.drawSignTextColorRG(x + 20, y, '(待機時減少)', ColorValue.INFO, 13);
			x += 100;
		} else if (typeof state.custom.decreasebyTurnEnd === 'number') {
			TextRenderer.drawSignTextColorRG(x + 20, y, '(ターン終了時減少)', ColorValue.INFO, 13);
			x += 100;
		}
			
		x += 42;
		
		recoveryValue = state.getAutoRecoveryValue();
		if (recoveryValue > 0) {
			text = '回復';
			ItemInfoRenderer.drawKeyword(x, y, text);
			x += ItemInfoRenderer.getSpaceX();
			NumberRenderer.drawRightNumber(x, y, recoveryValue);
		}
		else if (recoveryValue < 0) {
			text = 'DMG';
			ItemInfoRenderer.drawKeyword(x, y, text);
			x += ItemInfoRenderer.getSpaceX();
			NumberRenderer.drawRightNumber(x, y, (recoveryValue * -1));
		}
	},
	
	getStateSentenceCount: function(state) {
		return 1;
	}
}
);

RantaroGames.ItemSentenceStateInfo.Seal = defineObject(BaseItemStateInfoSentence_RG,
{
	drawStateSentence: function(x, y, state) {
		var text;
		var space = ' ';
		var badStateFlag = state.getBadStateFlag();
		
		if (badStateFlag === 0) {
			return;
		}

		text = '封印';
		ItemInfoRenderer.drawKeyword(x, y, text);

		text = '';
		if (badStateFlag & BadStateFlag.PHYSICS) {
			text += StringTable.DamageType_Physics + space;
		}
		if (badStateFlag & BadStateFlag.MAGIC) {
			text += StringTable.DamageType_Magic + space;
		}
		if (badStateFlag & BadStateFlag.ITEM) {
			text += StringTable.ItemWord_SuffixItem + space;//root.queryCommand('item_unitcommand') + space;
		}
		if (badStateFlag & BadStateFlag.WAND) {
			text += root.queryCommand('wand_unitcommand') + space;
		}

		x += ItemInfoRenderer.getSpaceX();
		ItemInfoRenderer.drawDefault(x, y, text);
	},
	
	getStateSentenceCount: function(state) {
		return state.getBadStateFlag() > 0;
	}
}
);

RantaroGames.ItemSentenceStateInfo.Option = defineObject(BaseItemStateInfoSentence_RG,
{
	drawStateSentence: function(x, y, state) {
		var text;
		var badStateOption = state.getBadStateOption();
		
		if( badStateOption == 0 ) {
			return;
		}

		text = '強制';
		ItemInfoRenderer.drawKeyword(x, y, text);

		text = '';
		if (badStateOption == BadStateOption.NOACTION) {
			text += '行動禁止 '
		}
		if (badStateOption == BadStateOption.BERSERK) {
			text += '暴走 '
		}
		if (badStateOption == BadStateOption.AUTO) {
			text += '自動AI '
		}

		x += ItemInfoRenderer.getSpaceX();
		ItemInfoRenderer.drawDefault(x, y, text);
	},
	
	getStateSentenceCount: function(state) {
		return state.getBadStateOption() > 0;
	}
}
);

RantaroGames.ItemSentenceStateInfo.AutoRemoval = defineObject(BaseItemStateInfoSentence_RG,
{
	drawStateSentence: function(x, y, state) {
		var text;
		var type = state.getAutoRemovalType();
		var count = state.getAutoRemovalValue();
		
		if (type === StateAutoRemovalType.NONE) {
			return;
		}

		text = '解除条件';
		ItemInfoRenderer.drawKeyword(x, y, text);

		text = '';
		if (type === StateAutoRemovalType.BATTLEEND) {
			text += '戦闘発生'
		}
		if (type === StateAutoRemovalType.ACTIVEDAMAGE) {
			text += '攻撃命中'
		}
		if (type === StateAutoRemovalType.PASSIVEDAMAGE) {
			text += '攻撃被弾'
		}

		x += 100;
		ItemInfoRenderer.drawDefault(x, y, text);
		ItemInfoRenderer.drawDefault(x + 70, y, count + '回');
	},
	
	getStateSentenceCount: function(state) {
		var type = state.getAutoRemovalType();
		
		return type === StateAutoRemovalType.NONE ? 0 : 1;
	}
}
);

RantaroGames.ItemSentenceStateInfo.Skill = defineObject(BaseItemStateInfoSentence_RG,
{
	drawStateSentence: function(x, y, state) {
		var skillList = state.getSkillReferenceList();
		var count = skillList.getTypeCount();
		var i, skill, skillname;
		
		if (count < 1) return;
		
		ItemInfoRenderer.drawKeyword(x, y, 'スキル');
		x += ItemInfoRenderer.getSpaceX();
		
		for (i = 0; i < count; i++) {
			skill = skillList.getTypeData(i);
			
			if (skill !== null) {
				skillname = skill.getName();
				ItemInfoRenderer.drawDefault(x, y, skillname);
				y += ItemInfoRenderer.getSpaceY()
			}
		}
	},
	
	getStateSentenceCount: function(state) {
		var skillList = state.getSkillReferenceList();
		var count = skillList.getTypeCount();
		
		return count;
	}
}
);

// EP回復値
RantaroGames.ItemSentenceStateInfo.EPRecoveryValue = defineObject(BaseItemStateInfoSentence_RG,
{
	_value: 0,
	
	setParentWindow: function(itemInfoWindow, state) {
		BaseItemStateInfoSentence_RG.setParentWindow.apply(this, arguments);
		
		// ステートの回復値を取得
		this._value = this._setStateRecoveryValue(state);
	},
	
	_setStateRecoveryValue: function(state) {
		var recovery = 0;
		
		if (typeof OT_GetUseEP === 'undefined') {
			root.log('EP使用:EPシステムが未導入です');
			return 0;
		}
		
		if (!OT_isEPCustom(state, 'Recovery')) return 0;
		
		if (typeof state.custom.OT_EP.Recovery === 'number') {
			recovery += state.custom.OT_EP.Recovery;
		}
		
		return recovery;
	},
	
	drawStateSentence: function(x, y, state) {
		if (this._value === 0) return;
		
		var number = this._value;
		if (number < 0) number *= -1;
		
		ItemInfoRenderer.drawKeyword(x, y, 'EP回復');
		x += ItemInfoRenderer.getSpaceX();
		
		TextRenderer.drawSignText(x, y, this._value > 0 ? ' + ': ' - ');
		
		x += 10;
		x += DefineControl.getNumberSpace();

		NumberRenderer.drawRightNumber(x, y, number);
	},

	getStateSentenceCount: function(state) {
		var recovery = 0;
		
		if (typeof OT_GetUseEP === 'undefined') {
			return 0;
		}
		
		if (!OT_isEPCustom(state, 'Recovery')) return 0;

		if (typeof state.custom.OT_EP.Recovery === 'number') {
			recovery = state.custom.OT_EP.Recovery;
		}
		
		if (recovery === 0) return 0;
	
		return 1;
	}
}
);

// FP回復値
RantaroGames.ItemSentenceStateInfo.FPRecoveryValue = defineObject(BaseItemStateInfoSentence_RG,
{
	_value: 0,
	
	setParentWindow: function(itemInfoWindow, state) {
		BaseItemStateInfoSentence_RG.setParentWindow.apply(this, arguments);
		// ステートの回復値を取得
		this._value = this._setStateRecoveryValue(state);
	},
	
	_setStateRecoveryValue: function(state) {
		var recovery = 0;
		
		if (typeof OT_GetUseFP === 'undefined') {
			root.log('FP使用:FPシステムが未導入です');
			return 0;
		}
		
		if (!OT_isFPCustom(state, 'Recovery')) return 0;
		
		if (typeof state.custom.OT_FP.Recovery === 'number') {
			recovery += state.custom.OT_FP.Recovery;
		}
		
		return recovery;
	},
	
	drawStateSentence: function(x, y, state) {
		if (this._value === 0) return;
		
		var number = this._value;
		if (number < 0) number *= -1;
		
		ItemInfoRenderer.drawKeyword(x, y, 'FP回復');
		x += ItemInfoRenderer.getSpaceX();
		
		TextRenderer.drawSignText(x, y, this._value > 0 ? ' + ': ' - ');
		
		x += 10;
		x += DefineControl.getNumberSpace();

		NumberRenderer.drawRightNumber(x, y, number);
	},

	getStateSentenceCount: function(state) {
		var recovery = 0;
		
		if (typeof OT_GetUseFP === 'undefined') {
			return 0;
		}
		
		if (!OT_isFPCustom(state, 'Recovery')) return 0;

		if (typeof state.custom.OT_FP.Recovery === 'number') {
			recovery = state.custom.OT_FP.Recovery;
		}
		
		if (recovery === 0) return 0;
	
		return 1;
	}
}
);

//------------------------------
// ステータス増減値
//------------------------------
RantaroGames.ItemSentenceStateInfo.DopingParameter = defineObject(BaseItemStateInfoSentence_RG,
{
	_arr: null,
	
	setParentWindow: function(itemInfoWindow, state) {
		BaseItemStateInfoSentence_RG.setParentWindow.apply(this, arguments);
		// ステートのドーピング値を配列に取得
		this._arr = this._setStateDopingParam(state);
	},
	
	_setStateDopingParam: function(state) {
		var i, n, value;
		var count = ParamGroup.getParameterCount();
		var arr = [];

		if (state === null) return;

		for (i = 0; i < count; i++) {
			n = ParamGroup.getDopingParameter(state, i);
			
			if (n !== 0) {
				arr.push([ParamGroup.getParameterName(i), n]);
			}
		}
		
		return arr;
	},
	
	drawStateSentence: function(x, y, state) {
		if (this._arr === null || this._arr.length === 0) {
			return 0;
		}
		
		ItemInfoRenderer.drawKeyword(x, y, root.queryCommand('support_capacity'));
		x += ItemInfoRenderer.getSpaceX();
		ItemInfoRenderer._drawDopingStateRG(x, y, this._arr);
	},
	
	getStateSentenceCount: function(state) {
		var i, n;
		var count = ParamGroup.getParameterCount();
		var count2 = 0;
		
		for (i = 0; i < count; i++) {
			n = ParamGroup.getDopingParameter(state, i);

			if (n !== 0) {
				count2++;
			}
		}

		return Math.ceil(count2 / 2);
	}
}
);

// ターン経過/ボーナス値減少
RantaroGames.ItemSentenceStateInfo.TurnChangeValue = defineObject(BaseItemStateInfoSentence_RG,
{
	drawStateSentence: function(x, y, state) {
		var text, recoveryValue;
		var value = state.getTurnChangeValue();
		
		if (value === 0) return;
		
		text = '減少';
		ItemInfoRenderer.drawKeyword(x, y, text);
		x += ItemInfoRenderer.getSpaceX();
		NumberRenderer.drawRightNumber(x, y, value);
		
		x += 10;
		if (value > 99) x += 9;
		if (value > 9)  x += 9;
		ItemInfoRenderer.drawKeyword(x, y, ' / ターン');
	},
	
	getStateSentenceCount: function(state) {
		var value = state.getTurnChangeValue();
		
		if (value === 0) return 0;
	
		return 1;
	}
}
);

// ステート効果補足
RantaroGames.ItemSentenceStateInfo.DescriptionText = defineObject(BaseItemStateInfoSentence_RG,
{
	drawStateSentence: function(x, y, state) {
		var text = state.custom.description;
		
		if (typeof text === 'undefined' || text === '') return;

		ItemInfoRenderer.drawColorVariationText(x, y, text, ColorValue.DEFAULT);
	},
	
	getStateSentenceCount: function(state) {
		var text = state.custom.description;
		
		if (typeof text === 'undefined' || text === '') return 0;
		
		return 1;
	}
}
);

