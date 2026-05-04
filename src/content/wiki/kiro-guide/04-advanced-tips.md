---
title: "进阶技巧与实战案例"
wiki: "kiro-guide"
order: 4
description: "Autopilot 模式、Kiro CLI、上下文管理、AWS 原生集成、真实项目实战经验"
---

## Autopilot 模式

默认情况下 Kiro 每个操作都要你确认。开启 Autopilot 后，Agent 会连续执行多步操作不等你批准——创建文件、改代码、装依赖一气呵成。

![Kiro Agent Hooks 与进阶功能](https://img.youtube.com/vi/Y4fZPoo7FTs/maxresdefault.jpg)

```
Chat 面板底部 → 切换到 Autopilot 模式
或 Command Palette → Kiro: Toggle Autopilot
```

Autopilot 适合：快速原型、模板代码生成、简单重构。不适合：生产代码修改、数据库 schema 变更、任何你需要逐步审查的操作。

随时可以暂停或中断，用 `View all changes` 查看全部改动的 diff，不满意直接 revert。

## Kiro CLI 2.0

2026 年 4 月更新的 Kiro CLI 2.0 支持在终端里跑 Kiro Agent，不用打开 IDE：

```bash
# 下载 CLI（去 kiro.dev/downloads/ 下载对应平台的 CLI 安装包）
# macOS / Linux 安装后直接可用，Windows 需要 Windows 11

# 在项目目录启动交互式 Agent
kiro chat

# 无头模式（CI/CD 场景，不需要人工交互）
kiro chat --headless "Run all tests and fix failures"

# 常用命令
# /model  — 切换 AI 模型
# /load   — 加载上下文文件
# /usage  — 查看 credit 用量
# !       — 执行 shell 命令
```

CLI 2.0 支持 Windows、macOS、Linux，带终端 UI（不是纯文本输出，有进度条和 diff 预览）。在 CI/CD 管道里用 `--headless` 模式让 Kiro 自动修测试、更新文档。

CLI 还支持 ACP（Agent Client Protocol），可以和 JetBrains、Zed 等编辑器对接——如果你不想用 Kiro IDE 但想用它的 spec 工作流，CLI 是入口。

## 上下文管理技巧

Kiro 在 80% 上下文窗口用量时自动做摘要压缩。但主动管理上下文能让 AI 回答更准：

### Knowledge Bases

大代码库或文档集超出上下文窗口时，用 Knowledge Base 做语义搜索：

```json
// .kiro/agent.json
{
  "knowledgeBases": [
    {
      "name": "project-docs",
      "path": "./docs/**/*.md"
    }
  ]
}
```

Knowledge Base 不会全量加载进上下文，只在 AI 需要时搜索相关片段，省 token。

### 文档附件

Kiro 支持在对话中附加文件：PDF、CSV、Excel、Word、HTML、Markdown。每条消息最多 5 个附件。把 API 文档或设计稿直接拖进 Chat 比粘贴文本效果好——Kiro 会把它当原生文档块处理。

## AWS 原生集成

Kiro 对 AWS 服务的理解不是"通用 AI 碰巧知道 AWS"，而是底层就跑在 Amazon Bedrock 上，对 AWS 生态有原生支持：

```bash
# Spec 里写 "Deploy to AWS Lambda"
# Kiro 自动生成：
# - Lambda handler 代码
# - CDK stack 定义
# - IAM 权限配置
# - API Gateway 路由
```

| AWS 服务 | Kiro 支持方式 |
|---------|-------------|
| Lambda | Spec 直出 handler + CDK，含 Durable Functions |
| DynamoDB | 从 design.md 数据模型直接生成表定义 |
| API Gateway | REST API spec 自动生成路由配置 |
| CloudFormation | 模板校验 + 安全合规检查 + 部署排错 |
| CDK | 基础设施即代码脚手架 |
| Cognito | 认证模块 spec 支持 |
| CodeCatalyst | 工作流集成 |

如果你的公司技术栈重度依赖 AWS，Kiro 的优势是其他 AI IDE 很难追上的。

## 实战：从 0 到 1 做一个文件分享服务

一个真实案例——用 Kiro 从 spec 到部署，2 天完成一个加密文件分享应用：

### Day 1: Spec + 核心逻辑

```markdown
# requirements.md（精简版）
1. WHEN a user uploads a file THE SYSTEM SHALL encrypt it with AES-256
2. WHEN a user generates a share link THE SYSTEM SHALL create a time-limited URL
3. WHEN a recipient opens the link THE SYSTEM SHALL decrypt and stream the file
4. IF the link has expired THEN THE SYSTEM SHALL return 403 with expiry message
```

Kiro 生成的 design.md 选了 Next.js + S3 + KMS 加密。tasks.md 拆成 8 个任务，逐个执行。

### Day 2: 前端 + 部署

Steering 文件指定了 shadcn/ui 组件库和 Tailwind 样式规范，Kiro 生成的 UI 代码风格一致。用 CDK spec 一键部署到 AWS。

全程 Spec 文件就是项目文档——以后新人接手直接读 `.kiro/specs/` 就知道每个功能的需求、设计、任务拆分。

## 效率提升小技巧

1. **Spec 复用**：好的 spec 模板存起来，同类项目直接复制 `.kiro/specs/` 目录，改需求就行
2. **Hook 组合**：保存代码 → 自动跑测试 → 测试失败自动修 → 再跑测试，形成闭环
3. **Steering 分层**：全局 `~/.kiro/steering/` 放团队通用规范，项目 `.kiro/steering/` 放项目特有规则
4. **Powers 按需装**：别一次装太多 Power，会拖慢上下文加载。用到哪个装哪个
5. **CLI 批量执行**：多个 spec 用 CLI headless 模式串行执行，适合周末批量重构
