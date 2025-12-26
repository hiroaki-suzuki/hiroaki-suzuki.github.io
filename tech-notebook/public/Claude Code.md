---
title: Claude Code
permalink: claude-code/
created: 2025-06-27T19:37
updated: 2025-07-08T22:11:00
tags:
  - AI
  - AIエージェント
---
## 公式
- [Claude Code概要](https://docs.anthropic.com/ja/docs/claude-code/overview)
- [Claude Code: Best practices for agentic coding](https://www.anthropic.com/engineering/claude-code-best-practices)
- [プロンプトインプルーバーを使用してプロンプトを最適化する](https://docs.anthropic.com/ja/docs/build-with-claude/prompt-engineering/prompt-improver)

## リンク
- [Claude向け人名＋テクニック一覧(t_wadaさんのTDDなど)](https://www.memory-lovers.blog/entry/2025/06/27/102550)
- [AnthropicのDesktop Extensions (DXT)完全ガイド： ローカルAIアプリケーションの新時代 ](https://zenn.dev/cadp/articles/6d9dd374fd3d32)
- [Claude Codeの使用料金を可視化するCLIツール「ccusage」を作った](https://zenn.dev/ryoppippi/articles/6c9a8fe6629cd6)
- [Claude Code コマンドチートシート完全ガイド](https://qiita.com/akira_papa_AI/items/d68782fbf03ffd9b2f43)
- [スマホからClaude Codeを操作して、いつでもどこでもコーディング可能にする方法](https://zenn.dev/dirtyman/articles/cc724b87681593)
- [ryuzeeさんが推奨するスタイル](https://x.com/ryuzee/status/1938355011567948261?s=46)
- [ClaudeCodeの日本語入力問題、完全に理解した](https://zenn.dev/atu4403/articles/claudecode-japanese-input-solution#%E6%96%B0%E3%81%9F%E3%81%AA%E3%82%A2%E3%83%89%E3%83%90%E3%82%A4%E3%82%B6%E3%83%BC%E3%81%A8%E3%81%AE%E5%87%BA%E4%BC%9A%E3%81%84)
- [Claude Code の /hooks コマンドを使って、承認依頼とタスク完了時にスマホへ通知を飛ばす](https://zenn.dev/keit0728/articles/bfb68f669755a7)
- [ClaudeLog](https://www.claudelog.com/)
- [Claude Code 版 Orchestaror で複雑なタスクをステップ実行する](https://zenn.dev/mizchi/articles/claude-code-orchestrator)
- [AI時代のソフトウェア開発を考える（2025/07版）](https://speakerdeck.com/twada/agentic-software-engineering-findy-2025-07-edition)
- [Claude Code 疲れを軽減する 30+ 個のカスタムコマンド](https://wasabeef.jp/)


## みんなのClaude.md
- [https://x.com/sasakama_code/status/1938388070354849882](https://x.com/sasakama_code/status/1938388070354849882)
- [https://github.com/discus0434/python-template-for-claude-code/blob/main/CLAUDE.md](https://github.com/discus0434/python-template-for-claude-code/blob/main/CLAUDE.md)
- [https://x.com/gorilla0513/status/1938075769806438788](https://x.com/gorilla0513/status/1938075769806438788)
- [https://x.com/tokoroten/status/1936656130106946004](https://x.com/tokoroten/status/1936656130106946004)
- [https://x.com/naoya_ito/status/1929073291970363545](https://x.com/naoya_ito/status/1929073291970363545)
- [Kent Beck | BPlusTree3](https://github.com/KentBeck/BPlusTree3/blob/main/rust/docs/CLAUDE.md)
- 

## 動画
- [Caude Codeの使い方](https://youtu.be/n7iT5r0Sl_Y?si=N1ROFPDrOJVZIk74)


## 関連プロダクト
- [context-engineering-intro](https://github.com/coleam00/context-engineering-intro)
## Best practices
- 以下からのメモ
	- [Claude Code: Best practices for agentic coding](https://www.anthropic.com/engineering/claude-code-best-practices)

### 1. Customize your setup
#### a. Create `CLAUDE.md` files
- Claude セッション開始時に自動で読み込まれる特殊ファイル
- /init コマンドで、初期構成として Claude が自動で生成してくれる
	- 途中でやると現状に合わせて更新はしてくれる
- 以下のような情報をドキュメント化しておく
	- よく使う bash コマンド
	- 主要なファイルやユーティリティ関数
	- コードスタイルのガイドライン
	- テスト手順
	- リポジトリのエチケット（ブランチ命名ルール、マージ vs リベース など）
	- 開発環境セットアップ（pyenv の使用方法やコンパイラ設定など）
	- プロジェクト固有の注意点や警告事項
	- その他、Claude に「覚えておいてほしい」情報全般
- フォーマットは自由だが、わかりやすく簡潔にまとめるのが望ましい
	
#### b. Tune your `CLAUDE.md` files
- 改善のサイクルを回す
	- 一度に大量に変更せずに、モデルの応答の質を見ながら少しずつやっていく
	- プロンプト改善ツールをかけ、「IMPORTANT」「YOU MUST 〜」のような強調を追加すると応答がより正確になる傾向がある
		- [プロンプトインプルーバーを使用してプロンプトを最適化する](https://docs.anthropic.com/ja/docs/build-with-claude/prompt-engineering/prompt-improver)

#### c. Curate Claude's list of allowed tools
- システムに変更を加える可能性のある操作は確認を求められる
- 許可しても問題ない操作の許可設定をおこない効率化する
	- 1. セッション中に表示されるプロンプトで「Always allow（常に許可）」を選択する
	- 2. Claude Code 起動後に `/permissions` コマンドを使用して、ツールの追加・削除を行う
	- 3. `.claude/settings.json` または `~/.claude.json` を手動で編集する
	- 4. `--allowedTools` CLI フラグを使って、セッションごとに許可を設定する

#### d. If using GitHub, install the gh CLI
- GitHub CLIをインストールしておけば、それを使ってくれる

### 2. Give Claude more tools

#### a. Use Claude with bash tools


#### b. Use Claude with MCP

#### c. Use custom slash commands

### 3. Try common workflows

#### a. Explore, plan, code, commit

#### b. Write tests, commit; code, iterate, commit

#### c. Write code, screenshot result, iterate

#### d. Safe YOLO mode

#### e. Codebase Q&A

#### f. Use Claude to interact with git

#### g. Use Claude to interact with GitHub

#### h. Use Claude to work with Jupyter notebooks

### 4. Optimize your workflow

#### a. Be specific in your instructions

#### b. Give Claude images

#### c. Mention files you want Claude to look at or work on

#### d. Give Claude URLs

#### e. Course correct early and often

#### f. Use `/clear` to keep context focused

#### g. Use checklists and scratchpads for complex workflows

#### h. Pass data into Claude

### 5. Use headless mode to automate your infra

#### a. Use Claude for issue triage

#### b. Use Claude as a linter

### 6. Uplevel with multi-Claude workflows

#### a. Have one Claude write code; use another Claude to verify

#### b. Have multiple checkouts of your repo

#### c. Use git worktrees

#### d. Use headless mode with a custom harness

