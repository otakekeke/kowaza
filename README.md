# 知見共有サイト

開発で得た知見を日々更新・公開できるウェブサイトです。HTMLエディタを使ってコンテンツを作成し、GitHub Pagesで公開できます。

## 特徴

- **シンプルな操作**: HTMLの知識があれば誰でも使える
- **リアルタイムプレビュー**: CodeMirrorエディタでコードを書きながらプレビューを確認
- **レスポンシブ対応**: Tailwind CSSでモバイルデバイスにも対応
- **ローカルストレージ**: ブラウザのlocalStorageでデータを保存
- **GitHub Pages対応**: 静的サイトとして簡単にデプロイ可能

## 使い方

### 1. 知見の作成
1. トップページで「新しい知見を追加」ボタンをクリック
2. タイトル、説明、タグを入力
3. 「作成してエディタを開く」でHTMLエディタに移動

### 2. HTMLの編集
1. 左側のエディタでHTMLコードを編集
2. 右側でリアルタイムプレビューを確認
3. `Ctrl+S` (または `Cmd+S`) で保存

### 3. ページの公開
1. 「公開」ボタンをクリック
2. ページのスラッグ（URL）を設定
3. HTMLファイルがダウンロードされるので、`pages/`ディレクトリにアップロード

## ファイル構造

```
/
├── index.html          # メインページ
├── editor.html         # HTMLエディタページ
├── js/
│   ├── main.js         # メイン機能
│   ├── editor.js       # エディタ機能
│   └── storage.js      # データ管理
├── pages/              # 公開ページ格納ディレクトリ
└── README.md           # このファイル
```

## GitHub Pagesでのデプロイ

1. GitHubリポジトリを作成
2. ファイルをpush
3. Settings → Pages → Source を "Deploy from a branch" に設定
4. Branch を "main" (または "master") に設定
5. `https://[username].github.io/[repository-name]/` でアクセス可能

## 技術仕様

- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **UIフレームワーク**: Tailwind CSS (CDN)
- **エディタ**: CodeMirror 5
- **アイコン**: Font Awesome 6
- **データストレージ**: Browser localStorage
- **ホスティング**: GitHub Pages (静的サイト)

## ブラウザ対応

- Chrome (推奨)
- Firefox
- Safari
- Edge

## ライセンス

MIT License