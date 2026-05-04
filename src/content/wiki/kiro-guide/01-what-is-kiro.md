---
title: "Kiro 是什么：AWS 的规格驱动 AI IDE"
wiki: "kiro-guide"
order: 1
description: "Kiro 核心理念、Spec-Driven Development 工作流、和 Cursor / Windsurf / Claude Code 的区别"
---

## Kiro 一句话介绍

Kiro 是 AWS 推出的 AI 编程 IDE，2025 年 7 月公开预览，同年 11 月正式 GA。它基于 Code OSS（VS Code 的开源内核），但核心卖点不是"更快的补全"或"更强的 Agent"——而是在你写代码之前，先帮你把需求想清楚。

![Kiro AI IDE 概览](https://img.youtube.com/vi/8m6w6JDoQbk/maxresdefault.jpg)

AWS 的思路是：大多数 AI IDE 拿到提示词就直接开干，写完你才发现方向错了。Kiro 在中间插了一层"规格驱动开发"（Spec-Driven Development）——先生成需求文档，再出设计方案，最后拆任务逐步实现。听起来多了一步，但实际上少走很多弯路。

## Spec-Driven Development 核心流程

Kiro 的 spec 工作流分三步，每步产出一个 markdown 文件：

```
需求描述（你说的一句话）
       ↓
┌─ requirements.md ─┐  ← EARS 格式的需求列表
├─ design.md ────────┤  ← 技术方案（数据模型、API、组件结构）
└─ tasks.md ─────────┘  ← 可执行的任务清单（带 checkbox）
       ↓
  逐个任务生成代码
```

- **requirements.md**：用 EARS 标记法（Easy Approach to Requirements Syntax，最早由 Rolls-Royce 开发）写需求。比如 `WHEN a user submits a valid email THE SYSTEM SHALL send a reset link valid for 30 minutes`
- **design.md**：技术选型、数据模型、API 设计、组件拆分
- **tasks.md**：每个任务粒度控制在一次 Agent 对话能搞定的大小

每步你都能审阅和修改，不满意就让 Kiro 重新生成。代码只在你确认 tasks 之后才开始写。

## 和 Cursor、Windsurf、Claude Code 的区别

2026 年 AI 编程四大工具，各走不同路线：

| 特性 | Kiro | Cursor | Windsurf | Claude Code |
|------|------|--------|----------|-------------|
| 出品方 | AWS (Amazon Bedrock) | Anysphere | Cognition AI (收购 Codeium) | Anthropic |
| 本质 | Code OSS + Spec 驱动 | VS Code fork + 速度优先 | AI 原生 IDE + Cascade | 终端 AI Agent |
| 核心差异 | 先写 spec 再写代码 | 直接 Agent 开干 | Flow State 上下文追踪 | Extended Thinking 深度推理 |
| 自动补全 | 有，但弱于 Cursor | Tab 补全最强 | Supercomplete 免费不限量 | 无 |
| 独家能力 | Agent Hooks + Powers | Background Agent | Web Preview | 大规模重构 |
| AWS 集成 | 原生（Lambda / CDK / CloudFormation） | 无 | 无 | 无 |
| 社区规模 | 3.6k GitHub stars / 19k Discord | 最大 | 中等 | 增长快 |

实际怎么选：

- **需要严格需求管理、团队协作、AWS 技术栈** → Kiro。spec 让每个人对"要做什么"达成一致，不会出现 A 觉得做登录、B 觉得做注册的情况
- **个人开发、快速原型、补全手感** → Cursor。Agent Mode 上手最快，社区教程最多
- **预算有限、上下文自动感知** → Windsurf。免费补全不限量，价格有竞争力
- **大型重构、架构级改动** → Claude Code。终端里直接操作整个代码库

```bash
# 选型速查：
# 团队协作 + AWS 技术栈 + 需求文档化 → Kiro
# 个人效率 + 补全速度 + 社区生态 → Cursor
# 预算敏感 + 免费补全 → Windsurf
# 深度推理 + 大型重构 → Claude Code
# 组合方案：Kiro 写 spec + Claude Code 执行复杂重构
```

## Kiro 的定位

Kiro 不是要取代 Cursor 的"快"，而是补上 AI 编程里缺失的一环——**从自然语言到代码之间的结构化思考**。如果你做过大项目就知道，最浪费时间的不是写代码，是反复返工。Kiro 的 spec 流程就是用 AI 帮你在动手前把坑踩完。

这个思路特别适合两种场景：一是多人协作的团队项目（spec 就是活的需求文档），二是 AWS 技术栈的后端服务（原生支持 Lambda / CDK / CloudFormation，spec 里直接出基础设施代码）。
