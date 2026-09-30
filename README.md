# LineHarness Plugins by Wachukobo

わちゅラボで開発するLineHarness用プラグインをまとめるリポジトリです。
各プラグインはLineHarness本体と別のCloudflare Workerとして動き、公式アップデートで独自コードが上書きされない構成にします。

## プラグイン一覧

| プラグイン | 用途 | 状態 |
| --- | --- | --- |
| [lead-score-tagger](./plugins/lead-score-tagger) | 診断・閲覧行動から見込み度を計算し、既存タグを付与 | v0.1.0 |

機械可読な一覧は [catalog.json](./catalog.json) にあります。

## 管理方針

- plugins/<plugin-name> ごとに独立したWorker・設定・依存関係を持たせる
- @line-harness/sdk はプラグイン単位で固定し、更新前に型検査とテストを行う
- 初期状態は DRY_RUN=true、定期実行なし
- APIキーはCloudflare Worker secretだけに保存する
- LINEへ直接送信せず、LineHarness SDK/APIを経由してログと送信元ルールを守る
- 本体D1のスキーマを変更しない

## 新しいプラグインの追加

公式LineHarnessリポジトリのルートで雛形を生成します。

    pnpm plugin:create ../line-harness-plugins/plugins/<plugin-name>

生成後はプラグイン内で npm install を実行し、ルートの catalog.json とCI対象を更新します。

## 一括確認

    for plugin in plugins/*; do
      (cd "$plugin" && npm ci && npm test && npm run typecheck && npm run build)
    done

## 互換性

- LineHarness SDK: 0.24.0
- Node.js: 22以上
- Runtime: Cloudflare Workers

## ライセンス

MIT
