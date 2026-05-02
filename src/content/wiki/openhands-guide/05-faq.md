---
title: "常见问题、定价与选型建议"
wiki: "openhands-guide"
order: 5
description: "OpenHands 完整定价对比、常见坑和解决方案、什么时候选 OpenHands 而不是 Cursor/Claude Code/Devin"
---

## 定价一览

| 方案 | 价格 | 包含什么 |
|------|------|---------|
| 自部署 | **免费** | 完整功能，自带 API Key |
| Cloud 免费版 | $0/月 | 每天 10 次对话，自带 Key |
| Cloud Pro | $20/月 | 含 $20 额度，无加价转发 |
| Cloud Team | $500/月 | 多用户、RBAC、集中计费 |
| Enterprise | 定制 | 私有部署、SSO、优先支持 |

关键点：**自部署完全免费**，你只需要付 LLM API 的钱。按 Claude Sonnet 的定价，一个中等复杂的任务（约 50K token）成本大概 $0.15-0.30。一天修 10 个 bug 也就几美元。

![OpenHands 内置浏览器视图](https://raw.githubusercontent.com/OpenHands/docs/main/openhands/static/img/browser-tab.png)

## 和竞品的定价对比

```
OpenHands 自部署:  $0/月 + API 费用（约 $30-100/月重度使用）
OpenHands Pro:     $20/月 + API 费用
Devin Core:        $20/月 + $2.25/ACU（用量难预测）
Cursor Pro:        $20/月（500 次快速请求）
Claude Code:       按 token 计费（重度 $100-200/月）
Windsurf Pro:      $20/月（500 credits）
```

OpenHands 的优势：**模型自由选择 + 零加价**。你用最新的 Claude Sonnet 4 或最便宜的 GPT-4o-mini，都是直连原价，中间没有平台加成。

## 常见问题

### Docker 启动报错 "Cannot connect to Docker daemon"

```bash
# macOS: 确认 Docker Desktop 在运行
open -a Docker

# Linux: 确认 docker service 启动
sudo systemctl start docker

# 权限问题
sudo usermod -aG docker $USER
# 然后重新登录终端
```

### Agent 陷入死循环怎么办？

OpenHands 内置卡住检测（4 次重复操作后自动停止），但你也可以主动干预：

1. **Web GUI**：点击 Stop 按钮
2. **CLI**：按 `Ctrl+C`
3. **预防**：设置 `max_iterations = 30`（默认无上限）

经验法则：如果一个任务 30 步还没搞定，大概率是任务描述不够清晰或超出了当前模型的能力。拆分成更小的子任务再试。

### Ollama 本地模型各种报错

最常见的三个坑：

```bash
# 坑 1: context 太小
# 解决: 启动时设置
OLLAMA_CONTEXT_LENGTH=32768 ollama serve

# 坑 2: Docker 里访问不到 Ollama
# 解决: 用 host.docker.internal 而不是 localhost
base_url = "http://host.docker.internal:11434/v1"

# 坑 3: 模型能力不足
# 解决: 换更大的模型，至少 30B 参数
ollama pull qwen3-coder:30b
```

### 能操作我本地的文件吗？

能，但你需要显式挂载。OpenHands 默认在隔离沙箱里工作，不会碰你本地文件系统。挂载方式：

```bash
# Docker 模式
-e SANDBOX_VOLUMES="/你的项目路径:/workspace:rw"

# CLI 模式
openhands serve --mount-cwd
```

### 支持 Windows 吗？

支持，通过 WSL2。原生 Windows 不行（需要 Docker Linux 容器支持）：

```powershell
# 1. 启用 WSL2
wsl --install

# 2. 在 WSL2 里安装 Docker
# 3. 在 WSL2 里跑 OpenHands
```

### 它会不会把我的代码发到外面？

取决于你的配置：
- **自部署 + 自己的 API Key**：代码只发到你选的 LLM 提供商（跟你直接调 API 一样）
- **Cloud 版**：代码经过 OpenHands 服务器
- **本地模型（Ollama）**：代码完全不出你的机器

对代码保密性要求高的项目，推荐自部署 + Ollama 本地模型方案。

## 选型决策树

```
你需要什么？
│
├─ 日常写代码，想要 AI 实时帮助
│   → Cursor 或 Windsurf（IDE 体验最好）
│
├─ 复杂架构级改动，需要深度推理
│   → Claude Code（推理能力最强）
│
├─ 自动化修 Issue、跑 CI、无人值守任务
│   → OpenHands（唯一能 headless 跑的）
│
├─ 完全托管，不想碰任何配置
│   → Devin（全 SaaS，但贵且闭源）
│
└─ 团队统一管理，可控预算
    → OpenHands Cloud Team
```

我的建议：**不要只选一个**。最强组合是 Cursor（日常编码）+ Claude Code（复杂推理）+ OpenHands（自动化和 CI 集成）。三者解决不同层面的问题，互不冲突。

## 什么场景 OpenHands 表现最好

✅ 明确的 bug 修复（有 Issue 描述 + 复现步骤）
✅ 批量重构（统一改命名风格、升级 API）
✅ 写测试（给现有代码补单测）
✅ CI 里的自动检查和修复
✅ 文档生成

## 什么场景还不够好

❌ 需要创造性设计的全新功能（Agent 擅长执行，不擅长设计）
❌ 需要深入理解业务逻辑的复杂改动（缺少业务上下文）
❌ 前端像素级还原（浏览器虽然能打开但精确度有限）
❌ 跨多个仓库的协调改动（单项目最合适）

## 学习资源

- 官方文档：`docs.openhands.dev`
- GitHub：`github.com/OpenHands/OpenHands`（72K+ star）
- 扩展市场：`github.com/OpenHands/extensions`（47 个扩展）
- 社区 Slack：`dub.sh/openhands`
- ICLR 2025 论文：搜索 "OpenDevin: An Open Platform for AI Software Developers as Generalist Agents"
