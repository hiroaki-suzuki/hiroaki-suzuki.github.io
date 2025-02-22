---
tags:
  - 認証認可
  - SAML
  - SSO
title: SAML
created: 2025-02-10 22:56:44
updated: 2025-02-18 16:12:58
---
## リンク
- [https://wiki.oasis-open.org/security/FrontPage](https://wiki.oasis-open.org/security/FrontPage)
- [http://docs.oasis-open.org/security/saml/v2.0/sstc-saml-approved-errata-2.0.html](http://docs.oasis-open.org/security/saml/v2.0/sstc-saml-approved-errata-2.0.html)
- [http://docs.oasis-open.org/security/saml/v2.0/saml-bindings-2.0-os.pdf](http://docs.oasis-open.org/security/saml/v2.0/saml-bindings-2.0-os.pdf)

## 概要
- Security Assertion Markup Language
	- SAML
	- 読み
		- サムル
		- サムエル
- 標準化団体のOasisが作成
- Webアプリケーション間で認証情報や認可情報などを、交換するためのフレームワーク
	- SSOを実現するためによく使われている
	- **属性情報も含められる**
- 企業のシステムで使われる事が多い
- SAMLにはいくつかの仕様や方式があるため、IdPやSPとしてどれに対応しているのか？どれに対応するのか？は理解しておかなければならない
	- よく利用される仕様や方式がイコールSAMLだと思っている事がよくある

## バージョン
- SAML 1.0
	- 2002年11月
- SAML 1.1
	- 2003年9月
- SAML 2.0
	- 2005年3月

## 構成要素
- IdP
	- Identity provider
- SP
	- Service probider
- ユーザーエージェント
	- クライアント

## フォーマット
- XML

## メリット
- パスワードをSPで管理しないため、セキュリティのリスクを下げられる
	- IdPで管理されているため、そこでしっかりと管理をするという考え方になる
	- パスワードは大体同じパスワードを使いがちなので、どこかで漏洩すると他の関係のないサービスにも影響が出てしまう
	- 管理するパスワードが1つであれば、強固なパスワードを採用してもらえる可能性も高まる。
	- これは[[OIDC]]のメリットと同じ、[[SSO]]自体のメリット

## デメリット
- セキュリティを強化する事がメリットとなっているが、IdPが脆弱な場合、誤った使い方をしてしまうとIdP自体が攻撃を受けてパスワードが漏洩してしまう可能性もある
	- MFAなどの多要素認証も取り入れてより強固にするのが良い
	- ただし一般的にはIdPの方がSPよりもパスワードなどの管理は強固なはずなので、この点はあまり気にしないでも良さそう
- 単一障害点になってしまう
	- IdPに障害が発生した場合、SP自体が使えなくなってしまう
	- IdPの可用性は要調査
- 全てのSPがSAMLに対応しているわけではないので、その場合は別で対応が必要になる
- SAMLを理解して利用する必要があるので学習コストは発生する

## プロファイル
- 特定のユースケースを実現するための仕様をプロファイルと呼んでいる
- その中の1つで[[SSO]]がある
	- Web Browser SSO Profile
	- 単純にSAMLといった場合は、この仕様のことを言っている
	- これはよく使われる仕様で、それが一般的に受け入れられているからと思われる
	- 厳密にはその他のユースケース用のプロファイルも提供されている
- ECP(Enhanced Client or Proxy)
	- プロキシを介す事でWebブラウザ以外のクライアントアプリケーションでもSSOを実現するためのプロファイル
- SLO(Single Logout)
	- 一度のログアウトでIdPと複数のSPからログアウトを実現するためのプロファイル
## SAMLアサーション
- IdPでの認証後にIdPにより発行されるもので、SPから見た場合は、認証が成功したことの証となる。
- 以下の情報が含まれている
	- 認証情報
		- 認証したサーバーの情報
		- 認証した時間など
	- 属性情報
		- 名前や性別など、認証したユーザーの属性情報
		- IdP側で追加する事が可能
	- 認可情報
		- ユーザがどの情報にアクセスできるかなどの認可に関する情報

## バインディング仕様
- SAMLアサーションの交換方式のこと
- いくつかの方式があり、認証リクエスト/レスポンスで利用されるのは以下の3つ
	- HTTP Redirect Binding
		- 一番使われている方式
	- HTTP POST Binding
	- HTTP Artifact Binding

## 認証フロー
- SP Initiated SSO
	- 認証の起点がSPになる
	- HTTP Redirect Binding
		- クライアントはSPにアクセスする
		- SPがIdPにリダイレクトさせる
		- クライアントでID、PWを入力して送信
		- IdPが認証を行いオッケーならSAMLアサーションをクライアントに送信
		- クライアントはSPにSAMLアサーションを送信
		- SAMLアサーションがオッケーなら認証完了
	- メリット
		- ユーザーが理解しやすい
- IdP Initiated SSO
	- 認証の起点がIdPになる
	- HTTP Redirect Binding
		- クライアントはIdPにアクセスして、IdPでログインを行う
		- IdPの画面でSP選択画面を表示し、SAMLアサーションをクライアントに送信する
		- クライアントは利用するSPを選択して、SPへSAMLアサーションを送信する
	