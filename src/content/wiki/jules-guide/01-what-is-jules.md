---
title: "Jules 是什么：Google 的异步 AI 编程代理"
wiki: "jules-guide"
order: 1
description: "Jules 核心能力、异步工作流、和 Claude Code / Cursor / Devin 的区别、为什么它是 2026 年最值得关注的 AI 编程新物种"
---

## Jules 一句话介绍

Google Jules 是 Google DeepMind 打造的**异步自主编程代理**，2025 年 5 月公测，8 月正式发布。它和你用过的所有 AI 编程工具都不一样——Cursor、Claude Code、Copilot 都是"你坐在电脑前盯着 AI 干活"，Jules 是"你把任务扔给它，关掉浏览器去喝咖啡，回来收 PR"。

![Jules 异步编程概览](https://img.youtube.com/vi/QXcJcHgjPck/maxresdefault.jpg)

这个区别听起来小，实际上是范式级的变化。传统 AI 编程是**同步**的——你和 AI 一来一回对话，你走了它就停了。Jules 是**异步**的——任务丢进云端 VM，它自己克隆代码、分析架构、写代码、跑测试、开 PR，全程不需要你在场。

## 核心架构

Jules 跑在 Google Cloud 的隔离 Ubuntu VM 里，每次任务用全新的短生命周期虚拟机：

```
┌───────────────────────────────────────┐
│          Jules Dashboard (Web)         │  ← 任务管理 + 计划审批
├───────────────────────────────────────┤
│     Gemini 3.1 Pro（推理引擎）          │  ← 代码理解 + 生成
├───────────────────────────────────────┤
│   Plan-then-Execute Pipeline           │  ← 先出计划 → 人审批 → 再执行
├───────────────────────────────────────┤
│   Isolated Cloud VM (Ubuntu)           │  ← Node/Python/Go/Rust/Java 预装
├───────────────────────────────────────┤
│       GitHub Integration               │  ← 克隆仓库 → 改代码 → 开 PR
└───────────────────────────────────────┘
```

- **Gemini 3.1 Pro**：Jules 的大脑，负责理解代码和生成修改方案。Pro/Ultra 用户能用到 1M token 上下文窗口
- **Plan-then-Execute**：不会上来就改代码。先给你一个详细计划——改哪些文件、为什么改、预期效果——你审批后才动手
- **Isolated VM**：每次任务都在全新虚拟机里跑，你的代码不会被拿去训练模型，安全有保障
- **GitHub Native**：直接操作你的 GitHub 仓库，最终产出是标准 Pull Request

## 和 Claude Code、Cursor、Devin 的区别

2026 年 AI 编程工具已经分化出三个路线：IDE 内同步助手、终端同步 Agent、云端异步 Agent。Jules 属于第三种：

| 特性 | Jules | Claude Code | Cursor | Devin |
|------|-------|-------------|--------|-------|
| 本质 | 异步云端 Agent | 同步终端 Agent | IDE 内 AI | 全功能异步 Agent |
| 交互模式 | 提交任务，回来收 PR | 实时对话，开发者在环 | 实时编辑，Tab 补全 | 提交任务，有 IDE + 浏览器 |
| 底层模型 | Gemini 3.1 Pro | Claude Opus/Sonnet | 多模型可选 | 自有多模型 |
| 免费额度 | 15 任务/天 | 无原生免费 | 50 次/月 | 无免费 |
| 最强场景 | 批量任务并行 | 复杂推理 + 大重构 | 日常编码 | 端到端复杂项目 |
| 独家能力 | 定时任务 + CI 自愈 | Extended Thinking | Background Agent | 内建浏览器 |

实际选型建议：

- **日常写代码**用 Cursor——Tab 补全 + Agent Mode 在 IDE 里最顺手
- **复杂架构改动**用 Claude Code——推理能力最强，SWE-bench 跑分 80.8% 碾压同行
- **批量杂活**用 Jules——早上排 10 个任务，下午收 10 个 PR，效率靠的是并行而不是单任务速度
- **预算紧张**优先 Jules——每天 15 个免费任务，不要信用卡，这个慷慨程度在 AI 编程工具里排第一

一句话总结这四个工具的区别：**Cursor 让你写代码更快，Claude Code 让你思考更深，Devin 替你端到端干活，Jules 让你同时干很多活。**
