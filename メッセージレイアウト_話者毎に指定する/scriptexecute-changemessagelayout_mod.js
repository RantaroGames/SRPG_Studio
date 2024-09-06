/*
■ファイル名
scriptexecute-changemessagelayout_mod.js

■SRPG Studio対応バージョン
var.1.301

■プラグインの概要
話者（ユニット, NPC）のカスタムパラメータを通じてメッセージレイアウトを指定のIDのものへ変更します

※注意点
本プラグインは、公式プラグイン「scriptexecute-changemessagelayout.js」（以下、公式プラグイン）と競合します
公式プラグインを利用してメッセージレイアウトを変更していた場合は、公式プラグインの設定が優先されます

■使用方法
1.このプラグインをpluginフォルダに入れる

2.ユニット（またはNPC)のカスタムパラメータに以下の値を記述する
数値は、メッセージレイアウトで作成したデータのidを記入する
(id不正の場合は、メッセージレイアウトのデータリストで一番上のデータが採用される)

{
  messageLayoutId: 1
}

■作成者
ran

■更新履歴
2024/09/06 新規作成

*/

(function() {

var alias1 = MessageShowEventCommand._getLayoutTop;
MessageShowEventCommand._getLayoutTop = function() {
	var id;
	
	if (typeof root.getMetaSession().global.layout_top !== 'undefined') {
		return getLayout(root.getMetaSession().global.layout_top);
	}
	else {
		id = fnc_getCustomId();
		if (id >= 0) {
			return getLayout(id);
		}
		
		return alias1.call(this);
	}
};

var alias2 = MessageShowEventCommand._getLayoutCenter;
MessageShowEventCommand._getLayoutCenter = function() {
	var id;
	
	if (typeof root.getMetaSession().global.layout_center !== 'undefined') {
		return getLayout(root.getMetaSession().global.layout_center);
	}
	else {
		id = fnc_getCustomId();
		if (id >= 0) {
			return getLayout(id);
		}
		
		return alias2.call(this);
	}
};

var alias3 = MessageShowEventCommand._getLayoutBottom;
MessageShowEventCommand._getLayoutBottom = function() {
	var id;
	
	if (typeof root.getMetaSession().global.layout_bottom !== 'undefined') {
		return getLayout(root.getMetaSession().global.layout_bottom);
	}
	else {
		id = fnc_getCustomId();
		if (id >= 0) {
			return getLayout(id);
		}
		
		return alias3.call(this);
	}
};

var alias4 = MessageTeropEventCommand._getMessageLayout;
MessageTeropEventCommand._getMessageLayout = function() {
	var id;
	
	if (typeof root.getMetaSession().global.layout_terop !== 'undefined') {
		return getLayout(root.getMetaSession().global.layout_terop);
	}
	else {
		id = fnc_getCustomId();
		if (id >= 0) {
			return getLayout(id);
		}
		
		return alias4.call(this);
	}
};

var alias5 = StillMessageEventCommand._getMessageLayout;
StillMessageEventCommand._getMessageLayout = function() {
	var id;
	
	if (typeof root.getMetaSession().global.layout_still !== 'undefined') {
		return getLayout(root.getMetaSession().global.layout_still);
	}
	else {
		id = fnc_getCustomId();
		if (id >= 0) {
			return getLayout(id);
		}
		
		return alias5.call(this);
	}
};

function getLayout(id) {
	return root.getBaseData().getMessageLayoutList().getDataFromId(id);
};


function fnc_getCustomId()
{
	var unit, npc;
	var eventCommandData = root.getEventCommandObject();
	var speakerType = eventCommandData.getSpeakerType();
	
	if (speakerType === SpeakerType.UNIT) {
		unit = eventCommandData.getUnit();
		if (unit !== null && typeof unit.custom.messageLayoutId === 'number') {
			return unit.custom.messageLayoutId;
		}
	}
	else if (speakerType === SpeakerType.NPC) {
		npc = eventCommandData.getNpc();
		if (npc !== null && typeof npc.custom.messageLayoutId === 'number') {
			return npc.custom.messageLayoutId;
		}
	}
	
	return -1;
}


})();
