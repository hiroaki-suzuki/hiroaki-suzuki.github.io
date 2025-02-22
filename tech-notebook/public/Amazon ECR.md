---
title: Amazon ECR
created: 2025-02-21 10:33:30
updated: 2025-02-21 16:51:22
tags:
  - AWS
  - コンテナ
  - Docker
---
## メモ

### ECSでタスクがタイムアウトした場合の原因

- VPCエンドポイントが足りていない
	- ECRから取得する場合は以下が必要
		- com.amazonaws.{リージョン}.s3（ゲートウェイ）
		- com.amazonaws.{リージョン}.ecr.dkr
		- com.amazonaws.{リージョン}.ecr.api
		- com.amazonaws.{リージョン}.logs
- パブリックIPがない
	- パブリックなコンテナレジストリからイメージを取得する時は、assignPublicIpをtrueにする
	- パブリックサブネットであれば、　VPCエンドポイントはなくても良いが、assignPublicIpをtrueにする必要がある
- 認識していないVPCエンドポイントがある
	- VPCエンドポイントを利用しないパブリックやNATなどの場合に、VPCエンドポイントがあると、そちらを見に行ってしまうようで、セキュリティグループなどで、VPCエンドポイントへのルートがないと失敗する
	- S3のゲートウェイは関係ないっぽいが、残りの３つは上記の対象になるようだ
