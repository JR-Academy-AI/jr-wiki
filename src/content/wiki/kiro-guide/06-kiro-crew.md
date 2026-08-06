---
title: "Kiro Crew：多智能体自治工程协作"
wiki: "kiro-guide"
order: 6
description: "2026 年 8 月刚开源的 Kiro Crew：多 Agent 角色分工、cron/webhook 调度、持久记忆、跨 session 审批工作流"
---

## Kiro Crew 是什么

2026 年 8 月 4 日，AWS 宣布开源 **Kiro Crew**——一个把多个 AI 编程 Agent 协调成自治工程团队的编排平台。

简单说：你不再是一个人对着一个 Agent 聊天，而是有一支"AI 工程团队"在后台 24 小时跑任务：

- **Team Lead Agent** 制定计划、拆分任务、分配给下属
- **Builder Agent** 写代码、改文件
- **Validator Agent** 跑测试、验结果
- **Documenter Agent** 更新文档

你只需要在关键节点审批，不需要全程盯着。

![Kiro Crew 多 Agent 协作](https://img.youtube.com/vi/8m6w6JDoQbk/maxresdefault.jpg)

## 背景：从 MeshClaw 到 Kiro Crew

Kiro Crew 最初是 Amazon 内部三个工程师做的一个叫 **MeshClaw** 的边项目，解决一个真实痛点：**怎么让 AI Agent 在你下班后继续干活，回来时能 review 而不是重来**。

MeshClaw 在 Amazon 内部扩散得异常快——六个月内超过 **3.9 万名 Amazon 工程师**在用。这个规模让 AWS 决定把它外部化，重命名为 Kiro Crew，以 **Apache 2.0** 许可开源。

开源意味着什么：
- 不需要 AWS 账号
- 可以完全跑在你的机器、容器或虚拟机里
- 没有额外订阅费
- 代码可以 fork、修改、自部署

## 架构：Agent 角色分工

Kiro Crew 的配置放在 `.kiro/agents/` 目录下：

```
.kiro/agents/
├── team-lead.json      # 编排者：读取计划，分发任务
├── team-lead.prompt.md # Team Lead 的系统提示
├── builder.json        # 实现者：读写文件，跑 shell
├── builder.prompt.md
├── validator.json      # 验证者：只读访问，跑测试
├── validator.prompt.md
├── documenter.json     # 文档员：读取代码，写文档
└── documenter.prompt.md
```

每个 Agent 的 JSON 配置定义它能使用哪些工具：

```json
// builder.json
{
  "name": "builder",
  "description": "Implements features and fixes bugs",
  "tools": ["read", "write", "shell"],
  "maxTurns": 50
}

// validator.json
{
  "name": "validator",
  "description": "Verifies correctness, runs tests",
  "tools": ["read", "shell"],  // 无 write 权限
  "maxTurns": 20
}
```

**关键设计**：Team Lead 独占任务列表的修改权，Builder 和 Validator 看不到也改不了任务状态——避免多个 Agent 互相抢任务或重复执行。

## 触发方式：Cron / Webhook / 手动

Kiro Crew 支持三种启动方式：

### 1. Cron 定时触发

```yaml
# .kiro/crew/schedule.yaml
schedules:
  - name: "每日代码审查"
    cron: "0 9 * * 1-5"   # 周一到周五 9:00
    task: "Review open PRs, check for stale branches, run security scan"
    repos:
      - my-org/backend
      - my-org/frontend
    requireApproval: false  # 自动跑，产出 report
  
  - name: "周五部署检查"
    cron: "0 16 * * 5"     # 每周五 16:00
    task: "Verify staging environment, run E2E tests, generate release notes"
    requireApproval: true   # 需要人工确认才执行部署
```

### 2. Webhook 触发

外部事件（GitHub PR 合并、Jira ticket 更新、监控报警）可以触发 Agent Crew：

```bash
# Webhook 端点自动生成，格式：
POST https://crew.local:8080/webhook/{crew-name}
Content-Type: application/json

{
  "event": "incident",
  "severity": "high",
  "message": "API latency spike in production"
}
```

Crew 收到事件后自动起一个 session，调查问题、提 PR、发 Slack 通知。

### 3. 手动启动（开发调试用）

```bash
# 安装 Kiro Crew（已装 Kiro CLI 后直接可用）
kiro crew init

# 手动跑一个任务
kiro crew run "Refactor all API handlers to use Result pattern, add tests"

# 查看运行中的 Crew
kiro crew status

# 进入 REPL 模式监控
kiro crew monitor
```

## 持久记忆：Crew 会越来越懂你的项目

Crew 的每个 Agent 都有跨 session 的记忆层：

```
.kiro/crew/memory/
├── project-context.md    # 项目整体理解（架构、约定、禁忌）
├── lessons-learned.md    # 踩过的坑，不会重蹈覆辙
├── team-preferences.md   # 团队偏好（比如"不用 try-catch，用 Result 模式"）
└── agent-skills/         # 每个 Agent 学到的专项技能
```

你可以直接编辑这些文件：

```bash
# 查看 Crew 记住了什么
kiro crew memory show

# 删除不想要的记忆
kiro crew memory delete "lesson: always use SQLite for small projects"

# 手动添加背景知识
kiro crew memory add "项目规则：所有 API 必须在 Lambda，不能用 EC2"
```

**Crew 读取 `.kiro/steering/` 文件**——你之前为 Kiro IDE 写的 Steering 规则，Crew 自动继承，不需要重新配置。

## 审批工作流

Kiro Crew 的核心设计理念是"**延迟人类介入到 review 节点**"，而不是每步操作都问你。

```
Task 启动
    ↓
Team Lead 分解任务
    ↓
Builder 并行实现
    ↓
Validator 验证（自动）
    ↓
[审批节点] ← 你在这里参与，只看 diff，决定合并或拒绝
    ↓
Documenter 更新文档（自动）
    ↓
PR 自动提交
```

审批界面：Web Dashboard 和桌面 App 都能看到 Crew 的完整状态，包括：每个 Agent 的对话记录、改动 diff、测试结果、下一步计划。

```bash
# CLI 里审批
kiro crew approve task-id-123

# 拒绝并给反馈
kiro crew reject task-id-123 "别用 for 循环，改用 map/filter"
```

## 安全与隔离

Kiro Crew 在设计上对安全非常重视：

- **Sandbox 隔离**：每个 Agent 跑在独立的 sandbox 里，互相不能访问对方的文件系统
- **签名审计日志**：所有 Agent 操作都有不可篡改的日志，方便合规审计
- **工具权限最小化**：Validator 只有读权限，防止验证阶段改了代码
- **本地部署**：可以完全跑在内网，不需要把代码上传到 AWS

```bash
# 查看审计日志
kiro crew logs --signed --tail 50

# 验证日志签名没有被篡改
kiro crew logs --verify
```

## 实战：让 Crew 处理技术债务

一个真实场景——週五下班前扔给 Crew 一个技术债任务，周一来了看 PR：

```bash
# 周五 5:30 PM
kiro crew run "
  1. 扫描所有 TODO 注释，按优先级分类
  2. 挑出影响最大的 5 个，逐一修复
  3. 每个修复要有对应测试
  4. 生成技术债清理报告
"
```

Crew 在你睡觉时：
1. Team Lead 扫描代码库，生成 TODO 清单
2. Builder 逐个修复，Validator 跑测试确认不破坏现有功能
3. 如果某个修复需要你的决策（比如涉及破坏性 API 改动），Crew 暂停等待你的审批
4. Documenter 更新 CHANGELOG 和相关注释
5. 周一你来，看到 5 个干净的 PR，逐个 review 合并

## 和 Kiro IDE Agent Hooks 的区别

| 特性 | Agent Hooks | Kiro Crew |
|------|------------|-----------|
| 触发条件 | 文件保存事件 | Cron / Webhook / 手动 |
| 规模 | 单任务、单文件 | 多任务、多 Agent |
| 持续时间 | 秒级 | 小时级或更长 |
| 跨 session | 不跨 | 跨 session 持久记忆 |
| 适合场景 | 代码保存时的自动化 | 后台大规模重构、定时维护 |

简单的保存触发自动化用 Agent Hooks，需要长时间跑、多个 Agent 协作的任务用 Kiro Crew。
