# 見込み客スコアリングタグ

LineHarnessに蓄積した診断回答と閲覧行動を0〜100点で評価し、設定したしきい値以上の友だちへ既存タグを付与するプラグインです。

タグをシナリオの起点にすると「相談希望者は担当者へ通知」「料金ページを複数回見た人には費用対効果の記事を候補表示」といった個別対応へつなげられます。このプラグイン自身はメッセージを送信しません。

## 初期スコア

| 行動 | 加点 |
| --- | ---: |
| 個別相談を希望 | 60 |
| 診断を完了 | 20 |
| 料金ページ閲覧 | 1回10、最大20 |
| 動画を50%以上視聴 | 10 |
| 動画を75%以上視聴 | 20 |
| 計測リンクをクリック | 1回5、最大20 |

合計は100点を上限にします。初期しきい値は60点です。

## 読み取るメタデータ

| キー | 型 | 内容 |
| --- | --- | --- |
| consultationRequested | boolean | 個別相談希望 |
| diagnosisCompleted | boolean | Web診断完了 |
| pricingPageViews | number | 料金ページ閲覧回数 |
| videoWatchPercent | number | 動画視聴率 |
| trackedLinkClicks | number | 計測リンクのクリック回数 |

文字列の true や 3 は誤判定を避けるため得点に含めません。項目名や配点は [src/rules.ts](./src/rules.ts) で変更できます。

## 設定

1. LineHarness管理画面で「高見込み」などのタグを作成します。
2. wrangler.jsonc を編集します。

| 変数 | 内容 |
| --- | --- |
| LINE_HARNESS_API_URL | LineHarness本体APIのオリジン。/console は付けません |
| LINE_ACCOUNT_ID | 対象LINEアカウントID |
| TARGET_TAG_ID | 付与する既存タグID |
| SCORE_THRESHOLD | 1〜100の整数。初期値60 |
| DRY_RUN | 確認時は true |

3. ローカル専用の .dev.vars を作成します。

    LINE_HARNESS_API_KEY=実際のAPIキー

APIキーはGitへ登録しません。

## 確認

    npm install
    npm test
    npm run typecheck
    npm run build
    npm run dev

別のターミナルからローカル定期処理を呼びます。

    curl 'http://localhost:8787/__scheduled?cron=0+*+*+*+*'

Workerログに次の集計が出ます。友だち名やメタデータはログへ出しません。

- scanned: 確認した人数
- matched: タグ候補人数
- applied: 実際にタグを付けた人数
- threshold: 判定しきい値
- dryRun: 確認モードか

## 有効化

確認結果が正しければ、まずテスト用LINEアカウントで動かします。

1. DRY_RUN を false に変更
2. triggers.crons を ["0 * * * *"] に変更
3. secretとWorkerを公開

    npx wrangler secret put LINE_HARNESS_API_KEY
    npm run deploy

タグ付与がシナリオ配信を開始する場合は、LineHarness側のシナリオも確認してから有効化してください。

## 停止

triggers.crons を [] に戻して再デプロイします。停止しても既に付与したタグは残ります。

## 権限・データ

- 使用API: 友だち一覧、友だち詳細、タグ追加
- 読み取り: 友だちID、フォロー状態、LINEアカウントID、タグ、上記メタデータ
- 書き込み: 指定した既存タグの追加だけ
- 外部送信: なし
- LINE Messaging APIへの直接送信: なし
- 1回の確認上限: 1,000人。超過時は書き込み前に停止

APIキーはプラグイン専用の細かな権限制限を持たないため、信頼できるWorker secretにだけ保存してください。

## 本体更新時

プラグインは本体と別のWorker・リポジトリで管理されるため、公式更新でソースは上書きされません。LineHarness本体を更新する前に DRY_RUN=true で接続確認し、SDKを変更するときはテスト・型検査・ビルドを実行してください。

## 互換性

- 動作確認対象: LineHarness 0.24.x
- @line-harness/sdk: 0.24.0固定
- Node.js: 22以上

## ライセンス

MIT
