---
title: "快速上手：部署你的第一个 AI Agent"
wiki: "openhands-guide"
order: 2
description: "三种安装方式（Docker/CLI/Cloud）、配置 LLM API Key、跑通第一个自动化任务的完整流程"
---

## 三条路，选一条

OpenHands 提供三种使用方式，按你的需求选：

| 方式 | 适合谁 | 需要什么 |
|------|--------|---------|
| Docker（推荐） | 想要完整功能 + Web GUI | Docker Desktop + API Key |
| CLI（pip 安装） | 喜欢终端工作流的开发者 | Python 3.12+ + API Key |
| Cloud 版 | 不想折腾环境 | GitHub 账号 |

## 方式一：Docker 部署（5 分钟）

这是官方推荐的方式，带完整 Web GUI 和 Docker 沙箱隔离。

**前置条件：**
- Docker Desktop 已安装并启动
- 一个 LLM API Key（推荐 Anthropic Claude 或 OpenAI）
- 至少 4GB 可用内存

```bash
docker run -it --rm --pull=always \
  -e AGENT_SERVER_IMAGE_REPOSITORY=ghcr.io/openhands/agent-server \
  -e AGENT_SERVER_IMAGE_TAG=1.19.1-python \
  -e LOG_ALL_EVENTS=true \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v ~/.openhands:/.openhands \
  -p 3000:3000 \
  --add-host host.docker.internal:host-gateway \
  --name openhands-app \
  docker.openhands.dev/openhands/openhands:1.7
```

启动后打开浏览器访问 `http://localhost:3000`，首次会弹出设置面板让你填：
1. LLM Provider（选 Anthropic / OpenAI / Google 等）
2. Model（推荐 `claude-sonnet-4-20250514` 或 `gpt-4o`）
3. API Key

填完就能开始用了。

![OpenHands CLI 模型选择](https://raw.githubusercontent.com/OpenHands/docs/main/openhands/static/img/openhands-provider-cli.png)

## 方式二：CLI 安装（终端党最爱）

不想开浏览器？CLI 模式一样强大：

```bash
# 用 uv 安装（最快）
uv tool install openhands --python 3.12

# 或者用 pip
pip install openhands-ai

# 或者一行脚本
curl -fsSL https://install.openhands.dev/install.sh | sh
```

安装完直接跑：

```bash
# 交互模式——像跟同事对话一样
openhands

# 直接给任务
openhands -t "给 src/auth.py 写单元测试，覆盖所有边界情况"

# 从文件读任务描述
openhands -f task.md

# YOLO 模式——自动批准所有操作（⚠️ 谨慎使用）
openhands --always-approve -t "升级所有依赖到最新版"
```

首次运行会要求配置 LLM，设置保存在 `~/.openhands/agent_settings.json`。

## 方式三：Cloud 版（零配置）

访问 [app.openhands.dev](https://app.openhands.dev)，用 GitHub 登录，免费版每天 10 次对话。不用装 Docker，不用管环境，打开就用。

适合：快速试用、偶尔用一下、机器配置不够跑 Docker 的情况。

## 跑通第一个任务

假设你有一个 Node.js 项目需要加一个 API endpoint。在 OpenHands GUI 里输入：

```
在 src/routes/ 下创建一个 GET /api/health endpoint，
返回 { status: "ok", timestamp: Date.now() }。
加上对应的单元测试。
```

OpenHands 会自动：
1. 读你的项目结构
2. 找到路由文件的组织方式
3. 创建新文件
4. 写测试
5. 跑 `npm test` 确认通过

你在界面上能实时看到它的每一步操作——终端命令、文件编辑、测试输出全部可见。

## 挂载本地项目

Docker 模式下想让 OpenHands 操作你本地的代码？用 `SANDBOX_VOLUMES` 环境变量：

```bash
docker run -it --rm --pull=always \
  -e SANDBOX_VOLUMES="/path/to/your/project:/workspace:rw" \
  -e AGENT_SERVER_IMAGE_REPOSITORY=ghcr.io/openhands/agent-server \
  -e AGENT_SERVER_IMAGE_TAG=1.19.1-python \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v ~/.openhands:/.openhands \
  -p 3000:3000 \
  --add-host host.docker.internal:host-gateway \
  --name openhands-app \
  docker.openhands.dev/openhands/openhands:1.7
```

CLI 模式更简单：

```bash
cd /path/to/your/project
openhands serve --mount-cwd
```

## 验证安装成功

跑一个简单任务测试所有组件是否正常：

```bash
openhands -t "在当前目录创建一个 hello.py，打印 Hello from OpenHands，然后运行它"
```

如果你看到它成功创建文件并输出 `Hello from OpenHands`，恭喜——你的 AI Agent 就位了。
