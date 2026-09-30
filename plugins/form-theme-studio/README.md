# LineHarness Form Theme Studio

LineHarnessで作成したフォームを、ブランドや用途に合うデザインで表示するCloudflare Workerプラグインです。フォーム定義・回答保存・タグ付与・シナリオ開始はLineHarnessに任せ、表示だけを独立Workerで変更します。

> LineHarness管理画面そのものの差し替えは現在の公式拡張対象外です。このプラグインが変更するのは、LINE利用者が回答するフォーム画面です。

## できること

- URLパラメータだけで5種類のテーマを切り替え
- LineHarnessのフォーム定義をSDKで取得
- LIFF ID tokenを使い、回答者本人としてLineHarnessへ送信
- 回答データをプラグイン側へ保存しない
- 任意CSSを受け付けず、固定プリセットで安全に運用
- LineHarness本体を変更しないため、公式アップデート後も独立して保守

## テーマ

| ID | 名前 | 向いている用途 |
| --- | --- | --- |
| line | LINE Green | 標準・汎用 |
| midnight | Midnight Premium | 高額商品・限定オファー |
| ocean | Ocean Trust | 教育・コンサルティング |
| sakura | Sakura Warm | 美容・コミュニティ |
| minimal | Minimal Ink | 法人・士業・汎用 |

表示URL:

    https://your-plugin.workers.dev/form/FORM_ID?theme=ocean

## セットアップ

必要環境:

- Node.js 22以上
- Cloudflare Workers
- LineHarness 0.24.x
- LineHarness APIキー
- フォーム回答用のLIFF ID

1. 依存関係をインストールします。

    npm install

2. wrangler.jsonc を設定します。

| 変数 | 内容 |
| --- | --- |
| LINE_HARNESS_API_URL | LineHarness本体APIのHTTPSオリジン |
| LIFF_ID | このWorker URLをエンドポイントに設定したLIFF ID |
| DEFAULT_THEME | line / midnight / ocean / sakura / minimal |

3. APIキーをWorker secretへ登録します。

    npx wrangler secret put LINE_HARNESS_API_KEY

4. 確認します。

    npm test
    npm run typecheck
    npm run build

5. デプロイします。

    npm run deploy

6. LINE Developersで、LIFFアプリのエンドポイントURLをデプロイ先WorkerのURLに設定します。

## 使用方法

LineHarnessでフォームを作成し、フォームIDを確認します。次のURLをLINEから開きます。

    https://your-plugin.workers.dev/form/FORM_ID?theme=midnight

フォーム送信時にLIFF SDKがLINE ID tokenを取得し、このWorkerがLineHarnessの公開フォーム送信APIへ転送します。LINE外の通常ブラウザではテーマ確認はできますが、回答送信時にLINEログインが必要です。

## 停止方法

Cloudflare WorkersでこのWorkerを無効化または削除します。LineHarness本体のフォーム、回答、タグ、シナリオは削除されません。既存のフォームURLをLineHarness標準LIFF URLへ戻せば運用を継続できます。

## 使用API・権限

| 処理 | API | 認証 |
| --- | --- | --- |
| フォーム定義取得 | SDK forms.get / GET /api/forms/:id | LineHarness APIキー |
| 回答送信 | POST /api/forms/:id/submit | 回答者のLINE ID token |

読み取る情報:

- フォーム名、説明、項目、選択肢、受付状態

書き込む情報:

- 回答者が入力したフォーム回答
- LineHarness側で設定済みのタグ付与・シナリオ開始・メタデータ保存が実行される場合があります

外部送信先:

- 設定したLineHarness本体APIのみ
- LIFF SDKの認証処理でLINEプラットフォームへ接続

保持しない情報:

- LINE ID token
- フォーム回答
- 顧客情報

ログにはフォーム回答、ID token、APIキーを出しません。

## セキュリティ

- 接続先APIは環境変数で固定し、利用者入力から変更できません
- フォームIDは英数字・ハイフン・アンダースコアだけを許可
- 任意CSS、任意HTML、外部スクリプトURLは受け付けません
- Content Security Policyを設定
- 回答送信にはLINE ID tokenが必須
- APIキーはWorker secretだけに保存
- エラー応答で秘密情報を返しません

## 既知の制限

- LineHarness管理画面の配色は変更しません
- テーマは固定プリセットです。追加にはソース変更が必要です
- LIFF IDとWorkerエンドポイントURLの設定が必要です
- LineHarness独自の高度なフォーム専用UIは、標準フィールドへ簡略表示される場合があります
- 本体API互換性はLineHarness更新前に再確認してください

## 動作確認

- LineHarness: 0.24.x
- @line-harness/sdk: 0.24.0固定
- Node.js: 22
- Cloudflare Workers / Wrangler 4
- 単体テスト: テーマ選択、HTMLエスケープ、フォーム表示、ID token転送、未認証拒否、不正ID拒否
- 型検査: TypeScript
- ビルド: wrangler deploy --dry-run

## ライセンス

MIT
