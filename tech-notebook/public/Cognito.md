---
title: Cognito
permalink: cognito/
created: 2025-12-19 14:23
updated: 2025-12-19 14:23
tags:
  - AWS
  - Cognito
  - 認証認可
---
## メールのメッセージの変更
- ユーザープールのメッセージテンプレートの編集で出来る
- [メッセージテンプレート](https://docs.aws.amazon.com/ja_jp/cognito/latest/developerguide/cognito-user-pool-settings-message-customizations.html#cognito-user-pool-settings-message-templates)

## MFAのメール送信
- CognitoのデフォルトかSESで送信出来る
- 制限事項
	- MFAをメール送信にした場合には、パスワードリセットについてはSMSを利用する必要がある
	- [ユーザープールの MFA について知っておくべきこと](https://docs.aws.amazon.com/ja_jp/cognito/latest/developerguide/user-pool-settings-mfa.html#user-pool-settings-mfa-prerequisites)
	  > ユーザーが希望する MFA の方法は、パスワードの復旧に使用できる方法に影響します。希望する MFA を E メールメッセージにしたユーザーは、パスワードリセットコードを E メールで受信できません。
## MFAのコードの有効期限
- MFA コードは、アプリケーションクライアントで設定した**認証フローセッションの持続期間**の間有効
- デフォルトは３分で、3分〜15分の間で設定が可能
	- 分で設定
- [SMS メッセージ MFA と E メールメッセージ MFA に関する考慮事項](https://docs.aws.amazon.com/ja_jp/cognito/latest/developerguide/user-pool-settings-mfa-sms-email-message.html#user-pool-settings-mfa-sms-email-message-considerations)

