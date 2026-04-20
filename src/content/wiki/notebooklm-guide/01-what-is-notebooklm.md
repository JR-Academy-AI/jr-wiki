---
title: "NotebookLM 是什么：Google 的 AI 文档研究助手"
wiki: "notebooklm-guide"
order: 1
description: "理解 NotebookLM 的核心定位、RAG 技术原理，以及与 ChatGPT、Perplexity、Claude 的全面对比"
---

NotebookLM 是 Google 推出的 AI 研究助手——你把文档、网页、YouTube 视频扔进去，它就变成一个只基于你的资料回答问题的知识库。所有回答都带引用标注，点一下就能跳回原文验证。

![NotebookLM interface](https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/NotebookLM_logo.svg/640px-NotebookLM_logo.svg.png)

## 为什么 NotebookLM 突然火了

2024 年底 Audio Overview 功能上线后，NotebookLM 彻底出圈。你上传几篇论文，它能自动生成一段两个 AI 主播对话的播客，有说有笑、有类比有总结，听起来跟真人电台一样。很多人第一次听到都以为是真人录的。

到 2025-2026 年，Google 不断加码：Video Overview（视频版播客）、Deep Research（联网深度研究）、Mind Map（交互式思维导图）、Slide Deck（可编辑幻灯片）全都上了。NotebookLM 从一个"能聊天的 PDF 阅读器"变成了一个完整的 AI 研究工作台。

## 核心技术：RAG

NotebookLM 底层用的是 **RAG（Retrieval-Augmented Generation）** 技术，跑在 Google 最新的 Gemini 模型上。

```
传统 AI 聊天（ChatGPT、Claude）:
用户提问 → AI 从训练数据里"回忆"答案 → 可能产生幻觉

NotebookLM 的 RAG 方式:
用户提问 → 先在你上传的文档里检索相关段落 → 基于检索结果生成回答 → 附上引用来源
```

这就是 NotebookLM 最大的卖点：**回答有据可查，不会胡编乱造**。每个回答旁边都有数字标注（如 [1][2]），点击就跳回原文。当你需要基于特定资料做研究时，这比通用 AI 助手靠谱得多。

## 支持的资料类型

NotebookLM 不挑食，几乎什么格式都吃得下：

- **文档类**：PDF、DOCX、TXT、Markdown、EPUB
- **表格类**：CSV、Google Sheets（最多 10 万 token）
- **演示类**：PPTX、Google Slides（最多 100 页）
- **多媒体**：YouTube 视频（需公开且有字幕）、MP3/WAV 音频、图片
- **网页**：任意公开 URL（抓取正文，不含付费墙内容）
- **Google 全家桶**：Google Docs、Sheets、Slides 直接导入

每个来源最大 **50 万字**或 **200MB**，单个笔记本最多放 50 个来源（Plus 版 300 个）。

## 和竞品怎么选

| 维度 | NotebookLM | ChatGPT | Perplexity | Claude Projects |
|------|-----------|---------|------------|----------------|
| **定位** | 文档研究助手 | 通用 AI 助手 | AI 搜索引擎 | 项目知识库 |
| **知识来源** | 只用你上传的资料 | 训练数据 + 联网 | 实时联网搜索 | 上传文档 + 训练数据 |
| **会不会瞎编** | 几乎不会（有引用） | 会 | 较少（有来源） | 较少 |
| **播客生成** | ✅ Audio Overview | ❌ | ❌ | ❌ |
| **免费额度** | 很大方 | 有限 | 有限 | 有限 |
| **入门付费** | $19.99/月 | $20/月 | $20/月 | $20/月 |

**我的选择建议**：

- 要基于自己的文档做研究 → **NotebookLM**（专门干这个的）
- 要通用写代码、写文案 → **ChatGPT** 或 **Claude**
- 要搜索最新资讯 → **Perplexity**（实时联网）
- 要把项目文档变成可查询知识库 → **NotebookLM** 或 **Claude Projects**

## 谁适合用 NotebookLM

**很适合**：
- 读论文、做文献综述的研究生和研究员
- 需要快速消化大量 API 文档的开发者
- 整理会议记录、项目文档的项目经理
- 准备考试、整理课件的学生
- 想把长文章变成播客在通勤路上听的任何人

**不太适合**：
- 需要 AI 执行代码、跑测试的开发者（它不能运行代码）
- 需要联网获取最新信息的场景（它只看你上传的资料）
- 处理机密数据且不信任云端的企业（数据存在 Google 服务器上）
