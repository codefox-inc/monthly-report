# 月次集計通知 Bot

## Notion の日報 DB

- 日報 DB のテーブル構造  
  ![image](https://user-images.githubusercontent.com/98569715/215028520-4f45ebb0-d58e-4ffa-9ff0-e8d797fcea4c.png)

- 詳しくは Codefox の Blog をご覧ください
  - [月次集計通知 Bot(Notion × Slack)](https://blog.codefox.co.jp/tech/monthly-report)
  - [日報通知 Bot(Notion × Slack)](https://blog.codefox.co.jp/tech/daily-report)
  - [Notion ではじめる情報集約術！](https://blog.codefox.co.jp/corporate/notion-system)

## ローカル環境構築

1. このリポジトリを git clone
2. `yarn install`
3. cp .env.example .env
4. .env に notionID や SlackID を入れます

## ローカルでの実行

- `yarn start`
  - ローカルで実行します　.env ファイルが必要です

## サーバ構成（Google Cloud Platform の場合）

- 当スクリプトは GCP の CloudFunctions で動作するように作られています
- CloudFunctions に Deploy し、Functions の変数に.env と同様の内容を設定します
- HTTP アクセスでスクリプトが動作するので、Cloud Scheduler から Functions のトリガー URL を定期的に叩くように設定してください