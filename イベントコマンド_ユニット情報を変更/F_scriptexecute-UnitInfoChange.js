/*
■ファイル名
F_scriptexecute-UnitInfoChange.js

■SRPG Studio対応バージョン
ver.1.231

■プラグインの概要
同盟軍および敵軍ユニットのユニット情報を変更する
（同盟や敵は「ユニット情報の変更」コマンドで説明文を変えられない）

■使用方法
このプラグインをpluginフォルダに入れる
イベントコマンド〈スクリプトの実行〉で「種類・コード実行」を選択する

テキストボックス内に以下の関数を記述する
引数(text)は''で囲んで記述すること

・ユニットの名前を変えたい場合
F_exchangeUnitInfo_Name('変更したい名前');

・ユニットの説明文を変えたい場合
F_exchangeUnitInfo_Description('変更したい説明文');

・ユニットの顔画像を変更したい場合
F_exchangeUnitInfo_faceImage(isRuntime, id, xSrc, ySrc);

※引数の記入方法
isRuntime：trueまたはfalse　(trueの場合ランタイム画像を使用、falseであればオリジナル画像を使用)
id：画像のid
xSrc：画像ファイルの並び順で左から何番目の画像なのか(左端を0)
ySrc：画像ファイルの並び順で上から何番目の画像なのか(上端を0)

例：ランタイムのゴブリンに顔画像を変更する
F_exchangeUnitInfo_faceImage(true, 60, 5, 0);

・変更するユニットの指定方法
同じイベントコマンド内の「オリジナルデータ」タブを選択してユニットの欄で指定する

■作成者
ran
*/


function F_exchangeUnitInfo_Name(text)
{
	var content = root.getEventCommandObject().getOriginalContent();
	var unit = content.getUnit();
	
	if (typeof text === 'string') {
		unit.setName(text);
	}
}


function F_exchangeUnitInfo_Description(text)
{
	var content = root.getEventCommandObject().getOriginalContent();
	var unit = content.getUnit();
	
	// エディタのツール>オプション>サイズ>データ説明の文字数と同じ値に設定すること
	var textCount = 70;

	if (typeof text === 'string') {
		// text文字数が70文字を超える場合は70文字のみ取り出す
		if (text.length > textCount) text = text.slice(0, textCount);
		
		unit.setDescription(text);
	}
}

function F_exchangeUnitInfo_faceImage(isRuntime, id, xSrc, ySrc)
{
	//createResourceHandle(isRuntime, id, colorIndex, xSrc, ySrc);
	var handle = root.createResourceHandle(isRuntime, id, 0, xSrc, ySrc);
	var content = root.getEventCommandObject().getOriginalContent();
	var unit = content.getUnit();
	
	if (handle.isNullHandle()) return;
	
	unit.setFaceResourceHandle(handle);
}

