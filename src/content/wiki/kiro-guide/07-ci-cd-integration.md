---
title: "CI/CD 集成：把 Kiro CLI 接进自动化管道"
wiki: "kiro-guide"
order: 7
description: "Kiro Headless 模式原理、GitHub Actions setup-kiro-cli、KIRO_API_KEY 无头认证、自定义 Code Review Agent、Global Hooks 在 CI 中的用法——真实 pipeline 配置全解"
---

## 为什么要在 CI/CD 里用 Kiro

Kiro 不只是一个 IDE 插件，它的 CLI 支持**无头模式（Headless Mode）**——不需要打开 IDE、不需要人工交互，直接在 CI/CD 管道里让 AI Agent 跑任务。

常见的 CI/CD 集成场景：

| 场景 | 传统做法 | Kiro CLI 做法 |
|------|---------|--------------|
| PR 代码审查 | 等人工 review | AI 自动扫描 bug / 安全问题 / 规范违反 |
| 测试失败 | 开发者手动排查 | AI 分析失败原因 + 提出修复方案 |
| 文档更新 | 靠人记得更新 | API 变更时 AI 自动更新 OpenAPI + README |
| 依赖安全扫描 | Dependabot 只看版本 | AI 分析实际影响 + 给出升级方案 |

## Headless 模式：无头运行的核心

Kiro CLI 的 `--headless` 标志让 Agent 在无人值守的环境里工作：

```bash
# 本地测试 headless 模式
kiro chat --headless "Run all tests, identify failing ones, and suggest fixes"

# 带具体任务的 headless
kiro chat --headless "Review changes in git diff HEAD~1 for security vulnerabilities"

# 限制执行时间（防止 CI 超时）
kiro chat --headless --timeout 300 "Update CHANGELOG.md based on commits since last tag"
```

Headless 模式下，Kiro：
1. 不显示交互式 UI，只输出结构化结果
2. 所有文件操作自动批准（相当于 Autopilot 开启）
3. 遇到歧义时优先保守——不改而不是猜

## GitHub Actions 集成

官方维护的 `setup-kiro-cli` Action 在 GitHub Marketplace 可用，一行配置安装 Kiro CLI：

```yaml
# .github/workflows/kiro-review.yml
name: Kiro AI Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  ai-review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0   # 拿到完整 git 历史，Kiro 需要 diff 上下文
      
      - name: Setup Kiro CLI
        uses: kirodotdev/setup-kiro-cli@v1
      
      - name: Run Kiro Code Review
        env:
          KIRO_API_KEY: ${{ secrets.KIRO_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          kiro chat --headless "
            Review the changes in this PR (git diff origin/main...HEAD).
            Check for:
            1. Security vulnerabilities (XSS, injection, hardcoded secrets)
            2. Violations of our coding standards in AGENTS.md
            3. Missing test coverage for changed functions
            4. Breaking API changes without version bump
            
            Output a markdown report with findings grouped by severity (HIGH/MEDIUM/LOW).
            If no issues found, output 'LGTM: No issues found.'
          " > review-output.md
      
      - name: Post Review Comment
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const review = fs.readFileSync('review-output.md', 'utf8');
            if (!review.includes('LGTM')) {
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: `## Kiro AI Review\n\n${review}`
              });
            }
```

### KIRO_API_KEY：跳过浏览器登录

在 CI 环境里没有浏览器，设置 `KIRO_API_KEY` 环境变量后，Kiro CLI 直接跳过 OAuth 流程：

```bash
# 在 kiro.dev 账户设置里生成 API Key
# 复制到 GitHub Secrets: Settings → Secrets → Actions → New repository secret
# Name: KIRO_API_KEY

# 本地验证配置是否正确
KIRO_API_KEY=your-key kiro chat --headless "echo hello"
```

API Key 权限继承你的 Kiro 账户配额——Team Plan 下可以共享一个 Organization-level Key，避免每个成员单独管理。

## 自定义 CI Agent：复用项目的 Steering 上下文

CI 里跑的 Kiro 同样会读取仓库里的 `.kiro/steering/` 和 `AGENTS.md`——这意味着你在 IDE 里配的规范，在 CI 里也生效：

```yaml
# .github/workflows/kiro-doc-sync.yml
name: Kiro Doc Sync

on:
  push:
    paths:
      - 'services/api/routes/**'   # 只在 API 路由改变时触发

jobs:
  sync-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: kirodotdev/setup-kiro-cli@v1
      
      - name: Sync OpenAPI Spec
        env:
          KIRO_API_KEY: ${{ secrets.KIRO_API_KEY }}
        run: |
          kiro chat --headless "
            API route files were modified (see git diff HEAD~1).
            Read the current OpenAPI spec at docs/openapi.yaml.
            Update it to reflect all changes: new endpoints, modified schemas, removed routes.
            Follow the OpenAPI 3.1 standard and the API conventions in .kiro/steering/api-conventions.md.
          "
      
      - name: Commit Updated Docs
        run: |
          git config user.name "Kiro Bot"
          git config user.email "kiro-bot@company.com"
          git add docs/openapi.yaml
          git diff --cached --quiet || git commit -m "docs: sync OpenAPI spec [skip ci]"
          git push
```

## 自定义 Agent：把 CI 任务封装成可复用模块

`.kiro/agents/` 目录里可以定义自定义 Agent，在 CI 和 IDE 里都可以调用：

```markdown
<!-- .kiro/agents/security-reviewer.md -->
# Security Reviewer Agent

你是一个专注安全的代码审查 Agent。

## 检查清单

每次审查必须检查：

1. **注入漏洞**：SQL 注入、命令注入、路径穿越
2. **认证鉴权**：未授权端点、JWT 校验缺失、越权访问
3. **敏感数据**：硬编码的 key/token、日志里的个人信息
4. **依赖安全**：直接依赖的 CVE（检查 package.json 改动）

## 输出格式

按 CRITICAL / HIGH / MEDIUM / LOW 分组，每条包含：
- 文件路径和行号
- 漏洞类型
- 具体风险说明
- 修复建议（带代码示例）

如果没有发现问题，输出：`✅ No security issues found in reviewed changes.`
```

在 GitHub Actions 里调用这个自定义 Agent：

```yaml
- name: Security Review
  env:
    KIRO_API_KEY: ${{ secrets.KIRO_API_KEY }}
  run: |
    kiro chat --headless --agent security-reviewer \
      "Review the following changes for security issues: $(git diff origin/main...HEAD)"
```

## Global Hooks 在 CI 环境的注意事项

CI runner 是全新的容器，没有 `~/.kiro/hooks/`（全局 hook）。项目级 hook（`.kiro/hooks/`）随仓库克隆会带过来，但 CI 里不会自动触发 file-save 事件——hook 的触发条件在 CI 里不生效。

正确的做法是：**把需要在 CI 执行的操作明确写进 workflow 步骤**，而不是依赖 hook 触发：

```yaml
# ❌ 错误：CI 里 hook 不会触发
# 不要把 CI 任务只写在 .kiro/hooks/ 里

# ✅ 正确：在 workflow 里显式调用
- name: Update Changelog
  run: kiro chat --headless "Generate CHANGELOG entry from commits since last tag"
```

## 完整 CI 管道示例

一个把 Kiro 深度集成进开发流程的完整配置：

```yaml
# .github/workflows/kiro-full.yml
name: Kiro Full Pipeline

on:
  pull_request:
    types: [opened, synchronize, ready_for_review]

jobs:
  # 1. 代码审查（PR 创建或更新时）
  code-review:
    if: github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: kirodotdev/setup-kiro-cli@v1
      - name: AI Code Review
        env:
          KIRO_API_KEY: ${{ secrets.KIRO_API_KEY }}
        run: |
          kiro chat --headless --agent security-reviewer \
            "Check git diff origin/${{ github.base_ref }}...HEAD" \
            > security-review.md
          
          kiro chat --headless \
            "Review git diff origin/${{ github.base_ref }}...HEAD for code quality.
             Reference our standards in .kiro/steering/ and AGENTS.md.
             Focus on: logic bugs, missing error handling, test coverage gaps." \
            > quality-review.md

  # 2. 测试失败时 AI 分析（在 test job 失败后运行）
  ai-test-diagnosis:
    needs: [run-tests]
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: kirodotdev/setup-kiro-cli@v1
      - name: Download Test Logs
        uses: actions/download-artifact@v4
        with:
          name: test-logs
      - name: Diagnose Failures
        env:
          KIRO_API_KEY: ${{ secrets.KIRO_API_KEY }}
        run: |
          kiro chat --headless \
            "Analyze these test failures and suggest fixes:
             $(cat test-output.log)
             
             Context: Changes in this PR are: $(git diff origin/main...HEAD --stat)" \
            > diagnosis.md
          cat diagnosis.md  # 输出到 CI 日志，方便开发者直接查看
```

## 成本控制：CI 里的 Kiro 用量

CI 里的 Kiro 调用消耗 API token——在高频 PR 的团队里要注意控制：

```yaml
# 只在 ready_for_review（不是 draft）时跑 AI Review
on:
  pull_request:
    types: [ready_for_review]  # 不要用 opened, synchronize

# 或者只在关键路径改变时触发
on:
  pull_request:
    paths:
      - 'services/**'
      - 'packages/**'
    # 排除文档和配置
    paths-ignore:
      - '**.md'
      - '.github/**'
      - 'docs/**'
```

Team Plan 用户可以在 kiro.dev 控制台设置每月 CI 用量上限，超额自动中断而不是继续扣费。
