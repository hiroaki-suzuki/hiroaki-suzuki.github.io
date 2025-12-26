---
title: Databricks
permalink: databricks/
created: 2025-07-02T20:39:00
updated: 2025-07-08T22:11:00
tags:
  - データ分析基盤
  - データレイク
  - データウェアハウス
  - データレイクハウス
---
## 公式
- [Databricks: Leading Data and AI Solutions for Enterprises](https://www.databricks.com/)
- [Databricksドキュメント AWS | Databricks Documentation](https://docs.databricks.com/aws/ja/)
- [Databricks REST API reference](https://docs.databricks.com/api/workspace/introduction)
- [Demo Center](https://www.databricks.com/resources/demos)

## リンク
- [Databricksにおけるデータパイプラインとオーケストレーション](https://qiita.com/taka_yayoi/items/dd4fe4af945c3c1eabe5)
- [Databricksにおける機能的ワークスペースの構成方法](https://qiita.com/taka_yayoi/items/f2aedc25516c43767f7f)

## 本
- [Databricks認定データエンジニアアソシエイト 学習ガイド](https://learning.oreilly.com/library/view/databricksren-ding-detaenziniaasosieito-xue-xi-gaido/9798341634305/)
- [メダリオンアーキテクチャの構築](https://learning.oreilly.com/library/view/medarionakitekutiyanogou-zhu/9798341638457/)

## 概要
- Apache Spark上に構築されたAI搭載のデータレイクハウス・プラットフォーム

## 課題感
データレイクとデータウェアハウスそれぞれに課題がある
そこを解決するために、データレイクハウスという考え方で課題を解決している

### データレイクハウス
- データレイクとデータウェアハウスの良いところを組み合わせたもの
	- データレイクの広大で柔軟、そしてコスト効率が良いストレージ
		- オープン性、スケーラビリティ、コスト効率
	- データウェアハウスの構造化され、整理され、分析可能なシステム
		- 信頼性、強力なガバナンス、パフォーマンス

### データレイク
- データレイクは柔軟だが、非構造化なので、データ品質やカバナンスで苦労することが多い

### データウェアハウス
- データウェアハウスは、構造化されているが、柔軟性はなくコストが高い。
- また多様で大量、かつ高速なデータの進化への対応が難しい

## アーキテクチャ
### 階層化アーキテクチャ
以下の４階層のアーキテクチャになっている

- Workspace
	- Data engineering
	- Data warehaousing
	- Machine learning
- Data governance
	- Unity Catalog
- Runtime
	- Apache Spark
	- Delta Lake
- Cloud infrastructure
	- Azure
	- [[AWS]]
	- Google Cloud

#### Cloud infrastructure
- 階層化アーキテクチャの基盤となる、クラウドがある
- Databricksはマルチクラウドプラットフォーム
	- Azure
	- [[AWS]]
	- Google Cloud
- Databricksが利用するハードウェアリソースを提供してもらう
	- ストレージ
	- ネットワーク
	- Databricks Runtimeを実行するコンピューティング環境
	- 実際に動作しているのはクラウドになる
		- Databricks側は管理や指示などを出すイメージ

#### Rumtime
- Databricksクラスタ内で使用するために最適化された、設定済みの仮想マシンイメージ
- Apache Spark、Delta Lake、その他の重要なシステムライブラリなどのセット
	- Delta Lakeは、トランザクション保証を提供する
		- データレイクを強化して、データの信頼性と一貫性を向上させる

#### Data governance
- Databricksレイクハウスアーキテクチャの中核であるUnity Catalogがある
- すべてのデータ、AI資産を一元管理するデータガバナンスソリューション
	- データのセキュリティ
	- 整合性
	- コンプライアンス

#### Workspace
- プラットフォームと対話するためのユーザーインターフェースとして機能する
- PythonやSQLなどを利用できる、インタラクティブな環境を提供
- ワークフロー、ダッシュボード、ノートブックなど様々な機能を提供

### デプロイ時のアカウント構成
２つのアカウントに分けられる
#### コントロールプレーン
- Databricksアカウント
- Web UI、クラスタ管理、ワークフロー、ノートブックなど
	- これらはDatabricks内の環境にデプロイされる
- Databricksによって管理され、Databricksないの様々なサービスをホストする
- 
#### データプレーン
- 各クラウドのアカウント
		- ストレージ、クラスタの仮想環境


## Delta Lake（デルタ・レイク）


## Unity Catalog
- Databricks上のデータ・テーブル・ファイル・機械学習モデルなどのリソースに対し、一元的なアクセス制御・監査・カタログ管理を実現する機能
- セキュリティやガバナンスの強化
- 組織全体でデータの整合性と可視性を確保
- コンパクトで管理しやすいデータアーキテクチャの実現

### Metastore（メタストア）
- 一番最上位のオブジェクト
	- リージョンのようなもの
		- リージョンに複数作れるが、作る必要がないと警告が出る
- Databricks上でデータ資産の情報（メタデータ）を一元的に保存・管理する中枢のリソース
- Unity Catalogで管理されるすべてのデータ構造とガバナンス情報の「台帳」のようなもの
- メタデータのデータベース
	- カタログ、スキーマ、テーブル、ビューの定義情報
	- 所有者、アクセス権限などのセキュリティ情報
	- データの保存場所（S3パスなど）
	- データのスキーマ情報（列名・型など）
	- Delta Sharing
	- クエリーフェデレーション（他のサービスと統合して使う）

### Unity Catalog オブジェクト モデル
- ３つの階層構造
	- カタログ > スキーマ > スキーマに含められるオブジェクト
- 3 レベルの名前空間 (`catalog.schema.table-etc`) として表される

以下は公式の画像
![公式の画像](https://docs.databricks.com/aws/ja/assets/images/object-model-40d730065eefed283b936a8664f1b247.png)

#### カタログ
![公式の画像](https://docs.databricks.com/aws/ja/assets/images/object-model-catalog-21738b620d61216dc15b52317f05c2ed.png)
公式の画像

- 最上位のコンテナ
- データ資産を整理するために使用する
- 最初にしっかりと設計しておく
- ストレージの資格情報や外部ロケーションなど、 データのセキュリティ保護できないオブジェクトは 、Unity Catalogでデータガバナンス モデルを管理するために使用する
- 例
	- 事業部ごとにカタログを分ける
	- 開発、検証、本番などで分ける
	
##### 作成に向けての考慮すべき点
- 組織のデータガバナンスの最上位モデルになるため、どのようなガバナンスをもとに利用するのかを明確にする必要がある
	- ここを失敗すると権限の制御が難しくなる


#### スキーマ
- データベースとも呼ばれる
- データと AI アセットを、カタログよりも詳細な論理カテゴリに整理する
- 通常、スキーマは 1 つのユースケース、プロジェクト、またはチームサンドボックスを表す

#### スキーマに含められるオブジェクト

##### ボリューム
- クラウド・オブジェクト・ストレージ内のデータの論理ボリュームを表す
- 非構造データを扱う場合に利用するもの
- ファイルをアップロードしたり、ダウンロードしたり、Pythonで動かしたり
- ボリュームの種類
	- マネージドボリューム
	- 外部ボリューム
##### テーブル
- 行と列で整理されたデータのコレクション
- テーブルの種類例
	- Delta Lakeテーブル
	- Icebargテーブル
	- 外部テーブルなど
- マネージドテーブル
	- デフォルトのストレージ、カタログごとに設定出来る
	- S3など
- 外部テーブル
	- マネージドとは別に、
	- クエリ最適化の対象外、パフォーマンスは落ちる
##### ビュー
- 1 つ以上のテーブルに対して保存されたクエリ
##### 関数(UDF)
- スカラー値または行のセットを返す保存されたロジック
##### AIモデル
- MLflow にパッケージ化された機械学習モデル


### 権限の管理


#### 管理者権限
[Unity Catalog の管理者特権](https://docs.databricks.com/aws/ja/data-governance/unity-catalog/manage-privileges/admin-privileges)

##### アカウント管理者
- 慎重に分散する必要がある高い特権ロール

##### ワークスペース管理者
- 慎重に分散する必要がある高い特権ロール

##### メタストア管理者
- 省略可能
- Unity Catalogの高度な特権を持つユーザー、またはグループ
- メタストア管理者は、メタストアの所有者でもある

#### オブジェクトの所有権
- セキュリティ保護可能なオブジェクトには、所有者がいる
	- ユーザー
	- グループ
	- サービスプリンシパル
- オブジェクトを作成するプリンシパルが、そのまま所有者になる
- 所有者は特権をもつ
	- そのオブジェクトに対するすべての権限が自動的に付与される
	- オブジェクトの所有者は、そのオブジェクトの子オブジェクトに対する権限を付与できる 
		- 子オブジェクトについては、別の誰かが作ることができれば、それは作成したユーザーなどが所有者になる
		- つまり、スキーマの所有者であっても、その中にある各テーブルは別の所有者を持つ可能性がある
		- 子オブジェクトに対する権限を付与できるというのは、子オブジェクトについては自動的にはテーブルに対する操作権限が付与されるわけではない
		- あくまで、スキーマの所有者は、スキーマ内のテーブルに対する権限を自分に付与できるということ

#### セキュリティ保護可能なオブジェクト
 [Unity Catalog の特権とセキュリティ保護可能なオブジェクト](https://docs.databricks.com/aws/ja/data-governance/unity-catalog/manage-privileges/privileges#securable-objects)
![公式の画像](https://docs.databricks.com/aws/ja/assets/images/object-hierarchy-fd5ca7071fad38082ad59f247fdd2410.png)
公式の画像

- メタストア自体を含めて、階層内の任意のレベルで許可や取り消しが出来る
- オブジェクトのアクセス権限は、子要素にも同じアクセス権限が付与される
	- 親で禁止すれば、子も禁止される