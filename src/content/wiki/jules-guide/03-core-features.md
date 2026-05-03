---
title: "四大核心功能深度解析"
wiki: "jules-guide"
order: 3
description: "Jules Plan-then-Execute 工作流、CLI 命令行工具、REST API 集成、Continuous AI（定时任务 + 建议任务 + CI 自愈）"
---

## Plan-then-Execute：Jules 的执行哲学

Jules 和其他 AI 编程工具最大的区别不只是异步，还有它的**先计划后执行**机制。Cursor Agent Mode 是边想边做，Claude Code 是给你看思考过程但也在同步执行，而 Jules 硬性要求你先看计划再批准。

![Jules 核心功能与工作流](https://img.youtube.com/vi/o2ohTTcOOXo/maxresdefault.jpg)

这个设计的好处是：计划阶段发现问题只浪费 10 秒，执行阶段发现问题浪费 10 分钟（还扣一次任务配额）。养成认真审计划的习惯，能省很多冤枉路。

计划审批时你有三个选择：

| 操作 | 场景 |
|------|------|
| **Approve** | 计划没问题，开始执行 |
| **修改计划** | 在 Chat 里告诉 Jules 调整（"不要改那个文件"、"用 Vitest 不要用 Jest"） |
| **拒绝重来** | 计划完全跑偏，重新描述任务 |

执行过程中如果发现方向不对，也可以随时中止。但中止不退还任务配额。

## Jules Tools CLI：终端里调度异步任务

不想开浏览器？Jules 有官方 CLI，用 npm 全局安装：

```bash
# 安装
npm install -g @google/jules

# 登录
jules login

# 不带参数启动 TUI 交互界面
jules

# 为指定仓库创建新任务
jules new --repo myorg/my-app "给 src/api/users.ts 加错误处理和输入校验"

# 并行创建 3 个任务
jules new --repo myorg/my-app --parallel 3 "重构所有 var 为 const/let"

# 列出所有会话
jules remote list --session

# 列出已连接的仓库
jules remote list --repo

# 拉取某个会话的结果
jules remote pull --session 123456
```

CLI 最强的地方是**可以和其他工具组合**。比如把 GitHub Issues 批量喂给 Jules：

```bash
# 把所有 open issue 批量派给 Jules
gh issue list --state open --json title,body | \
  jq -r '.[] | "Issue: " + .title + "\n" + .body' | \
  while IFS= read -r task; do
    jules new --repo myorg/my-app "$task"
  done
```

早上跑一下这个脚本，下午回来收一堆 PR——这就是异步 Agent 的正确打开方式。

Jules 还有 **Gemini CLI 扩展**，装完后可以在 Gemini CLI 里直接调度 Jules 任务：

```bash
# 安装 Gemini CLI 扩展
gemini extensions install https://github.com/gemini-cli-extensions/jules --auto-update
```

## Jules API：把 Jules 接入你的工作流

Jules 提供 REST API（目前 alpha 版），可以把异步编程能力接入 Slack Bot、CI/CD 管道、项目管理工具。

核心概念三个：

- **Source**：一个 GitHub 仓库
- **Session**：一个任务（包含 prompt + source + 执行过程）
- **Activity**：Session 内的单个动作（出计划、发消息、更新进度）

```bash
# 创建一个新任务
curl -X POST https://jules.google/api/v1alpha/sessions \
  -H "X-Goog-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "github:myorg/my-app",
    "prompt": "升级所有过期依赖并修复 breaking changes"
  }'

# 查看任务状态
curl https://jules.google/api/v1alpha/sessions/SESSION_ID \
  -H "X-Goog-Api-Key: YOUR_API_KEY"
```

API Key 在 Jules Web App 的 Settings 页面生成。配合 GitHub Action 可以实现全自动流水线：

```yaml
# .github/workflows/jules-fix.yml
name: Jules Auto Fix
on:
  issues:
    types: [opened]
jobs:
  jules-fix:
    runs-on: ubuntu-latest
    steps:
      - uses: google-labs-code/jules-invoke
        with:
          prompt: "Fix issue: ${{ github.event.issue.title }} - ${{ github.event.issue.body }}"
          jules-api-key: ${{ secrets.JULES_API_KEY }}
```

新 Issue 一提交，Jules 自动接单开干——这是真正的 Continuous AI。

## Continuous AI：让 Jules 主动帮你干活

2026 年 Jules 推出三大"持续 AI"功能，从被动等任务变成主动发现问题：

**1. Suggested Tasks（建议任务）**

开启后 Jules 会扫描你代码里的 `#TODO` 注释和潜在性能问题，主动推荐任务。Pro/Ultra 用户可以给最多 5 个仓库开启。你可以审批、驳回或直接忽略。

**2. Scheduled Tasks（定时任务）**

在任务输入框点 "Planning" 下拉 → 选 "Scheduled Task" → 设置频率。经典场景：

| 定时任务 | 频率 | 效果 |
|---------|------|------|
| 依赖安全检查 | 每周 | 自动升级有漏洞的包 |
| Lint 修复 | 每日 | 保持代码风格统一 |
| 废弃 API 迁移 | 每月 | 逐步替换 deprecated 调用 |

**3. Self-Healing Deployments（自愈部署）**

和 Render 集成后，当 Jules 的 PR 在部署时失败，Render 自动把错误日志发回给 Jules，Jules 分析问题、推修复 commit、触发重新部署。整个闭环不需要人介入。

CI 自愈也类似——Jules 的 PR 在 GitHub Actions 里挂了，它会自动读 CI 日志、找问题、推修复代码。这个功能是 Jules 相对于 Cursor 和 Claude Code 最大的差异化优势。
