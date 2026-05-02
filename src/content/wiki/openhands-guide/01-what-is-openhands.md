---
title: "OpenHands 是什么：免费开源的 AI 编程 Agent"
wiki: "openhands-guide"
order: 1
description: "OpenHands 核心能力、和 Cursor/Claude Code/Devin 的区别、为什么它是 2026 年最值得关注的开源 AI 编程平台"
---

## 一句话介绍

OpenHands 是一个完全开源（MIT 协议）的 AI 软件工程 Agent 平台，前身叫 OpenDevin。它不是编辑器插件，不是自动补全——它是一个能独立规划任务、写代码、跑命令、调试 bug、提交 PR 的**自主编程代理**。

![OpenHands Web 界面](https://raw.githubusercontent.com/OpenHands/docs/main/openhands/static/img/oh-features.png)

GitHub 上 72K+ star，SWE-Bench Verified 得分 77.6%（和 Devin 同一梯队），ICLR 2025 论文级别的项目。关键是：**完全免费，自己部署，随便用**。

## 它跟编辑器 AI 助手有什么本质区别

你用 Cursor、Windsurf 或 Copilot 时，AI 是你的副驾驶——你给指令，它帮你补代码、改文件，最终还是你在开车。

OpenHands 不一样。你给它一个任务描述，它会：
1. 自己规划步骤（Planning）
2. 自己写代码、建文件
3. 自己开终端跑命令装依赖
4. 自己打开浏览器查文档
5. 跑测试，发现报错自己修
6. 最后给你提一个 PR

整个过程你可以盯着看，也可以走开喝杯咖啡回来检查结果。

## 架构：Agent + Sandbox + Runtime

```
┌─────────────────────��───────────────────────┐
│              OpenHands Platform              │
├────────────┬────────────┬───────────────────┤
│   Agent    │   LLM API  │   Event Stream    │
│ (CodeAct)  │ (任意模型)  │  (Action/Observe) │
├────────────┴────────────┴───────────────────┤
│           Docker Sandbox (隔离执行)           │
│  ┌──────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Bash │  │  Browser  │  │   Jupyter    │  │
│  │终端   │  │  浏览器    │  │   Python     │  │
│  └──────┘  └──────────┘  └──────────────┘  │
└─────────────────────────────────────────────┘
```

核心设计思路：Agent 在本地跑（低延迟、密钥不出机器），但**所有代码执行都在 Docker 容器里隔离**。哪怕 Agent 犯了错误跑了 `rm -rf /`，也只影响容器内部，你的主机安全得很。

## 和竞品的核心对比

| 维度 | OpenHands | Devin | Cursor | Claude Code |
|------|-----------|-------|--------|-------------|
| 定位 | 自主编程 Agent 平台 | 自主编程 Agent (SaaS) | AI 编辑器 | 终端 AI Agent |
| 开源 | MIT，完全免费 | 闭源，$20/月起 | 闭源，$20/月 | 闭源，按 token 计费 |
| 模型 | 任意（Claude/GPT/Gemini/本地） | 锁定厂商模型 | 多模型 | 仅 Claude |
| 隔离性 | Docker 沙箱 | 云端 VM | 无（在你 IDE 里跑） | 无（在终端直接跑） |
| 浏览器 | 内置 | 内置 | 无 | 无 |
| GitHub 集成 | 原生（Resolver Action） | 原生 | 无 | 基础 |
| 最佳场景 | 自动修 Issue、批量重构、CI 集成 | 全托管任务 | 日常编码 | 大型重构 |

我的观点：如果你每天写代码选 Cursor，复杂推理选 Claude Code，自动化批处理和 CI 集成选 OpenHands。三者不冲突，可以组合使用。

## 谁在用

AMD、Apple、Google、Amazon、Netflix、NVIDIA——这些公司的开发者都在贡献或使用 OpenHands。All-Hands-AI 团队拿了 1880 万美元 A 轮融资，CMU 教授 Graham Neubig 是联合创始人。

这不是个人玩具项目，是有严肃工程团队和学术背景支撑的产品。
