---
title: AIアライメント
permalink: ai-alignment/
created: 2025-06-25T09:27:00
updated: 2025-06-25T09:27:00
tags:
  - AI
---
## メモ
- AIの行動や目標が人間の意図や価値観と一致するように設計・制御すること
- BingでのAIによる謝罪要求など、そういったことを防ぎたい
	- SFのような、ロボットが人を攻撃するなどが実際に怒るかもしれない

### アライメント問題の種類
- 目的の指定の難しさ（Specification problem）  
	- 人間が「正しい目的」をAIに与えるのはとても難しい
- 報酬ハッキング（Reward hacking）  
	- AIが、与えられた報酬を「うまく」最大化しようとして不正な手段に出る
- 外挿の問題（Out-of-distribution generalization）  
	- 学習データと異なる環境でAIがどのように行動するか予測が難しい。
- 価値の学習（Value learning）  
	- 人間の価値観をAIがどうやって学ぶか。間違って学習すると有害

### 主なアプローチ
- インタープリタビリティ（可視化・解釈可能性）  
	- AIがなぜその判断をしたのか説明できるようにする。
- 逆強化学習（Inverse Reinforcement Learning）  
	- 人間の行動から「人間が望む目的」を学ばせる。
- 人間とのフィードバックループ  
	- AIが人間からの評価をもとに学習する（例：ChatGPTのRLHF = Reinforcement Learning from Human Feedback）
- 安全な探索（Safe exploration）  
	- 環境を破壊しないように慎重に行動する学習方式。