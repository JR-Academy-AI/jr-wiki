---
title: "NotebookLM 核心功能详解：从引用聊天到 AI 播客"
wiki: "notebooklm-guide"
order: 3
description: "深入掌握 NotebookLM 五大核心功能：引用式聊天、Audio/Video Overview、Studio 工具、Deep Research 和思维导图"
---

NotebookLM 不只是个"能聊天的 PDF 阅读器"。搞懂这些核心功能，你会发现它是一个很完整的 AI 研究工作台。

![NotebookLM Studio tools](https://img.youtube.com/vi/o6muCNTI3qA/maxresdefault.jpg)

## 引用式聊天：每句话都有出处

NotebookLM 的聊天跟 ChatGPT 最大的区别就一个字：**引用**。

每个回答旁边都有数字标注（[1] [2] [3]），点击跳回原文的具体段落。这意味着：
- 你能立刻验证 AI 说的对不对
- 引用来自你自己上传的资料，不是互联网上的随机信息
- 做学术研究或写报告时，引用链可以直接拿来用

```
高效提问的模式：

# 跨文档对比（最能体现 NotebookLM 价值的用法）
"Source 1 和 Source 3 在定价策略上有什么不同？"

# 结构化输出
"把所有来源中提到的 API 限制整理成一张表格"

# 深度追问
"你刚才提到的 token 机制 [2]，能展开讲讲具体怎么计算的吗？"

# 特定来源
"只基于那篇 Google Cloud 文档回答：免费版支持多少个来源？"
```

## Audio Overview：AI 播客生成

这是让 NotebookLM 出圈的功能。两个 AI 主播基于你的资料展开对话，风格像真人播客：有互动、有玩笑、有通俗类比。

### 基本参数

| 设置 | 选项 |
|------|------|
| **时长** | Short（~5 分钟）/ Default（~10 分钟）/ Long（~20 分钟） |
| **语言** | 80+ 种，中文、英文、日文等都支持 |
| **风格** | Deep Dive（深度讨论）/ Brief（简报）/ Critique（批判性分析）/ Debate（辩论） |
| **自定义** | 写 prompt 指定重点、难度、受众 |

### Interactive 模式

2026 年新加的功能：播客播放时点 **Join** 按钮，用麦克风直接加入 AI 主播的对话。比如听到某个概念没懂，直接打断问"等一下，这个能再解释一下吗？"——AI 主播会停下来给你补充解释，然后继续原来的话题。

目前 Interactive 模式只支持英文。

## Video Overview：AI 视频播客

2026 年 3 月上线的新功能，把 Audio Overview 升级成了视频版：AI 在讲解的同时自动生成配套的画面、图表和动画。

目前 Video Overview 限制较多：只支持英文、仅 Ultra 版用户可用（$249.99/月），但效果确实惊艳——相当于自动帮你做了一个 TED Talk 级别的知识讲解视频。

## Deep Research：联网深度研究

NotebookLM 默认只看你上传的资料。但打开 **Deep Research** 功能后，它会联网搜索补充信息，最终输出一份完整的研究报告，带参考文献和引用链接。

适用场景：
- 你上传了几篇行业报告，想知道"行业里还有哪些类似的趋势？"
- 你上传了一篇论文，想查"其他研究者怎么评价这个方法？"
- 你在做竞品调研，想补充最新的市场数据

```
Deep Research prompt 示例：

"基于这些 API 文档，帮我调研一下市面上类似的竞品 API，
对比它们的定价、速率限制和功能差异，输出一份对比报告"

"基于这篇机器学习论文，搜索最近 6 个月的相关研究进展，
重点关注在工业界的落地案例"
```

免费版每月 10 次 Deep Research，Plus 版更多。

## Studio 工具箱

Studio 面板集成了一系列一键生成工具：

| 工具 | 功能 | 输出格式 |
|------|------|---------|
| **Mind Map** | 交互式思维导图 | 可点击展开的节点 |
| **Slide Deck** | 演示文稿 | 可编辑，支持导出 PPTX |
| **Infographics** | 信息图 | 10 种模板可选 |
| **Data Tables** | 从资料中提取结构化数据 | 表格，可导出 Google Sheets |
| **Flashcards** | 记忆卡片 | 正反面，支持间隔复习 |
| **Quizzes** | 自动出题 | 选择题/判断题/简答题 |

我用得最多的是 **Mind Map** 和 **Data Tables**。Mind Map 适合快速抓住一堆文档的整体脉络；Data Tables 适合从多篇资料里提取关键数据做对比——比如从 5 篇 AI 工具评测里提取"产品名、定价、核心功能"做成一张对比表。

## Saved Chat 和 Notes

2025 年 10 月起，NotebookLM 开始保存你的聊天历史。以前关掉页面对话就没了，现在每次回到笔记本都能继续之前的对话。

你也可以手动把有价值的回答 **Pin** 成 Note，方便以后快速找到。Note 还能作为"额外来源"参与后续的问答——相当于你可以把 AI 的总结也加入知识库，越用越聪明。
