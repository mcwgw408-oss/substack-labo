# Substack Labo

Substackでフォローしている発信者を整理するための、React + TypeScript + Vite製の発信者データベースです。

## できること

- 発信者名、Substack URL、ジャンル、フォロー日を登録
- フォローした理由、気になったポイント、真似したいポイント、学んだこと、メモを保存
- 新規登録、編集、削除、検索
- お気に入りとタグで整理
- ブラウザのローカルストレージに自動保存
- スマホでも使いやすいレスポンシブ表示

## 開発

```bash
npm.cmd install
npm.cmd run dev
```

## GitHub Pages

このリポジトリをGitHubへpushすると、`.github/workflows/deploy.yml`でビルドしてGitHub Pagesへ公開できます。

GitHubのリポジトリ設定で `Settings > Pages > Build and deployment > Source` を `GitHub Actions` にしてください。
