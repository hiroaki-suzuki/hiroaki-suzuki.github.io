---
title: Amazon Bedrock AgentCore
permalink: amazon-bedrock-agentcore/
created: 2025-03-06 11:00
updated: 2025-03-06 11:00
---
## 概要
AIエージェントを本番運用するためのもの。2025年10月にGAになった。

## Amazon Bedrock Agentsとの違い
Bedrock Agentsはフルマネージドなエージェントサービスであり、別のサービスになる。
Bedrock AgentCoreは任意のフレームワークやモデルで構築したエージェントを本番レベルでホスティング・運用するためのサービス。

## 9つのコンポーネント
単体や組み合わせとわないモジュラー設計になっている。

| コンポーネント          | 役割                                  | 主要仕様                                      | ステータス   |
| :--------------- | :---------------------------------- | :---------------------------------------- | :------ |
| Runtime          | サーバーレス・マイクロ VM でエージェントをホスティング       | マイクロ VM 分離、最大 8 時間、HTTP/WebSocket、MCP/A2A | GA      |
| Gateway          | API/Lambda/サービスを MCP ツールに変換・公開      | OAuth/IAM/API キー、セマンティックツール選択             | GA      |
| Memory           | 短期・長期・エピソード記憶の管理                    | CreateEvent で短期蓄積、非同期抽出で長期化、意味検索          | GA      |
| Code Interpreter | 安全なサンドボックスでコード実行（Python/JS/TS）      | インライン 100 MB・S3 経由 5 GB・既定 15 分/最大 8 時間   | GA      |
| Browser Tool     | クラウドブラウザでウェブオートメーション                | WebSocket、Live View、S3 録画、最大 500 同時セッション  | GA      |
| Identity         | エージェント向け認証情報管理（OAuth・IAM SigV4）     | IAM SigV4、OAuth2.0、API キー、Token Vault     | GA      |
| Observability    | OpenTelemetry 形式のテレメトリ → CloudWatch | CloudWatch、OTEL 互換、セッション/トレース/スパン 3 層     | GA      |
| Policy           | Cedar 言語によるリアルタイムポリシー適用             | Cedar または自然言語からポリシー作成、default deny        | Preview |
| Evaluations      | 13 種のビルトイン評価器で品質モニタリング              | LLM-as-a-judge 含む、CloudWatch 統合           | Preview |

### Runtime
ホスティングするためのマネージドサービス で、アプリの実行基盤になる。
ホスティングになるため、エージェントフレームワークやモデルは自由に選択が可能。

各ユーザーセッションに対して専用のmicroVMが割り当てられ、計算リソース、メモリ、ファイルシステムが完全に分離される。エージェントが他のユーザーのデータにアクセス出来ない状態になる。

#### セッション管理
- セッションごとに専用のmicroVMが用意され隔離される
- セッション終了後にメモリはサニタイズされて、すべてのセッションデータは削除される
- セッションは最大８時間、非アクティブ15分（デフォルト）で終了
- セッションの状態は
	- Active
	- Idle
	- Terminated
- 最大100MBのペイロード対応
- HTTP, WebSocketの双方向ストリーミング対応
- スケーリングはゼロから数千同時セッションまで自動スケール

### Gateway

#### MCP変換
- OpenAPI、Lambda、API Gateway、MCPサーバーをMCPプロトコル変換
#### 認証
##### Inbound認証
- JWT、IAM SigV4、NONEで着信リクエストを検証
##### Outbound認証
- M2M、Gateway IAMロールでターゲットAPIを呼び出し

#### セマンティック検索
- 組み込みツールでコンテキストに応じた最適ツールを選定

#### インターセプター
- Lambda関数でリクエストとレスポンスをフックする

#### マルチMCP統合
- 複数MCPサーバーを単一エンドポイントに集約

### Identity

#### 2層認証アーキテクチャ
- Inbound Auth (エージェントへの着信認証)
	- IAM SigV4
		- デフォルト
	- JWT Bearer Token
		- カスタムJWT認可（Cognito、Okat、Auth0等）
		- SigV4との同時利用は不可
		- JWT authorizer は OIDC discovery 必須
			- [OpenID Connect (OIDC) ディスカバリー (Discovery) とは？](https://auth-wiki.logto.io/ja/openid-connect-discovery)
	- custom claims で `tenant_id` などを必須化可能

#### Token Vault
- OAuth token、refresh token、API Keyを一元管理出来る
- refresh tokenの自動利用に対応している

### Memory

#### 短期記録
- 最大365日まで設定可能
- 
#### 長期記録
- 4種類の戦略で管理
	- summaryMemoryStrategy
		- セッションの会話を要約して保存
	- userPreferenceMemoryStrategy
		- ユーザーの好みや行動パターンを学習・記録
	- semanticMemoryStrategy
		- ドメイン固有の事実情報を抽出・保存
	- episodic
		- 状況、意図、評価、行動、結果を構造化して記録
		- 2025年12月追加
		- 仕組み
			1. 抽出
				- 進行中のエピソードを分析して、完了を検出
			2. 統合
				-  完了したエピソードを単一のレコードに統合
			3. リフレクション
				- 複数エピソードを横断して成功パターン、失敗パターン、ベストプラクティスを抽出


### Code Interpreter

- 対応言語
	- Python、JavaScript、TypeScript


### Browser Tool
- 接続方式
	- WebSocket

### Observability

### Evaluations

### Policy
