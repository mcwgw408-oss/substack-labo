# Substack Labo

Substackで見つけた発信者や記事の気づきを記録する、React + TypeScript + Vite製の小さな研究ノートです。

## できること

- 発見日、発信者名、URL、ジャンル、気になった理由、真似したいポイント、メモを保存
- ブラウザのローカルストレージに自動保存
- キーワード検索
- スマホでも使いやすいレスポンシブ表示

## 開発

```bash
npm.cmd install
npm.cmd run dev
```

## GitHub Pages

このリポジトリをGitHubへpushすると、`.github/workflows/deploy.yml`でビルドしてGitHub Pagesへ公開できます。

GitHubのリポジトリ設定で `Settings > Pages > Build and deployment > Source` を `GitHub Actions` にしてください。
