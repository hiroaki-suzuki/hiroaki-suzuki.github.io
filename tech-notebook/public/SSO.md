---
title: SSO
permalink: sso/
created: 2025-02-09 17:31:20
updated: 2025-03-20T13:22
tags:
  - 認証認可
  - SSO
  - SAML
  - OIDC
---
## 種類
- フェデレーション方式
- エージェント方式
- リバースプロキシ方式
- 代理認証方式

## フェデレーション方式
- 認証情報を連携する方式
	- トークンやアサーションと呼ばれる情報で連携する
- 一番よく使われる方式
- 運用ポリシーが異なる場合やドメインの異なる場合でも認証を行う事ができる
- 関連技術
	- [[SAML]]
	- [[OIDC]]

## エージェント方式
- サービス側にエージェントをインストールする
- クライアントとアプリサーバーなどの間にエージェントが入る形（インターセプト）
- エージェントはクライアントが認証済みかを確認して、そうでなければSSOサーバにリダイレクトして、認証を行ってもらう
- SSOのサーバから認証情報を含むCookieを受け取り、それを利用して認証を行う
- Cookieでの管理のためドメインの制約を受ける

## リバースプロキシ方式
- クライアントとアプリサーバの間にリバースプロキシをおいて、そのリバプロにエージェントを入れて認証を行う
- リバプロが単一障害点になる可能性あり

## 代理認証方式
- 利用者の端末にエージェントを入れる
- エージェントが代理でID、PWの入力や送信を行う