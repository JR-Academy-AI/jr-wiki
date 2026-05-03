---
title: "注册 Jules、连接 GitHub 与第一个异步任务"
wiki: "jules-guide"
order: 2
description: "5 分钟注册 Jules、连接 GitHub 仓库、配置环境快照、跑通第一个异步编程任务"
---

## 注册和登录

Google Jules 目前只支持个人 Google 账号（@gmail.com），Google Workspace 企���账号暂不支持。打开 [jules.google](https://jules.google)，用 Google ��号登录即可。

![Jules 入门教程](https://img.youtube.com/vi/LWqxbq2smp0/maxresdefault.jpg)

免费用户的额度已经相当大方：

| 免费额度 | 说明 |
|---------|------|
| 每日任务数 | 15 个（滚动 24 小时窗口） |
| 并发任务数 | 3 个（同时跑 3 个任务） |
| 模型 | Gemini 系列 |
| 信用卡 | 不需要 |

15 个任务/天足够完成本教程所有练习。用完了就等第二天，不花一分钱。

## 连接 GitHub 仓库

登录后第一步是连接 GitHub：

1. 点击仓库选择器或 "Connect Repository"
2. 通过 OAuth 授权 Jules 访问你的 GitHub 账号
3. 安装 **Jules GitHub App**——这不只是 OAuth，需要作为 GitHub App 安装到你的账号或组织
4. 选择授权范围：全部仓库或指定仓库

```bash
# 确认 Jules GitHub App 已安装：
# GitHub → Settings → Applications → Installed GitHub Apps
# 找到 "Jules" → 确认有权访问目标仓库

# 注意事项：
# - 需要仓库写入权限才能创建 PR
# - 私有仓库也支持
# - 随时可在仓库选择器底部 "+Add repository" 添加新仓库
```

## 配置环境快照（Environment Snapshot）

Jules 每次任务都在全新 Ubuntu VM 里跑，预装了 Node.js、Python、Go、Rust、Java 和 Docker。但你的项目可能有特殊依赖，每次从零安装太慢。环境快照帮你解决这个问题。

在 Dashboard 左侧栏选仓库 → 点 "Configuration" → 找到 "Initial Setup" 输入框：

```bash
# 前端项目示例
npm install && npm run build && npm run test

# Python 项目示例
pip install -r requirements.txt && pytest --co

# Ruby 项目示例
bundle install && rails db:setup

# 验证命令（建议加上，确认环境正确）
node -v && npm -v
```

点 **"Run and Snapshot"**，Jules 执行这些命令后自动保存环境快照。之后该仓库的所有任务都会从快照启动，跳过重复安装。

**踩坑提醒**：**绝对不要**在 Setup Script 里放 `npm run dev` 或 `rails server` 这类长期运行的命令——它们永远不会结束，Jules 会一直卡住。只放安装、构建、测试这些有明确结束的命令。

## 写 AGENTS.md（强烈推荐）

在仓库根目录创建 `AGENTS.md`，Jules 会自动读取它来理解你的项目。这是提升任务成功率最有效的一步：

```markdown
# AGENTS.md

## 项目概述
Express + TypeScript API 服务，PostgreSQL 数据库，Redis 缓存

## 常用命令
- 安装依赖：`npm install`
- 运行测试：`npm test`
- 构建：`npm run build`
- Lint：`npm run lint`

## 代码规范
- TypeScript strict mode
- 单引号，无分号
- 函数式风格，避免 class
- 用 Zod 做运行时校验

## 测试
- 框架：Vitest
- 测试文件放在 `__tests__/` 目录
- Mock 外部 API 调用
```

控制在 150 行以内，命令用反引号包裹方便 Agent 直接复制执行。子目录也可以放自己的 `AGENTS.md`。

## 第一个任务：给函数加单元测试

选好仓库和分支，在任务输入框写：

```
给 src/utils/formatDate.ts 中的 formatDate 和 parseDate 函数
添加 Vitest 单元测试，覆盖以下场景：
- 正常日期格式化
- 边界值（空字符串、null、undefined）
- 不同时区
测试文件放在 src/utils/__tests__/formatDate.test.ts
```

点 **"Give me a plan"**，Jules 会在几秒内返回一个执行计划：要创建哪些文件、写哪些测试用例、预期结果是什么。**认真看计划**——这是你发现误解的最后机会。满意就点 Approve，Jules 开始在云端 VM 里执行。

执行过程中你可以关掉浏览器去干别的。完成后 Jules 会在 Dashboard 显示完成状态，点进去看 diff，没问题就点 **"Publish PR"**——一个标准的 GitHub Pull Request 就创建好了。

整个过程你只花了 2 分钟写 prompt + 1 分钟审计划 + 2 分钟审 PR，中间的执行时间你在干别的事。这就是异步的威力。
