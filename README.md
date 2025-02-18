# hiroaki-suzuki.github.io

## 概要

Hiroaki Suzukiの個人サイトです。主に技術系のメモを置いています。  
やってますよ感を出すため、GitHub Pagesを使って公開しています。  
あくまでメモなのでとりあえず書くという精神で書いています。間違っている点は適宜修正していきます。

## 仕組み

mainブランチにプッシュされたらGitHub Actionsのデプロイ用のワークフローが走り、  
tech-notebook/publicディレクトリのマークダウンファイルをHTMLに変換、 CSSの作成などを行い  
最終的にGitHubページとして公開されるようになっています。

### 構成図

![構成図](tech-notebook/public//images//my-memo-page-architecture.svg)


### tech-notebookディレクトリについて

tech-notebookディレクトリは、Obsidianで管理しているvaultです。  
このtech-notebookのvaultは、ObsidianのRemotely Saveプラグインを使って、  
S3に保存してPCとスマホで同期をとり、どちらでも編集ができるようにしています。

例えば、スマホで編集した内容はS3に同期され、PCでObsidianを開いたときに、  
その変更が反映されるようになっています。

この動きにより、このリポジトリをPCで開くと、Gitとしては編集が入った状態になっているので、  
それをそのままmainにコミットしてプッシュすれば、GitHub Actionsが走り、  
GitHubページとして公開されるような流れです。

補足ですが、vault内には公開したくないマークダウンファイルなどもあるので、  
GitHubページで公開するものだけをpublicのフォルダに配置しています。  
Git管理にならないように、.gitignoreにはpublicディレクトリだけが対象になるように設定しています。

記事を書きました。

[技術メモをCosenseからObsidianとGitHubページに移行した話](https://note.com/hirozki/n/n4785e30ab375)