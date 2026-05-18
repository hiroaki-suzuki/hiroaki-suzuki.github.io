---
title: Big Query - Google Cloud
permalink: big-query-google-cloud/
created: 2026-05-18 22:00:00
updated: 2026-05-18 22:00:00
tags:
  - Google_Cloud
  - BigQuery
---
## パーティショニング

### パーティショニングとは

テーブルを特定のカラムの値で**物理的に分割して保存**する仕組み。
パーティションフィルタを使うことで、必要な分割部分だけをスキャンしてコストを大幅削減できる。

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

**時間粒度の補足**
- DATE：日・月・年
- TIMESTAMP / DATETIME：時・日・月・年の粒度を使える

> ⚠️ **パーティション境界はUTC基準**：JSTの「日次データ」を `TIMESTAMP` でパーティションすると、JSTの1日とUTCの1日が9時間ずれる。JST日付でフィルタしても2パーティション読まれるなど、プルーニングが期待通り効かないことがある。対策は以下のいずれか：
> - UTC基準で運用する（業務要件次第）
> - JST日付の `DATE` 列を別途持ち、それでパーティション
> - `DATETIME` を使う（タイムゾーン情報なしで自由解釈）

### 設計チェックリスト

- [ ] DATE / TIMESTAMP / DATETIME列はあるか？ → パーティション列の候補
- [ ] 特定期間だけ絞るクエリが多いか？ → パーティションの効果が高い
- [ ] パーティションごとのデータ量は十分か？ → 約10GB未満の小さいパーティションが大量にできる設計は避ける
- [ ] **UTC境界の影響を考慮しているか？** → JST運用なら DATE列追加 or DATETIME を検討
- [ ] RLSを適用するテーブルか？ → RLSポリシーだけではプルーニングされないため、利用クエリ側にパーティション列フィルタが入る設計にする
- [ ] パーティション数が10,000を超えないか？ → 粒度を確認
- [ ] `require_partition_filter` を設定したか？ → 誤フルスキャン防止
- [ ] `partition_expiration_days` を設定したか？ → ストレージコスト削減（INTEGER範囲パーティションは非対応）
- [ ] **DDL：** TIMESTAMP / DATETIME型で日粒度以外を使う場合、`TIMESTAMP_TRUNC` / `DATETIME_TRUNC` で粒度を明示しているか？（日粒度なら `DATE(ts)` でも可）
- [ ] **クエリ：** パーティション列を素直な範囲条件で絞っているか？（関数で包む `WHERE DATE(ts) = ...` はプルーニングが効きにくい）

### ベストプラクティス
#### ① require_partition_filter を設定する

パーティションフィルタなしのクエリをエラーにして、誤ったフルスキャンを防止する。

```sql
ALTER TABLE `プロジェクト.データセット.テーブル名`
SET OPTIONS (require_partition_filter = true);
```

> **注意**：パーティション列への述語が少なくとも1つ必要。
> `WHERE partition_col = '2026-01-01'` はOKだが、
> `WHERE (partition_col = '2026-01-01' OR other_col = 'x')` は要件を満たさない。

#### ② partition_expiration_days で古いデータを自動削除

ストレージコスト削減に有効。ログ系テーブルに特に効果的。

```sql
ALTER TABLE `プロジェクト.データセット.テーブル名`
SET OPTIONS (partition_expiration_days = 365);
```

> **注意**：`partition_expiration_days` は時間単位カラムパーティション / 取り込み時間パーティション向け。**INTEGER範囲パーティションではサポートされない。**

#### ③ Partition/Cluster Recommender を活用する

BigQueryが過去最大30日のワークロード実行データを分析し、パーティション・クラスタリングによるコスト最適化の推奨を出してくれる。

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

### アンチパターン

#### LIMIT句でスキャン削減できると思ってる

LIMIT はあくまで**結果の行数を制限するだけ**。スキャン量は変わらない。

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

```sql
-- ⚠️ 2パーティション読まれる
SELECT * FROM `テーブル`
WHERE created_at >= TIMESTAMP('2026-01-01 00:00:00', 'Asia/Tokyo')
  AND created_at <  TIMESTAMP('2026-01-02 00:00:00', 'Asia/Tokyo');
-- UTCでは 2025-12-31 15:00 〜 2026-01-01 15:00 に相当
```

これを許容するか、JST DATE列を持って単一パーティションで絞るかは設計判断。

### パーティションしない方が良いケース

| ケース                       | 理由                                                          |
| ------------------------- | ----------------------------------------------------------- |
| パーティションごとのデータ量が小さすぎる      | 公式目安では約10GB未満の小さいパーティションが大量にできる場合、メタデータ増加により逆効果になり得る        |
| 常に全件スキャンするクエリしかない         | 分割してもプルーニングの恩恵がない                                           |
| クエリの絞り込み条件とパーティションキーが合わない | 取り込み時間パーティションなどを無理に使っても、実クエリで絞れなければ効果が薄い                    |
| RLSの条件だけで絞れると思っている        | RLSポリシー自体はパーティションプルーニングに参加しない。クエリ側でパーティション列フィルタを明示的に書く必要がある |
| パーティション数が10,000を超えそう      | BigQueryの上限に達するため、粒度を粗くするかクラスタリングを検討する                      |

### DDL（作成方法）

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

##### INFORMATION_SCHEMA（SQL）

**テーブルオプション（require_partition_filter / partition_expiration_days）の確認**

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

### 設計チェックリスト

- [ ] WHERE・集計・頻出フィルタ条件に使われる列はあるか？ → クラスタリング列の候補
- [ ] カーディナリティは適切か？ → distinct値が多い列ほどブロックpruningの効果が高い（`true/false` のみなど極端に少ない列は効果薄）
- [ ] 列の順序は正しいか？ → 最も絞り込みに使う列を先頭に配置する
- [ ] パーティション＋クラスタリングの組み合わせを検討したか？ → 大規模テーブルで特に有効（ただし細かすぎるパーティションとの組み合わせは逆効果に注意）
- [ ] クエリ側がクラスタリング列を先頭から順に使っているか？ → 先頭列をスキップすると効果が薄い
- [ ] クラスタリング列のフィルタが定数式になっているか？ → サブクエリ依存の動的フィルタはblock pruningされない
- [ ] STRING列を使う場合、先頭1,024文字以内に識別情報が収まっているか？ → BigQueryはSTRING列の先頭1,024文字のみをクラスタリングに使用する
- [ ] コスト見積もりはクエリ実行後に確認する認識があるか？ → 実行前はクラスタリングによる削減が反映されていない値が表示される
- [ ] 既存テーブルに後からクラスタリングを追加した場合、既存データは自動再配置されないことを把握しているか？ → 既存データまで反映したい場合はUPDATEまたはCTASが必要

---

### ベストプラクティス

#### ① 最大4カラム・選択性の高い列を先頭に

```sql
CLUSTER BY 最も絞り込みに使う列, 次に使う列, ...
```

先頭の列から順にスキャン削減効果が出る。クエリのWHEREや集計に登場しない列や、絞り込み効果が薄い列を先頭に置いても意味がない。

#### ② パーティション＋クラスタリングの組み合わせ

パーティションで日付を絞り、さらにクラスタリングで対象ユーザーや種別を絞る二段階のスキャン削減が実現できる。大規模テーブルで特に有効。

```sql
PARTITION BY DATE(created_at)
CLUSTER BY user_id, category
```

> **注意**：細かすぎるパーティションを大量に作るとメタデータ増加で逆効果になり得る。平均パーティションサイズが十分大きいか（目安：10GB以上）確認する。

#### ③ 自動再クラスタリングに任せる

BigQueryはデータが追加・更新されるとバックグラウンドで自動的に再クラスタリングする。自動再クラスタリングは**無料操作**として分類されており、追加課金は発生しない。

> **注意**：既存テーブルに後からクラスタリング仕様を追加・変更した場合、**既存データは自動的には新しいクラスタリング状態に再配置されない**。新規データのみが自動再クラスタリングの対象になる。既存データまで反映したい場合は、UPDATEで全行を書き直すか、CTASで新テーブルを作成する。

#### ④ Partition/Cluster Recommender を活用する

BigQueryが過去最大30日のワークロード実行データを分析し、クラスタリングによるコスト最適化の推奨を出してくれる。

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
> また、Recommenderの推奨を適用するためにDDL/DMLやテーブルコピーを実行する場合は、通常の処理・ストレージ費用が発生し得る。

---

### アンチパターン

#### 先頭列をスキップしてクラスタリング効果を期待する

クラスタリングは先頭列から順に効果が出る。先頭列を使わずに2列目以降だけで絞っても効果が薄い。

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

```sql
-- ⚠️ 効果が薄い：is_active は true/false の2値しかない
CLUSTER BY is_active, user_id

-- ✅ より効果的：カーディナリティが高い列を先頭に
CLUSTER BY user_id, is_active
```

#### コスト見積もりをクエリ実行前に確認しようとする

クラスタリングはパーティショニングと異なり、**クエリ実行前のコスト見積もりにクラスタリングによる削減が反映されない**。実行前に表示される値はクラスタリングの削減を考慮しないものであり、実際のスキャン量は実行後に確定する。

```
パーティション：実行前に「このクエリは XXX GB スキャンします」と確定表示
クラスタリング：実行前はクラスタリングによる削減が反映されていない値が表示。
               実際は実行後に確定
```

コスト予測にはパーティショニングと組み合わせて使うことを推奨。

#### STRING列が長すぎてクラスタリングが期待通りに効かない

BigQueryはSTRING列のクラスタリングに**先頭1,024文字のみ**を使用する。それ以降の文字は無視される。識別情報が末尾に集中しているような列（プレフィックスが全て同じURLなど）は効果が薄くなる。

---

### クラスタリングしない方が良いケース

| ケース                     | 理由                              |
| ----------------------- | ------------------------------- |
| パーティションまたはテーブルのデータ量が小さい | 64MB未満では効果が小さいことが多い             |
| 常に全件スキャンするクエリしかない       | ブロックをスキップできないので恩恵がない            |
| クラスタリング列でほぼ絞らない         | WHERE・集計に使わない列をクラスタリングしても意味がない  |
| カーディナリティが極端に低い列しかない     | `true/false` など値の種類が少なすぎると効果が薄い |

> **目安の使い分け**
> 
> - **64MB未満**：クラスタリング自体の効果が出にくい基準
> - **10GB未満**：Recommenderの推奨が表示されない基準（クラスタリングが無意味というわけではない）

---

### DDL（作成方法）

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

#### INFORMATION_SCHEMA（SQL）

**クラスタリング列の確認**

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