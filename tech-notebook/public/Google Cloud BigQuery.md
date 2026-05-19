---
title: Big Query - Google Cloud
permalink: big-query-google-cloud/
created: 2026-05-18 22:00:00
updated: 2026-05-19 19:00:00
tags:
  - Google_Cloud
  - BigQuery
---
## 主要な公式ドキュメント一覧

| トピック | 公式ページ |
|---|---|
| パーティショニング 概要 | https://cloud.google.com/bigquery/docs/partitioned-tables |
| パーティショニング 作成 | https://cloud.google.com/bigquery/docs/creating-partitioned-tables |
| パーティショニング 管理 | https://cloud.google.com/bigquery/docs/managing-partitioned-tables |
| パーティショニング クエリ | https://cloud.google.com/bigquery/docs/querying-partitioned-tables |
| クラスタリング 概要 | https://cloud.google.com/bigquery/docs/clustered-tables |
| クラスタリング 作成 | https://cloud.google.com/bigquery/docs/creating-clustered-tables |
| クラスタリング クエリ | https://cloud.google.com/bigquery/docs/querying-clustered-tables |
| クラスタリング 管理 | https://cloud.google.com/bigquery/docs/manage-clustered-tables |
| Partition/Cluster Recommender | https://cloud.google.com/bigquery/docs/manage-partition-cluster-recommendations |
| Recommendations 全体像 | https://cloud.google.com/bigquery/docs/recommendations-intro |
| INFORMATION_SCHEMA PARTITIONS | https://cloud.google.com/bigquery/docs/information-schema-partitions |
| INFORMATION_SCHEMA COLUMNS | https://cloud.google.com/bigquery/docs/information-schema-columns |
| INFORMATION_SCHEMA TABLE_OPTIONS | https://cloud.google.com/bigquery/docs/information-schema-table-options |
| RLS 概要（プルーニングの注意） | https://cloud.google.com/bigquery/docs/row-level-security-intro |
| RLS と他機能の連携 | https://cloud.google.com/bigquery/docs/using-row-level-security-with-features |
| RLS ベストプラクティス | https://cloud.google.com/bigquery/docs/best-practices-row-level-security |
| GoogleSQL DDL（CREATE TABLE 構文） | https://cloud.google.com/bigquery/docs/reference/standard-sql/data-definition-language |
| ストレージ最適化のベストプラクティス | https://cloud.google.com/bigquery/docs/best-practices-storage |

---

## パーティショニング

### パーティショニングとは

テーブルを特定のカラムの値で**物理的に分割して保存**する仕組み。
パーティションフィルタを使うことで、必要な分割部分だけをスキャンしてコストを大幅削減できる。

> 公式：[Introduction to partitioned tables](https://cloud.google.com/bigquery/docs/partitioned-tables)

```
パーティションなし：
[全データがひとまとまり]
→ 1日分だけ欲しくても全期間スキャン

パーティションあり（日付で分割）：
[2026-01-01のデータ]
[2026-01-02のデータ]
[2026-01-03のデータ]
→ 1日分だけ欲しければその1パーティションだけスキャン
```

### パーティションの種類
| 種類             | 対象カラム型                                         | 典型的な使いどころ            |
| -------------- | ---------------------------------------------- | -------------------- |
| 時間単位カラムパーティション | DATE / TIMESTAMP / DATETIME                    | ログ・イベント・取引日など（最も一般的） |
| 範囲パーティション      | INTEGER                                        | ユーザーID範囲・スコア帯など      |
| 取り込み時間パーティション  | なし（`_PARTITIONTIME` / `_PARTITIONDATE` 疑似列を使用） | 取り込み日時基準で分割したい場合     |

> 公式（種類の定義）：[Introduction to partitioned tables — Partitioning types](https://cloud.google.com/bigquery/docs/partitioned-tables)  
> 公式（`_PARTITIONTIME` / `_PARTITIONDATE` の挙動）：[Querying partitioned tables — Ingestion-time partitioned tables](https://cloud.google.com/bigquery/docs/querying-partitioned-tables#ingestion_time)

**時間粒度の補足**
- DATE：日・月・年
- TIMESTAMP / DATETIME：時・日・月・年の粒度を使える

> 公式：[Introduction to partitioned tables — Time-unit column partitioning](https://cloud.google.com/bigquery/docs/partitioned-tables#date_timestamp_partitioned_tables)

> ⚠️ **パーティション境界はUTC基準**：JSTの「日次データ」を `TIMESTAMP` でパーティションすると、JSTの1日とUTCの1日が9時間ずれる。JST日付でフィルタしても2パーティション読まれるなど、プルーニングが期待通り効かないことがある。対策は以下のいずれか：
> - UTC基準で運用する（業務要件次第）
> - JST日付の `DATE` 列を別途持ち、それでパーティション
> - `DATETIME` を使う（タイムゾーン情報なしで自由解釈）
>
> 公式（境界はUTC）：[Introduction to partitioned tables — Ingestion time partitioning](https://cloud.google.com/bigquery/docs/partitioned-tables#ingestion_time)（"Partition boundaries are based on UTC time."）

### 設計チェックリスト

- DATE / TIMESTAMP / DATETIME列はあるか？ → パーティション列の候補
- 特定期間だけ絞るクエリが多いか？ → パーティションの効果が高い
- パーティションごとのデータ量は十分か？ → 約10GB未満の小さいパーティションが大量にできる設計は避ける（[Introduction to clustered tables — When to use clustering instead of partitioning](https://cloud.google.com/bigquery/docs/clustered-tables#when_to_use_clustering_instead_of_partitioning) ：「Partitioning your table results in an average partition size of at least 10 GB per partition」を満たさない場合）
- **UTC境界の影響を考慮しているか？** → JST運用なら DATE列追加 or DATETIME を検討
- RLSを適用するテーブルか？ → RLSポリシーだけではプルーニングされないため、利用クエリ側にパーティション列フィルタが入る設計にする（[RLS — Best practices](https://cloud.google.com/bigquery/docs/best-practices-row-level-security)）
- パーティション数が10,000を超えないか？ → 粒度を確認（[BigQuery quotas — Partitioned tables](https://cloud.google.com/bigquery/quotas#partitioned_tables)）
- `require_partition_filter` を設定したか？ → 誤フルスキャン防止（[Set partition filter requirements](https://cloud.google.com/bigquery/docs/managing-partitioned-tables#require-filter)）
- `partition_expiration_days` を設定したか？ → ストレージコスト削減（INTEGER範囲パーティションは非対応）（[Managing partitioned tables — Set the partition expiration](https://cloud.google.com/bigquery/docs/managing-partitioned-tables#partition-expiration)）
- **DDL：** TIMESTAMP / DATETIME型で日粒度以外を使う場合、`TIMESTAMP_TRUNC` / `DATETIME_TRUNC` で粒度を明示しているか？（日粒度なら `DATE(ts)` でも可）（[Creating partitioned tables — Create a time-unit column-partitioned table](https://cloud.google.com/bigquery/docs/creating-partitioned-tables#create_time-unit_partitioned_table)）
- **クエリ：** パーティション列を素直な範囲条件で絞っているか？（関数で包む `WHERE DATE(ts) = ...` はプルーニングが効きにくい）（[Querying partitioned tables — Limit the partitions scanned](https://cloud.google.com/bigquery/docs/querying-partitioned-tables#use_a_constant_expression)）

### ベストプラクティス
#### ① require_partition_filter を設定する

パーティションフィルタなしのクエリをエラーにして、誤ったフルスキャンを防止する。

> 公式：[Managing partitioned tables — Set partition filter requirements](https://cloud.google.com/bigquery/docs/managing-partitioned-tables#require-filter)

```sql
ALTER TABLE `プロジェクト.データセット.テーブル名`
SET OPTIONS (require_partition_filter = true);
```

> **注意**：パーティション列への述語が少なくとも1つ必要。
> `WHERE partition_col = '2026-01-01'` はOKだが、
> `WHERE (partition_col = '2026-01-01' OR other_col = 'x')` は要件を満たさない。
>
> 公式エラーメッセージ例：[Querying partitioned tables — Require a partition filter](https://cloud.google.com/bigquery/docs/querying-partitioned-tables#require-filter)（"Cannot query over table 'project_id.dataset.table' without a filter that can be used for partition elimination."）

#### ② partition_expiration_days で古いデータを自動削除

ストレージコスト削減に有効。ログ系テーブルに特に効果的。

> 公式：[Managing partitioned tables — Set the partition expiration](https://cloud.google.com/bigquery/docs/managing-partitioned-tables#partition-expiration)

```sql
ALTER TABLE `プロジェクト.データセット.テーブル名`
SET OPTIONS (partition_expiration_days = 365);
```

> **注意**：`partition_expiration_days` は時間単位カラムパーティション / 取り込み時間パーティション向け。**INTEGER範囲パーティションではサポートされない。**
>
> 公式：[Integer range partitioning — limitations](https://cloud.google.com/bigquery/docs/partitioned-tables#integer_range)

#### ③ Partition/Cluster Recommender を活用する

BigQueryが過去最大30日のワークロード実行データを分析し、パーティション・クラスタリングによるコスト最適化の推奨を出してくれる。

> 公式：[Manage partition and cluster recommendations](https://cloud.google.com/bigquery/docs/manage-partition-cluster-recommendations)  
> 補足：[Recommendations overview](https://cloud.google.com/bigquery/docs/recommendations-intro)  
> 背景解説（公式ブログ）：[New BigQuery partitioning and clustering recommendations](https://cloud.google.com/blog/products/data-analytics/new-bigquery-partitioning-and-clustering-recommendations)

確認場所：
- Google Cloud コンソール：**BigQuery > Recommendations 画面**
- `gcloud` コマンド
- Recommender API

> **補足**：推奨対象には閾値・条件がある。
> - **Partition推奨**：テーブルが **100GB未満** だと表示されない
> - **Cluster推奨**：テーブルが **10GB未満** だと表示されない
> - 既にパーティション/クラスタ済みのテーブルは対象外
> - **過去30日間に読まれていない** テーブルは対象外
> - **推定節約効果が極小（1 slot hour未満）** の場合は表示されない
>
> 公式（閾値の明記）：[Manage partition and cluster recommendations — Troubleshoot: No recommendations appear](https://cloud.google.com/bigquery/docs/manage-partition-cluster-recommendations#troubleshooting)

### アンチパターン

#### LIMIT句でスキャン削減できると思ってる

LIMIT はあくまで**結果の行数を制限するだけ**。スキャン量は変わらない。

> 公式（LIMIT はバイト数を減らさない）：[Estimate and control costs](https://cloud.google.com/bigquery/docs/best-practices-costs#use_partitioning_and_clustering)

```sql
-- NG：フルスキャンされる
SELECT * FROM `テーブル` LIMIT 100;

-- OK（DATE型）：WHEREでパーティションフィルタを使う
SELECT * FROM `テーブル`
WHERE created_at = '2026-01-01'
LIMIT 100;

-- OK（TIMESTAMP型）：範囲で絞る
SELECT * FROM `テーブル`
WHERE created_at >= TIMESTAMP('2026-01-01')
  AND created_at <  TIMESTAMP('2026-01-02')
LIMIT 100;
```

#### 動的フィルタ式でパーティションプルーニングを期待する

サブクエリ依存・動的な式は、BigQueryがクエリ実行前にパーティションを特定できないためプルーニングされない。**定数式**で書くこと。

> 公式：[Querying partitioned tables — Limit the partitions scanned](https://cloud.google.com/bigquery/docs/querying-partitioned-tables#use_a_constant_expression)  
> （"To limit the partitions that are scanned in a query, use a constant expression in your filter. ... If you use dynamic expressions in your query filter, BigQuery must scan all of the partitions."）

```sql
-- NG：サブクエリ依存でプルーニングされない（全パーティションスキャン）
SELECT * FROM `テーブル` t1
WHERE t1.created_at = (SELECT MAX(created_at) FROM `別テーブル`);

-- NG：関数で包むとプルーニングされにくい
SELECT * FROM `テーブル`
WHERE DATE(created_at) = '2026-01-01';  -- created_atがTIMESTAMP型の場合

-- OK：定数式で絞る
SELECT * FROM `テーブル`
WHERE created_at >= TIMESTAMP('2026-01-01')
  AND created_at <  TIMESTAMP('2026-01-02');
```

#### JST境界をUTC列で絞ってしまう

JSTの「2026-01-01の1日分」を UTC TIMESTAMP のパーティション列で素朴に絞ると、2パーティション読まれる。

> 公式（UTC境界）：[Introduction to partitioned tables — Ingestion time partitioning](https://cloud.google.com/bigquery/docs/partitioned-tables#ingestion_time)

```sql
-- ⚠️ 2パーティション読まれる
SELECT * FROM `テーブル`
WHERE created_at >= TIMESTAMP('2026-01-01 00:00:00', 'Asia/Tokyo')
  AND created_at <  TIMESTAMP('2026-01-02 00:00:00', 'Asia/Tokyo');
-- UTCでは 2025-12-31 15:00 〜 2026-01-01 15:00 に相当
```

これを許容するか、JST DATE列を持って単一パーティションで絞るかは設計判断。

### パーティションしない方が良いケース

| ケース                       | 理由                                                          | 公式リンク |
| ------------------------- | ----------------------------------------------------------- | --- |
| パーティションごとのデータ量が小さすぎる      | 公式目安では約10GB未満の小さいパーティションが大量にできる場合、メタデータ増加により逆効果になり得る        | [Introduction to clustered tables — When to consider partitioning](https://cloud.google.com/bigquery/docs/clustered-tables#when_to_use_clustering_instead_of_partitioning) |
| 常に全件スキャンするクエリしかない         | 分割してもプルーニングの恩恵がない                                           | [Introduction to partitioned tables — When to use](https://cloud.google.com/bigquery/docs/partitioned-tables#when_to_use_table_partitioning) |
| クエリの絞り込み条件とパーティションキーが合わない | 取り込み時間パーティションなどを無理に使っても、実クエリで絞れなければ効果が薄い                    | 同上 |
| RLSの条件だけで絞れると思っている        | RLSポリシー自体はパーティションプルーニングに参加しない。クエリ側でパーティション列フィルタを明示的に書く必要がある | [RLS — Best practices](https://cloud.google.com/bigquery/docs/best-practices-row-level-security) / [Using RLS with features](https://cloud.google.com/bigquery/docs/using-row-level-security-with-features) |
| パーティション数が10,000を超えそう      | BigQueryの上限に達するため、粒度を粗くするかクラスタリングを検討する                      | [BigQuery quotas — Partitioned tables](https://cloud.google.com/bigquery/quotas#partitioned_tables) |

### DDL（作成方法）

> 公式：
> - [Creating partitioned tables](https://cloud.google.com/bigquery/docs/creating-partitioned-tables)
> - [CREATE TABLE 構文（DDL リファレンス）](https://cloud.google.com/bigquery/docs/reference/standard-sql/data-definition-language#create_table_statement)

#### テーブル作成時（DATE型）

```sql
CREATE TABLE `プロジェクト.データセット.テーブル名`
(
  id         INT64,
  name       STRING,
  amount     NUMERIC,
  created_at DATE
)
PARTITION BY created_at
OPTIONS (
  require_partition_filter = true,
  partition_expiration_days = 365
);
```

#### テーブル作成時（TIMESTAMP型）

TIMESTAMP列で**日以外の粒度（hour / month / year）**を指定する場合は `TIMESTAMP_TRUNC()` が必須。日粒度なら `DATE(created_at)` でも可。

> 公式（粒度ごとの書き方）：[Creating partitioned tables — Create a time-unit column-partitioned table](https://cloud.google.com/bigquery/docs/creating-partitioned-tables#create_time-unit_partitioned_table)

```sql
-- 日粒度（DATE関数版・公式チュートリアルでもよく使われるパターン）
CREATE TABLE `プロジェクト.データセット.テーブル名`
(
  id         INT64,
  name       STRING,
  created_at TIMESTAMP
)
PARTITION BY DATE(created_at)
OPTIONS (
  require_partition_filter = true,
  partition_expiration_days = 365
);

-- 日粒度（TIMESTAMP_TRUNC版）
PARTITION BY TIMESTAMP_TRUNC(created_at, DAY)

-- 時粒度（TIMESTAMP_TRUNC必須）
PARTITION BY TIMESTAMP_TRUNC(created_at, HOUR)

-- 月粒度（TIMESTAMP_TRUNC必須）
PARTITION BY TIMESTAMP_TRUNC(created_at, MONTH)
```

#### テーブル作成時（DATETIME型）

```sql
CREATE TABLE `プロジェクト.データセット.テーブル名`
(
  id         INT64,
  name       STRING,
  created_at DATETIME
)
PARTITION BY DATETIME_TRUNC(created_at, DAY)
OPTIONS (
  require_partition_filter = true,
  partition_expiration_days = 365
);
```

#### 範囲パーティション（INTEGER型）

> 公式：[Creating partitioned tables — Create an integer-range partitioned table](https://cloud.google.com/bigquery/docs/creating-partitioned-tables#create_an_integer-range_partitioned_table)

```sql
CREATE TABLE `プロジェクト.データセット.テーブル名`
(
  user_id INT64,
  name    STRING
)
PARTITION BY RANGE_BUCKET(
  user_id,
  GENERATE_ARRAY(0, 1000000, 10000)  -- 0〜100万を1万刻みで分割
);
```

> ※ INTEGER範囲パーティションは `partition_expiration_days` 非対応。

#### 既存テーブルへの適用

> ⚠️ BigQueryは既存テーブルに後からパーティションを追加できない。
> 新テーブルを作成してデータをコピーする手順が必要。
>
> 公式：[Manage partition and cluster recommendations — Apply partition recommendations](https://cloud.google.com/bigquery/docs/manage-partition-cluster-recommendations#apply-partition-recommendation)  
> （"BigQuery does not support changing the partitioning scheme of a table in place. You can only change the partitioning of a table on a copy of the table."）

```sql
-- DATE型の場合
CREATE TABLE `プロジェクト.データセット.新テーブル名`
PARTITION BY created_at
AS
SELECT * FROM `プロジェクト.データセット.旧テーブル名`;

-- TIMESTAMP型の場合
CREATE TABLE `プロジェクト.データセット.新テーブル名`
PARTITION BY TIMESTAMP_TRUNC(created_at, DAY)
AS
SELECT * FROM `プロジェクト.データセット.旧テーブル名`;
```

### パーティション設定の確認方法

##### コンソール
テーブルの「詳細」タブを開く。`パーティショニング` セクションにパーティション列・有効期限が表示される。設定なしの場合はセクション自体が表示されないか「なし」と表示される。

> 公式：[Getting information about partitioned tables](https://cloud.google.com/bigquery/docs/managing-partitioned-tables#get-info)

##### INFORMATION_SCHEMA（SQL）

**テーブルオプション（require_partition_filter / partition_expiration_days）の確認**

> 公式：[TABLE_OPTIONS view](https://cloud.google.com/bigquery/docs/information-schema-table-options)

```sql
SELECT
  table_name,
  option_name,
  option_value
FROM `プロジェクト.データセット.INFORMATION_SCHEMA.TABLE_OPTIONS`
WHERE table_name = '確認したいテーブル名'
AND option_name IN (
  'require_partition_filter',
  'partition_expiration_days'
);
```

**パーティション列・粒度の確認**

> 公式：[COLUMNS view](https://cloud.google.com/bigquery/docs/information-schema-columns)（`is_partitioning_column` フィールド）

```sql
SELECT
  table_name,
  column_name,
  is_partitioning_column
FROM `プロジェクト.データセット.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = '確認したいテーブル名'
AND is_partitioning_column = 'YES';
```

**パーティション単位の状態（実測値で「10GB未満が大量」を検出）**

> 公式：[PARTITIONS view](https://cloud.google.com/bigquery/docs/information-schema-partitions)

```sql
SELECT
  partition_id,
  total_rows,
  total_logical_bytes,
  last_modified_time
FROM `プロジェクト.データセット.INFORMATION_SCHEMA.PARTITIONS`
WHERE table_name = '確認したいテーブル名'
ORDER BY partition_id DESC;
```

##### bq コマンド

```bash
bq show プロジェクト:データセット.テーブル名
# Time Partitioning: DAY on created_at　← この行があれば設定済み
```


## クラスタリング

### クラスタリングとは

テーブルまたはパーティション内のデータを、クラスタリング列の値に基づいて**ストレージブロック単位でソート・グループ化**する仕組み。 クラスタリング列でフィルタすると、BigQueryがブロックメタデータを使って不要なブロックをスキップ（block pruning）しスキャン量を削減できる。

> 公式：[Introduction to clustered tables](https://cloud.google.com/bigquery/docs/clustered-tables)（"In BigQuery, a clustered column is a user-defined table property that sorts storage blocks based on the values in the clustered columns."）  
> 公式（block pruning）：[Introduction to clustered tables — Block pruning](https://cloud.google.com/bigquery/docs/clustered-tables#block_pruning)

```
クラスタリングなし（パーティション内がバラバラ）：
[2026-01-01のデータ]
  → user_id = 1001 のデータだけを効率よく特定できず、
    該当パーティション内の広い範囲をスキャンしやすい

クラスタリングあり（user_idでグループ化済み）：
[2026-01-01のデータ]
  user_id: 1001のブロック
  user_id: 1002のブロック
  user_id: 1003のブロック
  → block metadata により、条件に合う可能性があるブロックだけをスキャンしやすい
```

### パーティショニングとの違い

|              |パーティショニング|クラスタリング|
|---|---|---|
| 分割方法         |パーティションというセグメントに分割|ストレージブロック単位でソート・グループ化|
| 対象型          |DATE / TIMESTAMP / DATETIME / INTEGER|BIGNUMERIC / BOOL / DATE / DATETIME / GEOGRAPHY / INT64 / NUMERIC / RANGE / STRING / TIMESTAMP|
| スキャン削減       |パーティション単位で丸ごとスキップ|ブロック単位でスキップ|
| 最大設定数        |1列|最大4列|
| クエリ前のコスト見積もり |**確定する**|**確定しない**（実行後に決まる）|

> 公式（クラスタ列の型一覧 / 最大4列）：[Create clustered tables — Cluster column types and ordering](https://cloud.google.com/bigquery/docs/creating-clustered-tables#cluster-column-types-and-ordering) および [Introduction to clustered tables](https://cloud.google.com/bigquery/docs/clustered-tables)  
> 公式（クラスタはクエリ前にコスト見積もり不可）：[Introduction to clustered tables](https://cloud.google.com/bigquery/docs/clustered-tables)（"When you query a clustered table, you don't receive an accurate query cost estimate before query execution because the number of storage blocks to be scanned is not known before query execution."）

### 設計チェックリスト

- WHERE・集計・頻出フィルタ条件に使われる列はあるか？ → クラスタリング列の候補
- カーディナリティは適切か？ → distinct値が多い列ほどブロックpruningの効果が高い（[Introduction to clustered tables — When to use clustering](https://cloud.google.com/bigquery/docs/clustered-tables#when_to_use_clustering)）
- 列の順序は正しいか？ → 最も絞り込みに使う列を先頭に配置する（[Create clustered tables — Cluster column types and ordering](https://cloud.google.com/bigquery/docs/creating-clustered-tables#cluster-column-types-and-ordering)）
- パーティション＋クラスタリングの組み合わせを検討したか？ → 大規模テーブルで特に有効（[Introduction to clustered tables — Combine clustered and partitioned tables](https://cloud.google.com/bigquery/docs/clustered-tables#combining_clustered_and_partitioned_tables)）
- クエリ側がクラスタリング列を先頭から順に使っているか？ → 先頭列をスキップすると効果が薄い（[Querying clustered tables — Filter clustered columns in sort order](https://cloud.google.com/bigquery/docs/querying-clustered-tables#filter_clustered_columns_in_sort_order)）
- クラスタリング列のフィルタが定数式になっているか？ → サブクエリ依存の動的フィルタはblock pruningされない
- STRING列を使う場合、先頭1,024文字以内に識別情報が収まっているか？ → BigQueryはSTRING列の先頭1,024文字のみをクラスタリングに使用する（[Introduction to clustered tables — Limitations](https://cloud.google.com/bigquery/docs/clustered-tables#limitations) ：「When using STRING type columns for clustering, BigQuery uses only the first 1,024 characters to cluster the data.」）
- コスト見積もりはクエリ実行後に確認する認識があるか？ → 実行前はクラスタリングによる削減が反映されていない値が表示される
- 既存テーブルに後からクラスタリングを追加した場合、既存データは自動再配置されないことを把握しているか？ → 既存データまで反映したい場合はUPDATEまたはCTASが必要（[Introduction to clustered tables — Limitations](https://cloud.google.com/bigquery/docs/clustered-tables#limitations) ：「If you alter an existing non-clustered table to be clustered, the existing data is not automatically clustered.」）

---

### ベストプラクティス

#### ① 最大4カラム・選択性の高い列を先頭に

> 公式：[Create clustered tables — Cluster column types and ordering](https://cloud.google.com/bigquery/docs/creating-clustered-tables#cluster-column-types-and-ordering)  
> （"You can specify up to four clustering columns. ... As a best practice, place the most frequently filtered or aggregated column first."）

```sql
CLUSTER BY 最も絞り込みに使う列, 次に使う列, ...
```

先頭の列から順にスキャン削減効果が出る。クエリのWHEREや集計に登場しない列や、絞り込み効果が薄い列を先頭に置いても意味がない。

#### ② パーティション＋クラスタリングの組み合わせ

パーティションで日付を絞り、さらにクラスタリングで対象ユーザーや種別を絞る二段階のスキャン削減が実現できる。大規模テーブルで特に有効。

> 公式：[Introduction to clustered tables — Combine clustered and partitioned tables](https://cloud.google.com/bigquery/docs/clustered-tables#combining_clustered_and_partitioned_tables)

```sql
PARTITION BY DATE(created_at)
CLUSTER BY user_id, category
```

> **注意**：細かすぎるパーティションを大量に作るとメタデータ増加で逆効果になり得る。平均パーティションサイズが十分大きいか（目安：10GB以上）確認する。（[Introduction to clustered tables — When to use clustering instead of partitioning](https://cloud.google.com/bigquery/docs/clustered-tables#when_to_use_clustering_instead_of_partitioning)）

#### ③ 自動再クラスタリングに任せる

BigQueryはデータが追加・更新されるとバックグラウンドで自動的に再クラスタリングする。自動再クラスタリングは**無料操作**として分類されており、追加課金は発生しない。

> 公式：[Introduction to clustered tables — Automatic re-clustering](https://cloud.google.com/bigquery/docs/clustered-tables#automatic_re-clustering)  
> （"To maintain the performance characteristics of a clustered table, BigQuery performs automatic reclustering in the background."）  
> 公式（無料操作）：[Free operations](https://cloud.google.com/bigquery/pricing#free)

> **注意**：既存テーブルに後からクラスタリング仕様を追加・変更した場合、**既存データは自動的には新しいクラスタリング状態に再配置されない**。新規データのみが自動再クラスタリングの対象になる。既存データまで反映したい場合は、UPDATEで全行を書き直すか、CTASで新テーブルを作成する。
>
> 公式：[Introduction to clustered tables — Limitations](https://cloud.google.com/bigquery/docs/clustered-tables#limitations)

#### ④ Partition/Cluster Recommender を活用する

BigQueryが過去最大30日のワークロード実行データを分析し、クラスタリングによるコスト最適化の推奨を出してくれる。

> 公式：[Manage partition and cluster recommendations](https://cloud.google.com/bigquery/docs/manage-partition-cluster-recommendations)

確認場所：

- Google Cloud コンソール：**BigQuery > Recommendations 画面**
- `gcloud` コマンド
- Recommender API

> **補足**：推奨対象には閾値・条件がある。
>
> - **Cluster推奨**：テーブルが **10GB未満** だと表示されない
> - 既にクラスタ済みのテーブルは対象外
> - **過去30日間に読まれていない** テーブルは対象外
> - **推定節約効果が極小（1 slot hour未満）** の場合は表示されない
> - 同じテーブルを多数のサブクエリやself-joinで参照する複雑なクエリでは、Recommenderが節約効果を過大評価する場合がある
>
> 公式（閾値・self-joinの注意）：[Manage partition and cluster recommendations — Troubleshooting](https://cloud.google.com/bigquery/docs/manage-partition-cluster-recommendations#troubleshooting)
>
> また、Recommenderの推奨を適用するためにDDL/DMLやテーブルコピーを実行する場合は、通常の処理・ストレージ費用が発生し得る。

---

### アンチパターン

#### 先頭列をスキップしてクラスタリング効果を期待する

クラスタリングは先頭列から順に効果が出る。先頭列を使わずに2列目以降だけで絞っても効果が薄い。

> 公式：[Querying clustered tables — Filter clustered columns in sort order](https://cloud.google.com/bigquery/docs/querying-clustered-tables#filter_clustered_columns_in_sort_order)  
> （"To get the benefits of clustering, include one or more of the clustered columns in left-to-right sort order, starting with the first column."）

```sql
-- CLUSTER BY user_id, category の場合

-- ✅ 効く：先頭列から順に使っている
SELECT * FROM `テーブル`
WHERE created_at = '2026-01-01'
  AND user_id = 1001;

-- ✅ 効く：先頭列＋2列目も効果あり
SELECT * FROM `テーブル`
WHERE created_at = '2026-01-01'
  AND user_id = 1001
  AND category = 'electronics';

-- ⚠️ 効果が薄い：先頭列（user_id）をスキップ
SELECT * FROM `テーブル`
WHERE created_at = '2026-01-01'
  AND category = 'electronics';

-- ❌ 効かない：クラスタリング列を一切使っていない
SELECT * FROM `テーブル`
WHERE created_at = '2026-01-01'
  AND amount > 1000;
```

#### 動的フィルタ式でblock pruningを期待する

サブクエリ依存・動的な式は、BigQueryが実行前にどのブロックをスキャンすべきか特定できないためpruningされない。**定数式**で書くこと。

> 公式（パーティション側の同等記述）：[Querying partitioned tables — Use a constant expression in your filter](https://cloud.google.com/bigquery/docs/querying-partitioned-tables#use_a_constant_expression)

```sql
-- ❌ block pruningされない：サブクエリ依存の動的フィルタ
SELECT * FROM `テーブル` t
WHERE t.user_id = (SELECT MAX(user_id) FROM `別テーブル`);

-- ✅ 定数式で絞る
SELECT * FROM `テーブル`
WHERE user_id = 1001;
```

#### カーディナリティが極端に低い列を先頭にクラスタリングする

値の種類が少なすぎる列（`true/false` のみ、ステータスが2〜3種類など）はブロックの絞り込み効果が薄い。カーディナリティが高い列を先頭に配置する。

> 公式（高カーディナリティが望ましい）：[Introduction to clustered tables — When to use clustering](https://cloud.google.com/bigquery/docs/clustered-tables#when_to_use_clustering)  
> （"If your queries filter on columns that have many distinct values (high cardinality), clustering accelerates these queries..."）

```sql
-- ⚠️ 効果が薄い：is_active は true/false の2値しかない
CLUSTER BY is_active, user_id

-- ✅ より効果的：カーディナリティが高い列を先頭に
CLUSTER BY user_id, is_active
```

#### コスト見積もりをクエリ実行前に確認しようとする

クラスタリングはパーティショニングと異なり、**クエリ実行前のコスト見積もりにクラスタリングによる削減が反映されない**。実行前に表示される値はクラスタリングの削減を考慮しないものであり、実際のスキャン量は実行後に確定する。

> 公式：[Introduction to clustered tables](https://cloud.google.com/bigquery/docs/clustered-tables)  
> （"When you query a clustered table, you don't receive an accurate query cost estimate before query execution..."）

```
パーティション：実行前に「このクエリは XXX GB スキャンします」と確定表示
クラスタリング：実行前はクラスタリングによる削減が反映されていない値が表示。
               実際は実行後に確定
```

コスト予測にはパーティショニングと組み合わせて使うことを推奨。

#### STRING列が長すぎてクラスタリングが期待通りに効かない

BigQueryはSTRING列のクラスタリングに**先頭1,024文字のみ**を使用する。それ以降の文字は無視される。識別情報が末尾に集中しているような列（プレフィックスが全て同じURLなど）は効果が薄くなる。

> 公式：[Introduction to clustered tables — Limitations](https://cloud.google.com/bigquery/docs/clustered-tables#limitations)  
> （"When using STRING type columns for clustering, BigQuery uses only the first 1,024 characters to cluster the data."）

---

### クラスタリングしない方が良いケース

| ケース                     | 理由                              | 公式リンク |
| ----------------------- | ------------------------------- | --- |
| パーティションまたはテーブルのデータ量が小さい | 64MB未満では効果が小さいことが多い             | [Introduction to clustered tables — When to use clustering](https://cloud.google.com/bigquery/docs/clustered-tables#when_to_use_clustering)（"Unpartitioned tables larger than 64 MB are likely to benefit from clustering."） |
| 常に全件スキャンするクエリしかない       | ブロックをスキップできないので恩恵がない            | 同上 |
| クラスタリング列でほぼ絞らない         | WHERE・集計に使わない列をクラスタリングしても意味がない  | [Querying clustered tables — Best practices](https://cloud.google.com/bigquery/docs/querying-clustered-tables) |
| カーディナリティが極端に低い列しかない     | `true/false` など値の種類が少なすぎると効果が薄い | [Introduction to clustered tables — When to use clustering](https://cloud.google.com/bigquery/docs/clustered-tables#when_to_use_clustering) |

> **目安の使い分け**
>
> - **64MB未満**：クラスタリング自体の効果が出にくい基準（公式：[Introduction to clustered tables](https://cloud.google.com/bigquery/docs/clustered-tables#when_to_use_clustering)）
> - **10GB未満**：Recommenderの推奨が表示されない基準（クラスタリングが無意味というわけではない）（公式：[Manage partition and cluster recommendations — Troubleshooting](https://cloud.google.com/bigquery/docs/manage-partition-cluster-recommendations#troubleshooting)）

---

### DDL（作成方法）

> 公式：[Create clustered tables](https://cloud.google.com/bigquery/docs/creating-clustered-tables) / [DDL リファレンス — CREATE TABLE](https://cloud.google.com/bigquery/docs/reference/standard-sql/data-definition-language#create_table_statement)

#### パーティション＋クラスタリング（推奨の組み合わせ）

```sql
CREATE TABLE `プロジェクト.データセット.テーブル名`
(
  id         INT64,
  user_id    INT64,
  category   STRING,
  amount     NUMERIC,
  created_at DATE
)
PARTITION BY created_at
CLUSTER BY user_id, category
OPTIONS (
  require_partition_filter = true,
  partition_expiration_days = 365
);
```

#### クラスタリングのみ（パーティションなし）

```sql
CREATE TABLE `プロジェクト.データセット.テーブル名`
(
  id       INT64,
  user_id  INT64,
  category STRING,
  amount   NUMERIC
)
CLUSTER BY user_id, category;
```

#### 既存テーブルへの適用

> ✅ パーティショニングと異なり、**既存テーブルにもクラスタリング仕様の追加・変更はできる**。 ただし、既存データは自動的には新しいクラスタリング状態に再配置されない。
>
> 公式：[Manage clustered tables — Modify the clustering specification](https://cloud.google.com/bigquery/docs/manage-clustered-tables#modifying-cluster-spec)

```bash
# bq update でクラスタリング列を追加・変更
bq update --clustering_fields=user_id,category プロジェクト:データセット.テーブル名
```

既存データまで再クラスタリングしたい場合は、以下のいずれかが必要：

```sql
-- 方法①：UPDATE で全行を書き直す（処理コストが発生する）
UPDATE `プロジェクト.データセット.テーブル名`
SET user_id = user_id
WHERE true;

-- 方法②：CREATE TABLE AS SELECT で新テーブルを作成して差し替える
CREATE TABLE `プロジェクト.データセット.新テーブル名`
PARTITION BY created_at
CLUSTER BY user_id, category
AS
SELECT * FROM `プロジェクト.データセット.旧テーブル名`;
```

---

### クラスタリング設定の確認方法

#### コンソール

テーブルの「詳細」タブを開く。`クラスタリング` セクションにクラスタリング列が表示される。設定なしの場合はセクション自体が表示されないか「なし」と表示される。

> 公式：[Manage clustered tables — Get information about clustered tables](https://cloud.google.com/bigquery/docs/manage-clustered-tables#get-info)

#### INFORMATION_SCHEMA（SQL）

**クラスタリング列の確認**

> 公式：[COLUMNS view — clustering_ordinal_position](https://cloud.google.com/bigquery/docs/information-schema-columns)

```sql
SELECT
  table_name,
  column_name,
  clustering_ordinal_position
FROM `プロジェクト.データセット.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = '確認したいテーブル名'
  AND clustering_ordinal_position IS NOT NULL
ORDER BY clustering_ordinal_position;
```

**パーティション＋クラスタリングの両方を一括確認**

```sql
SELECT
  table_name,
  clustering_ordinal_position,
  column_name,
  is_partitioning_column
FROM `プロジェクト.データセット.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = '確認したいテーブル名'
  AND (is_partitioning_column = 'YES' OR clustering_ordinal_position IS NOT NULL)
ORDER BY is_partitioning_column DESC, clustering_ordinal_position;
```

#### bq コマンド

```bash
bq show プロジェクト:データセット.テーブル名
# Clustering Fields: user_id, category　← この行があれば設定済み
```

## クエリ最適化 ベストプラクティス（10原則）

### チェックリスト（クエリ作成時）

- `SELECT *` を使っていないか？ → 必要な列のみ指定
- パーティション列でフィルタしているか？ → `WHERE` に必ず含める
- `LIMIT` だけでコスト削減しようとしていないか？ → パーティション列フィルタで絞る
- JOINの順序は適切か？ → 大テーブル左・小テーブル右
- 同一CTEを複数回参照していないか？ → 再計算を避けるためテンポラリテーブルを検討
- 正確な値が不要な集計はないか？ → `APPROX_COUNT_DISTINCT` 等の近似関数を検討
- 繰り返し実行する重いクエリはないか？ → マテリアライズドビューを検討

### 10原則

#### 1. `SELECT *` を避け、必要な列のみを SELECT

BigQueryはカラムナフォーマット（Capacitor）でデータを格納しているため、不要な列を含めるとその分だけスキャン量とコストが増加する。

```sql
-- ❌ 全列スキャンされる
SELECT * FROM `テーブル`;

-- ✅ 必要な列だけ
SELECT id, user_id, amount FROM `テーブル`;
```

---

#### 2. `WHERE` 句でパーティションカラムを必ず指定

パーティション列に対するフィルタがないと、全パーティションがスキャンされる。`require_partition_filter = true` を設定しているテーブルではエラーになる。

```sql
-- ❌ 全パーティションスキャン
SELECT * FROM `パーティションテーブル`;

-- ✅ パーティション列でフィルタ
SELECT * FROM `パーティションテーブル`
WHERE created_at = '2026-01-01';
```

---

#### 3. `LIMIT` はスキャン量を削減しない点に注意

`LIMIT` は返す行数を制限するだけで、スキャン量はフルのまま。探索的分析でもパーティション列フィルタで絞ること。

```sql
-- ❌ フルスキャンされる（LIMITはスキャン後にフィルタ）
SELECT * FROM `テーブル` LIMIT 100;

-- ✅ パーティション列で絞ってからLIMIT
SELECT * FROM `テーブル`
WHERE created_at = '2026-01-01'
LIMIT 100;
```

---

#### 4. `JOIN` の順序：大テーブルを左、小テーブルを右

BigQueryはJOIN時に**右テーブルを全スロットにブロードキャスト（全量コピー）する**。右テーブルが大きいと全スロットへのコピーコストが膨れ上がるため、小テーブルを右に置くのが鉄則。

```
左テーブル（大）: 各スロットに分散して配置
右テーブル（小）: 全スロットに全量コピー（ブロードキャスト）
        ↓
各スロットが自分の担当分だけ独立してJOINを完結できる
```

```sql
-- ✅ 大テーブルを左、小テーブルを右
SELECT *
FROM `大きいテーブル` AS big
JOIN `小さいテーブル` AS small
ON big.id = small.id;

-- ❌ 右に大テーブルを置くと全スロットへのコピーコストが膨れ上がる
SELECT *
FROM `小さいテーブル` AS small
JOIN `大きいテーブル` AS big
ON small.id = big.id;
```

> **補足**：BigQueryのクエリオプティマイザが自動的にJOIN順序を最適化するケースも増えているが、複雑なクエリや多段JOINでは期待通りに最適化されないこともあるため、明示的に意識することが望ましい。

---

#### 5. CTE を使ってサブクエリのネストを最小化

`WITH` 句でクエリに名前をつけて整理できる。**可読性向上が主目的**で、複雑なネストを解消して保守しやすくなる。

```sql
-- ✅ CTEで整理
WITH 売上集計 AS (
  SELECT user_id, SUM(amount) AS total_amount
  FROM `sales`
  WHERE created_at >= '2026-01-01'
  GROUP BY user_id
)
SELECT *
FROM 売上集計
WHERE total_amount > 10000;
```

> ⚠️ **注意**：同一CTEを複数箇所で参照すると**毎回再計算される**。
> コストの高い処理を複数回参照する場合は、テンポラリテーブルまたはマテリアライズドビューに結果を保存してから使うこと。

```sql
-- ❌ 重い集計CTEを2回参照すると2回計算される
WITH 重い集計 AS (
  SELECT user_id, SUM(amount) AS total FROM `sales` GROUP BY user_id
)
SELECT * FROM 重い集計
JOIN 重い集計 AS s2 ON ...;  -- ← 同じ処理が再度走る

-- ✅ テンポラリテーブルに保存して再利用
CREATE TEMP TABLE 重い集計 AS (
  SELECT user_id, SUM(amount) AS total FROM `sales` GROUP BY user_id
);
SELECT * FROM 重い集計 JOIN 重い集計 AS s2 ON ...;
```

---

#### 6. 近似集計関数の活用（高速かつ低コスト）

厳密な正確性が不要な場合は近似集計関数を使うと、大幅にコストと処理時間を削減できる。

| 通常関数 | 近似関数 | 用途 |
|---|---|---|
| `COUNT(DISTINCT col)` | `APPROX_COUNT_DISTINCT(col)` | ユニーク数のカウント |
| `QUANTILES` | `APPROX_QUANTILES(col, n)` | 分位数の計算 |
| `TOP` | `APPROX_TOP_COUNT(col, n)` | 上位N件 |

```sql
-- ❌ 正確だが重い
SELECT COUNT(DISTINCT user_id) FROM `events`;

-- ✅ 約1%の誤差で高速・低コスト
SELECT APPROX_COUNT_DISTINCT(user_id) FROM `events`;
```

---

#### 7. マテリアライズドビューで繰り返し実行クエリを最適化

頻繁に実行される集計クエリはマテリアライズドビューとして定義することで、計算済み結果を再利用できる。ベーステーブルの変更に合わせて自動リフレッシュされる。

```sql
CREATE MATERIALIZED VIEW `プロジェクト.データセット.日次売上集計`
AS
SELECT
  DATE(created_at) AS date,
  SUM(amount)      AS total_amount,
  COUNT(*)         AS order_count
FROM `sales`
GROUP BY DATE(created_at);
```

> **向いているケース**：ダッシュボード用クエリ、毎日何百回も叩かれる集計クエリ。
> **向いていないケース**：たまにしか実行しないクエリ（リフレッシュコストが無駄になる）。

---

#### 8. BI Engine でインメモリキャッシュを活用

BI Engine はBigQueryのインメモリアクセラレータ。Looker StudioなどのBIツールからの繰り返しクエリをキャッシュして高速化できる。

- 容量単位（GB）で予約して使う
- 同じクエリを繰り返すダッシュボード用途に特に有効
- BigQueryのスロット課金とは別の料金体系

---

#### 9. INFORMATION_SCHEMA でクエリパフォーマンスを監視

過去のクエリ実行履歴をSQLで分析して、コストの高いクエリやスロット消費のボトルネックを特定できる。

```sql
-- 過去7日間でスキャン量が多いクエリTOP10
SELECT
  query,
  total_bytes_processed,
  total_slot_ms,
  creation_time
FROM `プロジェクト.region-asia-northeast1.INFORMATION_SCHEMA.JOBS`
WHERE creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
  AND job_type = 'QUERY'
ORDER BY total_bytes_processed DESC
LIMIT 10;
```

---

#### 10. Partition/Cluster Recommender でテーブル設計の改善提案を受ける

BigQueryが過去最大30日のワークロード実行データを分析し、パーティション・クラスタリングの設定改善を推奨してくれる。

確認場所：
- Google Cloud コンソール：**BigQuery > Recommendations 画面**
- `gcloud` コマンド
- Recommender API

> **補足**：推奨が表示される条件（閾値あり）。
> - Partition推奨：テーブルが100GB以上
> - Cluster推奨：テーブルが10GB以上
> - 過去30日間に読まれているテーブルが対象
