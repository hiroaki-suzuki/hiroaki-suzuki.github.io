---
title: AWSからのCloudWatchAlarmからのSlack通知方法
permalink: slack-notifications-in-aws/
created: 2025-03-31T17:46:00
updated: 2025-03-31T17:47:00
tags:
  - AWS
  - Slack
---
## CloudWatchAlarm > SNS > AWS Chatbot
- AWS ChatbotとSlackのOAuthが必要
- 流れ
	- SNS作る
	- Chatbot作る
	- CloudWatchAlarmを作成して、SNSを指定する
- メリット
	- コードを書く必要がない
- デメリット
	- メッセージを変更するなどのカスタマイズができない？

## CloudWatchAlarm > Lambda
- Incomming Webhookを利用する
- 流れ
	- Lambdaを作成する
	- CloudWatchAlarmを作成して、Lambdaを指定する
- メリット
	- メッセージを変更するなどのカスタマイズができる
- デメリット
	- コードを書く必要がある