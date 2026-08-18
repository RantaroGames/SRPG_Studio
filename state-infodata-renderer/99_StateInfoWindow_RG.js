/*
 * ステート詳細ウィンドウ
 *
 * 依存: RantaroGames.ItemSentenceStateInfo（各ステート情報センテンス）
 * このファイルは、上記センテンスを定義したファイル(#RantaroGamesPlugin)より後に読み込んでください。
 */

var RantaroGames = RantaroGames || {};

(function() {
	// RantaroGames.ItemSentenceStateInfoで使用する描画補助です。
	// 既に別プラグインで定義済みの場合は、その実装を優先します。
	if (typeof ItemInfoRenderer.drawDefault !== 'function') {
		ItemInfoRenderer.drawDefault = function(x, y, text) {
			var textui = this.getTextUI();

			TextRenderer.drawKeywordText(x, y, text, -1, textui.getColor(), textui.getFont());
		};
	}

	if (typeof ItemInfoRenderer.drawColorVariationText !== 'function') {
		ItemInfoRenderer.drawColorVariationText = function(x, y, text, color) {
			var textui = this.getTextUI();

			TextRenderer.drawText(x, y, text, -1, color, textui.getFont());
		};
	}

	if (typeof ItemInfoRenderer._drawDopingStateRG !== 'function') {
		// DopingParameter が作成した [パラメータ名, 増減値] の配列を描画します。
		ItemInfoRenderer._drawDopingStateRG = function(x, y, array) {
			var i, data, text, value;
			var count = array.length;
			var count2 = 0;
			var xBase = x;
			var textui = this.getTextUI();
			var color = textui.getColor();
			var font = textui.getFont();

			for (i = 0; i < count; i++) {
				count2++;
				
				data = array[i];
				text = data[0];
				value = data[1];

				TextRenderer.drawKeywordText(x, y, text, -1, color, font);
				//x += TextRenderer.getTextWidth(text, font) + 5;
				x += 40;
				TextRenderer.drawSignText(x, y, value > 0 ? ' + ' : ' - ');

				x += 10 + DefineControl.getNumberSpace();
				NumberRenderer.drawRightNumber(x, y, value < 0 ? -value : value);
				
				if (count2 % 2 === 0) {
					x = xBase;
					y += this.getSpaceY();
				}
				else {
					x += 30;
				}
			}
		};
	}

	RantaroGames.StateInfoWindow = defineObject(BaseWindow,
	{
		_state: null,
		_groupArray: null,
		_windowHeight: 0,

		// 対象ステート未設定時は枠自体を描画しません。
		_isWindowEnabled: false,

		moveWindowContent: function() {
			var i;
			var count;

			if (this._state === null) {
				return MoveResult.CONTINUE;
			}

			count = this._groupArray.length;
			for (i = 0; i < count; i++) {
				this._groupArray[i].moveStateSentence();
			}

			return MoveResult.CONTINUE;
		},

		drawWindowContent: function(x, y) {
			var i;
			var count;

			if (this._state === null) {
				return;
			}

			count = this._groupArray.length;
			for (i = 0; i < count; i++) {
				this._groupArray[i].drawStateSentence(x, y, this._state);
				y += this._groupArray[i].getStateSentenceCount(this._state) * ItemInfoRenderer.getSpaceY();
			}
		},

		getWindowWidth: function() {
			return ItemRenderer.getItemWindowWidth() + 30;
		},

		getWindowHeight: function() {
			return this._windowHeight;
		},

		// ItemInfoWindow.setInfoItem と対になる、表示対象ステートの設定メソッドです。
		setInfoState: function(state) {
			var i;
			var count;
			var partsCount = 0;

			this._state = (typeof state === 'undefined') ? null : state;
			this._groupArray = [];
			this._windowHeight = 0;

			if (this._state === null) {
				this.enableWindow(false);
				return;
			}

			this._configureState(this._groupArray);

			count = this._groupArray.length;
			for (i = 0; i < count; i++) {
				this._groupArray[i].setParentWindow(this, this._state);
				partsCount += this._groupArray[i].getStateSentenceCount(this._state);
			}

			// BaseWindow の上下パディングに加え、最終行の余白を確保します。
			this._windowHeight = (partsCount + 1) * ItemInfoRenderer.getSpaceY();
			this.enableWindow(true);
		},

		getInfoState: function() {
			return this._state;
		},

		_configureState: function(groupArray) {
			var sentence = RantaroGames.ItemSentenceStateInfo;

			groupArray.appendObject(sentence.Name);
			groupArray.appendObject(sentence.Turn_RecoveryValue);
			groupArray.appendObject(sentence.Seal);
			groupArray.appendObject(sentence.Option);
			groupArray.appendObject(sentence.AutoRemoval);
			groupArray.appendObject(sentence.Skill);
			if (typeof OT_GetUseEP !== 'undefined') {
				groupArray.appendObject(sentence.EPRecoveryValue);
			}
			if (typeof OT_GetUseFP !== 'undefined') {
				groupArray.appendObject(sentence.FPRecoveryValue);
			}
			groupArray.appendObject(sentence.DopingParameter);
			groupArray.appendObject(sentence.TurnChangeValue);
			groupArray.appendObject(sentence.DescriptionText);
		}
	}
	);
})();
