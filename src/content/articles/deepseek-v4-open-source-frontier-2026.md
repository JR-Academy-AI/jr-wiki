---
title: "一年之后，DeepSeek V4 证明了封锁失效"
description: "2026年4月24日，DeepSeek发布V4 Pro（1.6万亿参数、100万token上下文）和V4 Flash（2840亿参数），MMLU得分88.4%，距离封顶前沿仅剩3至6个月差距。出口管制的真实成效，数字已经说话。"
publishDate: 2026-04-27
tags:
  - ai-news
  - ai-analysis
  - deepseek
  - open-source-ai
author: "JR Academy AI 编辑部"
keywords: "DeepSeek V4, 开源AI, 大模型竞争, AI基准测试, 出口管制, 人工智能产业"
---

## 钩子

2026年4月24日，DeepSeek更新了API文档，加了两行。没有发布会，没有CEO站在台上举着手机。两个模型静悄悄上线：V4 Pro，1.6万亿参数，100万token上下文；V4 Flash，2840亿参数，主打速度和成本。

距离上一次这家公司让英伟达单日蒸发近6000亿美元，整整一年。

## 背景

2025年1月20日，DeepSeek R1上线。技术报告里的那个数字——训练成本约560万美元——在硅谷引爆了一种奇特的情绪，不完全是恐慌，更多是羞耻。

因为同一级别的性能，OpenAI在GPT-4上花了大约1亿美元。

英伟达那天的反应是市值蒸发约17%，单日跌幅创下美股单只股票市值损失的历史纪录之一。Marc Andreessen在社交媒体上写了两个字："Sputnik"。这个词在美国没有任何中性含义——它是1957年苏联卫星发射之后，美国朝野集体产生的那种被超越的恐惧。

美国政府的回应是出口管制。H100封，A100封，迫使DeepSeek只能使用降规版的H800。这相当于在比赛前没收了对方的跑鞋，让他换上沙滩拖鞋，然后开跑，等成绩出来再说谁赢。

一年后，V4出来了。

## 数字说什么

DeepSeek V4 Pro在MMLU上得了88.4%，在新设立的Humanities-X推理基准上得了92.1%。DeepSeek的技术报告说，这与OpenAI GPT-5和Anthropic Claude 4 Opus的成绩"持平或微超"。

比基准分更有意义的，是那个被埋在角落里的描述：第三方分析指出，DeepSeek V4的发展轨迹"落后顶尖前沿模型约3至6个月"。

停下来读两遍。

3至6个月，在AI行业，曾经是代际差距的单位。2023年GPT-4发布时，最强的开源模型和它之间的差距，保守估计两年起。到了2026年4月，差距压缩到一个季度。出口管制的真实效果，就是这个数字。

100万token的上下文窗口，翻译成人话：你可以把整个《哈利·波特》系列七本书（英文原版约100万词）一次性扔进去，模型会读完每一页，然后回答你任何问题。这不是工程噱头。法律文书批量审查、百万行代码库全局重构、企业合同跨文档对比分析——这是一种新的工作基础设施，而不是一个更好用的搜索引擎。

## 开源才是真正的武器

闭源赛道：OpenAI、Anthropic、Google三极在互相内卷，GPT-5.5刚在4月23日上线，Gemini 3.1 Pro和Claude 4 Opus都是当下的顶级选手。这个赛道的逻辑是性能领先加API收费，护城河是模型本身。

开源赛道：DeepSeek目前几乎没有实质对手。Meta的Llama系列最强版本参数量约700亿，DeepSeek V4 Pro直接上到1.6万亿——参数规模超出约22倍。两者不在同一竞争层级。

我的判断是：DeepSeek不是在和GPT-5正面打，而是在悄悄接管GPT-5的下游用户。

具体指的是：一家金融公司可以下载V4，部署在自己的服务器上，不需要把数据送上OpenAI的云端，不受API限速管控，不用担心合规问题，不按token付费。成本结构和决策逻辑完全不同。国内、东南亚、欧洲大量数据不能出境的企业，天然是DeepSeek开源模型的目标用户，不是因为DeepSeek更好，而是因为它能部署在自己家里。

这叫结构性优势，不是功能性优势。结构性优势更难被竞争掉。

## 这件事的代价

好故事有代价，这件事也不例外。

1.6万亿参数的模型，全精度推理需要数百张高端GPU。绝大多数企业实际部署的是量化版（INT4或INT8），而量化有可衡量的性能折损——尤其在复杂推理和长文档理解上。V4 Pro的基准分，和大多数企业实际能跑出来的性能，不是同一个数字。

还有一个更根本的问题没人说清楚：在H800芯片限制下，DeepSeek是怎么训练出1.6万亿参数模型的？技术报告提到混合专家架构（Mixture of Experts，MoE）——这个设计的意思是：模型每次只激活一部分参数，类似一个大公司有1万名员工，但每个项目只抽调其中200人上阵，总编制大但单次运行成本可控。

但激活参数量和总参数量的具体关系，DeepSeek没有完整披露。1.6万亿这个数字的含金量，外界还无法独立核实。

数字可以被测量，测量工具本身却有立场。

## 封锁、效率、以及一个讽刺性的对称

一年前，DeepSeek用560万美元的训练成本告诉世界：算力竞赛可以被效率竞赛部分替代。这个故事的道德是"用更少做更多"。

一年后，DeepSeek自己用1.6万亿参数上线了。

这是个讽刺性的对称。当初让硅谷恐慌的是"更低成本做到同等性能"，现在DeepSeek也加入了"更大模型俱乐部"。效率到了边界，还是要堆规模——这个规律对DeepSeek同样适用，没有豁免权。

真正重要的不是这两个模型的基准分，而是它们把开源前沿的能力边界又向前推了一个身位。当开源模型的性能到达"够用"阈值，闭源API的溢价开始难以辩护。这个拐点正在靠近，没有人能精确标注它在哪里，但3至6个月的差距告诉你，它不再是一个遥远的地平线。

出口管制、地缘政治、芯片封锁——这些力量的存在，没有阻止DeepSeek V4在2026年4月24日上线。

开源，从来不只是技术选择，是定价权的重新分配。

## 数据来源

- DeepSeek V4 发布概览及规格: [LLM Stats AI News — April 2026](https://llm-stats.com/ai-news)
- DeepSeek V4 基准测试分析: [Analytics India Magazine — DeepSeek V4 Pro Challenging OpenAI Anthropic](https://analyticsindiamag.com/ai-news/deepseek-releases-v4-pro-challenging-openai-anthropic-on-key-benchmarks)
- Bloomberg 报道: [DeepSeek Unveils Newest Flagship AI Model a Year after Upending Silicon Valley](https://www.bloomberg.com/news/articles/2026-04-24/deepseek-unveils-newest-flagship-a-year-after-ai-breakthrough)
- Al Jazeera 报道: [China's DeepSeek unveils latest model, a year after upending global tech](https://www.aljazeera.com/economy/2026/4/24/chinas-deepseek-unveils-latest-model-a-year-after-upending-global-tech)
- CNN 报道: [China's AI upstart DeepSeek drops new model](https://www.cnn.com/2026/04/24/tech/chinas-ai-deepseek-v4-intl-hnk)
- AI 模型发展轨迹及前沿对比: [Startup Fortune — DeepSeek V4 benchmark scores](https://startupfortune.com/deepseek-v4-arrives-with-benchmark-scores-that-put-american-ai-labs-on-notice/)
- 开源/开放权重模型竞争格局: [Geeky Gadgets — DeepSeek V4 analysis](https://www.geeky-gadgets.com/open-source-deepseek-v4-limitations/)
