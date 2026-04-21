---
title: "版本控制与团队协作"
wiki: "n8n-workflow-automation"
order: 7
description: "用 Git 管理 n8n 工作流：Source Control 配置、多环境部署、团队协作流程"
---

![n8n Source Control 多环境架构](https://raw.githubusercontent.com/n8n-io/n8n-docs/main/docs/_images/source-control-environments/vc-multi-multi.png)

工作流越写越多之后，你会发现几个问题：改坏了没法回滚、测试环境和生产环境混在一起、多人编辑互相覆盖。n8n 内置的 **Source Control** 功能（Git 集成）就是解决这些的。

## 启用 Source Control

Settings → Source Control，需要三样东西：

| 配置项 | 值 |
|--------|-----|
| **Repository URL** | 你的 Git 仓库地址（SSH 格式） |
| **Branch** | 要同步的分支，比如 `main` |
| **SSH Key** | n8n 自动生成，把 public key 加到 Git 仓库的 Deploy Keys |

```bash
# 1. 在 GitHub 创建一个专门存工作流的私有仓库
gh repo create my-org/n8n-workflows --private

# 2. n8n 会生成 SSH key，复制 public key
# Settings → Source Control → 复制 SSH Public Key

# 3. 加到 GitHub 仓库的 Deploy Keys（允许 Write access）
# GitHub → 仓库 Settings → Deploy keys → Add deploy key
```

配好之后，编辑器顶部会出现 Push/Pull 按钮。

## Push 和 Pull 的逻辑

**Push**：把本地 n8n 实例的工作流导出成 JSON，commit 到 Git 仓库。每次 push n8n 会生成一个包含所有工作流定义的 commit。

**Pull**：从 Git 仓库拉取工作流定义，覆盖本地实例。**注意：Pull 会覆盖本地修改**，所以养成先 Push 再 Pull 的习惯。

n8n push 出去的文件结构：

```
n8n-workflows/
├── workflows/
│   ├── daily-report.json
│   ├── github-pr-notifier.json
│   └── ai-customer-service.json
├── credential_stubs/
│   ├── openai-prod.json        # 只有元数据，不含真实密钥
│   └── slack-workspace.json
└── variable_stubs/
    └── variables.json
```

Credential 只导出元数据（名称、类型），真实密钥不会进 Git。每个环境需要单独配置 Credential 的值。

## 多环境部署

推荐的架构：两个 n8n 实例各连一个 Git 分支。

| 环境 | n8n 实例 | Git 分支 | 用途 |
|------|---------|---------|------|
| **Development** | n8n-dev.internal | `dev` | 开发测试，随便改 |
| **Production** | n8n.yourcompany.com | `main` | 线上运行 |

工作流程：

1. 在 Dev 实例开发、测试工作流
2. Dev 实例 Push 到 `dev` 分支
3. 在 GitHub 创建 PR：`dev` → `main`，团队 review
4. Merge 后，Production 实例 Pull 最新的 `main`

```bash
# 也可以用 n8n CLI 做自动化部署
n8n export:workflow --all --output=./workflows/
n8n import:workflow --input=./workflows/

# 配合 CI/CD pipeline，merge 到 main 后自动触发 import
```

## 团队协作注意事项

**工作流命名规范**——n8n 的 Source Control 按工作流 ID 追踪，不是按名字。但好的命名能让 Git diff 更可读：

```
[团队] 功能描述 - 版本
例如: [运营] 每日数据报告 - v2
     [开发] GitHub PR 通知 Slack
     [AI] 客服 Bot - GPT4o
```

**避免冲突**：两人同时编辑同一个工作流会冲突。约定每个工作流有一个 owner，改之前在 Slack 喊一声。

**Variables 管理环境差异**：Dev 和 Prod 的 API endpoint 不同？用 n8n Variables（Settings → Variables）存，工作流里用 `{{ $vars.API_BASE_URL }}` 引用，Push/Pull 不会覆盖 Variable 的值。
