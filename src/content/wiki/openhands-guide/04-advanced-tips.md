---
title: "进阶玩法：多模型、CI 集成与团队协作"
wiki: "openhands-guide"
order: 4
description: "接入本地模型（Ollama）、config.toml 高级配置、Headless 模式集成 CI/CD、MicroAgent 扩展、安全最佳实践"
---

## 多模型配置：省钱又灵活

OpenHands 通过 LiteLLM 支持几乎所有 LLM 提供商。核心思路：**主任务用强模型，子任务用便宜模型**。

```toml
# config.toml — 多模型配置示例
[llm]
model = "anthropic/claude-sonnet-4-20250514"
api_key = "sk-ant-xxx"
temperature = 0.0

[llm.cheap]
model = "openai/gpt-4o-mini"
api_key = "sk-xxx"

[llm.local]
model = "openai/qwen3-coder:30b"
api_key = "dummy"
base_url = "http://host.docker.internal:11434/v1"

# 指定不同 Agent 用不同模型
[agent.RepoExplorerAgent]
llm_config = "cheap"
```

这样主 Agent 用 Claude Sonnet 做复杂推理，代码搜索子任务用 GPT-4o-mini 省钱。

## 接入本地模型（Ollama）

不想付 API 费用？本地跑也行：

```bash
# 1. 启动 Ollama，设置足够大的上下文窗口
OLLAMA_CONTEXT_LENGTH=32768 OLLAMA_HOST=0.0.0.0:11434 ollama serve

# 2. 拉模型（推荐 Qwen3-Coder 或 Devstral）
ollama pull qwen3-coder:30b

# 3. config.toml 配置
# model = "openai/qwen3-coder:30b"
# base_url = "http://host.docker.internal:11434/v1"
# api_key = "dummy"
```

⚠️ 踩坑点：Ollama 默认 context 只有 4096 token，OpenHands 需要至少 32K。不设 `OLLAMA_CONTEXT_LENGTH` 会导致各种诡异报错。

![OpenHands 代码修改视图](https://raw.githubusercontent.com/OpenHands/docs/main/openhands/static/img/changes-tab.png)

## Headless 模式：集成到 CI/CD

这是 OpenHands 区别于所有 IDE 工具的杀手级功能——**它能在无人值守的环境里跑**。

```bash
# 在 CI 管道里自动执行任务
openhands --headless -t "分析最近 3 个 commit 的代码质量，输出报告"

# JSON 输出，方便解析
openhands --headless --json -t "检查是否有安全漏洞" > report.json

# 设置预算上限（CI 里必须加）
openhands --headless --max-iterations 30 -t "修复 lint 错误"
```

实战案例——自动修 lint 的 GitHub Action：

```yaml
name: Auto-fix Lint
on:
  push:
    branches: [main]

jobs:
  lint-fix:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run OpenHands to fix lint
        run: |
          pip install openhands-ai
          openhands --headless --always-approve \
            --max-iterations 20 \
            -t "运行 eslint，修复所有 auto-fixable 问题，提交修改"
        env:
          LLM_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          LLM_MODEL: anthropic/claude-sonnet-4-20250514
```

## MicroAgent 和扩展生态

OpenHands 有一个扩展仓库（`github.com/OpenHands/extensions`），包含 38 个 Skills 和 9 个 Plugins：

**常用 Skills：**
- `code-review` — 自动代码审查
- `docker` — Docker 容器管理
- `kubernetes` — K8s 操作
- `security` — 安全扫描
- `release-notes` — 自动生成发版说明
- `frontend-design` — 前端设计建议

**自定义 MicroAgent：**

在项目根目录创建 `.openhands_instructions` 文件，给 Agent 定制指令：

```markdown
# 项目规范

- 使用 TypeScript strict 模式
- 所有函数必须有 JSDoc 注释
- 测试覆盖率不得低于 80%
- commit message 遵循 Conventional Commits
- 不使用 any 类型
```

Agent 每次启动都会读这个文件，按照你的规范行事。

## 安全最佳实践

### 确认模式

```toml
[security]
confirmation_mode = true     # 每步操作都要你确认
# 或
security_analyzer = "llm"    # 用 LLM 判断操作是否安全
```

三档选择：
- **确认模式**：每步手动批准（最安全，适合新手）
- **LLM 审查**：自动用另一个 LLM 判断操作安全性（推荐）
- **全自动**：`--always-approve`（仅在你完全信任场景时使用）

### Docker 隔离要点

```bash
# ✅ 只挂载项目目录
-e SANDBOX_VOLUMES="/home/user/project:/workspace:rw"

# ❌ 永远不要挂载这些
# /home/user/.ssh
# /home/user/.aws
# /etc/passwd
# /var/run/docker.sock（除非是 Docker-in-Docker 场景）
```

### Token 预算控制

CI 环境里**必须**设置硬上限：

```toml
[core]
max_iterations = 50          # 最多 50 步

[llm]
num_retries = 3              # API 重试上限
retry_min_wait = 5           # 重试间隔（秒）
retry_max_wait = 60
```

没有上限的 Agent 在遇到解不了的问题时会反复尝试，一晚上能烧掉几十美元 API 费。

## 团队协作模式（Cloud）

OpenHands Cloud 的 Team 版本支持：
- 多用户共享项目
- RBAC 权限控制
- 集中计费和用量报表
- Slack 集成——在 Slack 里 @Agent 就能触发任务
- Jira/Linear 集成——Issue 自动同步

对于 5 人以上的团队，Cloud Team（$500/月）比每人各自配置 API Key 更划算，也更可控。
