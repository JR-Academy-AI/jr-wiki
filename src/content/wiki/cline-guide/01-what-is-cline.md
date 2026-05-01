---
title: "Cline 是什么：开源免费的 AI 编程 Agent"
wiki: "cline-guide"
order: 1
description: "Cline 核心能力、和 Cursor / Windsurf / Claude Code 的区别、为什么它是 2026 年增长最快的 AI 编程工具"
---

## Cline 一句话介绍

Cline 是一个运行在 VS Code 里的开源 AI 编程 Agent——你用自然语言描述任务，它帮你读代码、改文件、跑命令、开浏览器验证效果，全程每一步都需要你点确认。和 Cursor、Windsurf 这些「AI IDE」不同，Cline 是纯插件，装在你现有的 VS Code 上就能用，不用换编辑器。

![Cline VS Code 界面](https://raw.githubusercontent.com/cline/cline/main/assets/docs/cline-hero.png)

2024 年底 Cline 只有几万用户，2026 年已经突破 **500 万安装**、GitHub 58000+ star。增长速度超过了 Cursor 同期。原因很简单：免费、开源、不锁模型。你拿自己的 API key 接 Claude、GPT、Gemini、DeepSeek 甚至本地的 Ollama 模型都行，Cline 不收一分钱中间费。

## 核心架构

Cline 的工作方式是「Agent 循环」——接到任务后不断执行动作、读取反馈、决定下一步，直到任务完成：

```
你描述任务
    ↓
┌──────────────────────────────────┐
│  Plan Mode: 分析代码库 → 生成计划  │
├──────────────────────────────────┤
│  Act Mode: 改文件 / 跑命令 / 读报错 │
├──────────────────────────────────┤
│  Browser: 打开网页 / 截图 / 验证 UI │
├──────────────────────────────────┤
│  MCP: 调用外部工具（数据库/API/Jira）│
└──────────────────────────────────┘
    ↓
每一步都要你确认（或开启 Auto-approve）
```

关键能力：

- **Plan & Act 双模式**：Plan 模式只读不写，先梳理依赖、拟定修改方案；Act 模式执行计划，改代码跑命令。复杂任务先 Plan 再 Act，简单任务直接 Act
- **人机协作审批**：默认每个文件修改和终端命令都要你点批准，不会偷偷改你代码
- **Checkpoint 快照**：每步操作前保存工作区快照，随时可以回滚到任意步骤
- **Browser 自动化**：内置浏览器控制，能打开页面、点击按钮、填表单、截图——做完前端改动直接验证

## 和 Cursor / Windsurf / Claude Code 的区别

2026 年 AI 编程工具四大主力，定位完全不同：

| 特性 | Cline | Cursor | Windsurf | Claude Code |
|------|-------|--------|----------|-------------|
| 本质 | VS Code 插件 | VS Code fork IDE | VS Code fork IDE | 终端 CLI |
| 开源 | ✅ Apache 2.0 | ❌ | ❌ | ❌ |
| 费用 | 免费 + 自付 API | $20/月起 | $15/月起 | API 按量付费 |
| 模型锁定 | 无——任意 Provider | 多模型但平台管控 | 多模型 | 仅 Anthropic |
| Agent 模式 | Plan/Act | Agent Mode | Cascade | CLI Agent |
| 独家能力 | MCP 市场 + 完全透明 | Background Agent | Flow State | 100万 token 上下文 |

**我的看法**：如果你不想换编辑器、不想按月交钱、想完全控制用哪个模型——Cline 是唯一选择。Cursor 赢在生态和 Background Agent，Claude Code 赢在推理能力和超长上下文。最强组合是 **Cline + Claude Code 双开**：Cline 在 VS Code 里写业务代码，Claude Code 在终端做架构级重构。

## 谁适合用 Cline

- **VS Code 重度用户**：不用换编辑器，现有插件和设置全保留
- **预算敏感的开发者**：用 DeepSeek 或 Gemini Flash 能把 API 成本压到几乎为零
- **想用本地模型的人**：接 Ollama 或 LM Studio，代码不出本机，隐私有保障
- **团队有合规要求**：开源代码可审计，API key 自管理，数据不经过第三方
- **喜欢折腾的极客**：`.clinerules` 自定义规则、MCP 自建工具、Workflow 自动化链路，可玩性远超闭源产品

不太适合：完全不想管 API key 和模型选择的人（Cursor 那种「开箱即用」的体验更省心）；需要 Tab 自动补全的人（Cline 只有 Agent 模式，没有行级补全）。
