---
title: "GitHub Actions 与 CI/CD 自动化：让 Kiro 跑在流水线里"
wiki: "kiro-guide"
order: 6
description: "Kiro 无头模式（Headless Mode）实战：KIRO_API_KEY 配置、GitHub Actions 集成、PR 自动审查、定时任务"
---

## 为什么要把 Kiro 放进 CI/CD

第 4 章介绍的 CLI `--headless` 模式只是冰山一角。Kiro 无头模式真正的价值在于：**让 AI Agent 变成 CI/CD 流水线的一个环节**，自动跑在每次 PR、每周定时、每次部署里——不需要人盯着。

典型场景：

- PR 提交时自动跑安全 review，发现问题直接评论
- 每周一自动升级依赖，开 PR 等你合并
- Terraform plan 产出后，Kiro 自动生成人可读的 summary 评论到 PR
- 测试失败时 Kiro 自动诊断并尝试修复

## Headless 模式：无浏览器运行 Kiro

### 获取 API Key

去 [kiro.dev](https://kiro.dev) → Settings → API Keys → 生成一个 key，格式类似 `kiro-xxxxxxxx`。

在 GitHub 仓库的 Settings → Secrets and variables → Actions 里加一条 `KIRO_API_KEY`，值就是这个 key。**永远不要把 API key 硬编码进 workflow 文件或提交到代码库。**

### CLI 无头模式基本用法

```bash
# 设置环境变量后，CLI 跳过浏览器登录
export KIRO_API_KEY=kiro-xxxxxxxx

# 无头模式执行一次性任务
kiro chat --headless "Analyze the test failures in the last run and suggest fixes"

# 指定自定义 Agent（如果你有 .kiro/agents/ 目录下的 agent 定义）
kiro chat --agent security-reviewer --no-interactive \
  --trust-tools=read,shell \
  "Review the diff in git and flag any security issues"

# 实用标志
# --no-interactive    跳过所有交互提示，自动确认
# --trust-tools=read,shell   预授权工具，避免中途弹出确认
# --headless          无头标志（设置了 KIRO_API_KEY 会自动激活）
```

> **注意**：CI 环境必须加 `KIRO_LOG_NO_COLOR=1`，否则 ANSI 颜色转义符会把 log 输出变成乱码，贴到 GitHub 评论里尤其难看。

## GitHub Actions 集成方案

### 方案 A：kiro-action（推荐）

[kiro-action](https://github.com/karancode/kiro-action) 是最简单的上手方式。它让你在 issue 评论里打 `/kiro` 触发 Agent，或者给 issue 打标签自动处理：

```yaml
# .github/workflows/kiro.yml
name: Kiro Agent

on:
  issue_comment:
    types: [created]
  issues:
    types: [labeled]
  schedule:
    - cron: "0 1 * * 1"  # 每周一 01:00 UTC（澳洲 AEST 11:00）

jobs:
  kiro:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: kirodotdev-labs/kiro-action@v0
        with:
          kiro_api_key: ${{ secrets.KIRO_API_KEY }}
          trigger_phrase: "/kiro"      # issue 评论里触发词
          label_trigger: "kiro-fix"    # issue 标签触发
```

配置好之后：
- 在任何 PR 评论 `/kiro fix this` → Kiro 读上下文、修改代码、开 PR
- 给 issue 打上 `kiro-fix` 标签 → Kiro 自动分析并实现
- 每周一自动跑定时任务（比如依赖升级）

### 方案 B：setup-kiro-action + 自定义工作流

[setup-kiro-action](https://github.com/clouatre-labs/setup-kiro-action) 只负责安装 Kiro CLI，你自己写后续逻辑，更灵活：

```yaml
# .github/workflows/kiro-pr-review.yml
name: Kiro PR Security Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  security-review:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    env:
      KIRO_API_KEY: ${{ secrets.KIRO_API_KEY }}
      KIRO_LOG_NO_COLOR: "1"           # 去掉颜色转义符
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0               # 需要完整历史才能做 diff

      - name: Setup Kiro CLI
        uses: clouatre-labs/setup-kiro-action@v1
        with:
          version: "latest"

      - name: Run Kiro Security Review
        id: review
        run: |
          git diff origin/${{ github.base_ref }}...HEAD > /tmp/pr_diff.txt
          
          REVIEW=$(kiro chat --headless --no-interactive \
            --trust-tools=read \
            "Read /tmp/pr_diff.txt and identify security vulnerabilities, injection risks, \
            hardcoded secrets, and insecure patterns. Return a markdown list, one issue per line. \
            If none found, say 'No security issues found.'")
          
          echo "review_output<<EOF" >> $GITHUB_OUTPUT
          echo "$REVIEW" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Post Review Comment
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Kiro 安全 Review\n\n${{ steps.review.outputs.review_output }}`
            })
```

### 方案 C：定时任务——每周自动升级依赖

```yaml
# .github/workflows/weekly-deps.yml
name: Weekly Dependency Upgrade

on:
  schedule:
    - cron: "0 22 * * 0"  # 每周日 22:00 UTC（AEST 周一 08:00）
  workflow_dispatch:       # 也支持手动触发

jobs:
  upgrade:
    runs-on: ubuntu-latest
    env:
      KIRO_API_KEY: ${{ secrets.KIRO_API_KEY }}
      KIRO_LOG_NO_COLOR: "1"
    steps:
      - uses: actions/checkout@v4
      - uses: clouatre-labs/setup-kiro-action@v1

      - name: Kiro 升级依赖
        run: |
          kiro chat --headless --no-interactive \
            --trust-tools=read,shell,write \
            "Check for outdated npm packages using npm outdated. \
             For minor and patch updates, update package.json and run npm install. \
             For major updates, only update if there are no breaking changes based on changelogs. \
             Run npm test afterwards to verify nothing broke."

      - name: 开 PR
        uses: peter-evans/create-pull-request@v6
        with:
          title: "chore: weekly dependency upgrade (Kiro)"
          branch: "kiro/weekly-deps-${{ github.run_number }}"
          commit-message: "chore: auto dependency upgrade"
          body: "由 Kiro 自动升级依赖，请检查 CHANGELOG 后合并。"
```

## 实用 Agent Hooks → CI 的联动

Agent Hooks（第 3 章介绍）和 GitHub Actions 可以配合：Hook 在本地开发时触发，GitHub Actions 在 CI 里跑相同逻辑——两边对齐，不会出现"本地过了 CI 挂"的情况。

```json
// .kiro/hooks/security-check.kiro.hook
{
  "title": "保存时安全扫描",
  "when": {
    "type": "fileSaved",
    "patterns": ["src/**/*.ts", "src/**/*.js"]
  },
  "instruction": "扫描修改的文件，检查 SQL 注入、XSS、硬编码密钥。发现问题给出具体行号和修复建议。"
}
```

CI 里跑同样的逻辑（只是针对整个 diff 而不是单个文件），确保本地和 CI 检查一致。

## 踩坑备忘

| 问题 | 现象 | 解决 |
|------|------|------|
| 颜色转义符乱码 | PR 评论里出现 `\e[32m` 等字符 | 加 `KIRO_LOG_NO_COLOR=1` |
| `--headless` 还要登录 | 没读到 `KIRO_API_KEY` | 检查 secret 名称是否完全一致 |
| SIGV4 认证失败 | setup-kiro-action 的 `enable-sigv4` 报错 | 该功能目前（2026 年）仍未完全实现，用 `KIRO_API_KEY` 代替 |
| 工具授权弹出 | CI 卡住等待确认 | 加 `--trust-tools=read,shell,write` 预授权 |
| 长任务超时 | workflow 跑 6 小时超限 | 拆成多个步骤，每步一个 `kiro chat` 调用 |
