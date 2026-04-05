---
title: "npm 发布安全指南：从 Claude Code 源码泄露学到的 5 个教训"
description: "Anthropic Claude Code 512K 行源码因 npm 打包失误泄露。本文分析泄露原因，提供 npm 发布安全检查清单、.npmignore 配置、package.json files 字段最佳实践，帮你避免同样的错误。"
publishDate: 2026-04-05
tags:
  - npm
  - security
  - devops
  - claude-code
  - best-practices
author: "JR Academy"
keywords: "npm发布安全, npmignore配置, package.json files, Claude Code泄露, npm包安全, source map泄露, npm安全最佳实践"
---

![npm 包发布安全与 Claude Code 源码泄露分析](https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80)

## npm 包发布安全：一个配置失误的代价

3 月 31 日，Anthropic 的 Claude Code——一个月活数百万的 AI 编程助手——的完整源码被发现公开在了 npm 公共仓库上。512,000 行 TypeScript 代码，1,906 个文件，包含 44 个未发布功能的 feature flag 和内部模型代号。原因？发布时漏了一个 `.npmignore` 配置。

这不是什么高深的供应链攻击，也不是零日漏洞。就是一个工程师忘了排除 source map 文件。但后果是 GitHub 历史上增长最快的 repo——2 小时内 5 万星。

如果 Anthropic 这种级别的公司都会犯这个错，你的项目也有可能。这篇文章不是要嘲笑谁，而是帮你检查自己的发布流程有没有同样的漏洞。

---

## 为什么你应该关注 npm 发布安全

npm 生态每天处理超过 20 亿次下载。你发布到 npm 的任何东西都是**永久公开**的——即使你在几分钟内 unpublish，自动化爬虫和镜像已经抓走了。

常见的泄露内容：
- **Source map 文件**（`.map`）：完整的原始源码，包括注释
- **环境变量文件**（`.env`、`.env.local`）：API 密钥、数据库密码
- **构建产物和缓存**（`.next/`、`dist/debug/`）：可能包含调试信息
- **测试文件和 fixtures**：可能包含真实数据
- **内部文档**：架构设计、安全审计报告

Claude Code 泄露的核心链条是：Bun 构建 → 默认生成 `.map` 文件 → `.map` 引用 R2 上的 zip → zip 包含完整源码 → npm publish 没排除 `.map` → 全球可见。

---

## 实操指南：5 步加固你的 npm 发布流程

### 第 1 步：用 `files` 字段做白名单，而不是用 `.npmignore` 做黑名单

Claude Code 泄露的根本原因是黑名单思维——"我要排除哪些文件"。但你永远无法列举所有不该发布的文件。

**正确做法**：在 `package.json` 里用 `files` 字段做白名单，只包含你明确知道该发布的文件：

```json
{
  "name": "your-package",
  "files": [
    "dist/**/*.js",
    "dist/**/*.d.ts",
    "README.md",
    "LICENSE"
  ]
}
```

注意：`files` 字段**不会排除** `package.json`、`README.md`、`LICENSE` 和 `CHANGELOG.md`——这些永远会被包含。但其他所有文件默认被排除。

### 第 2 步：发布前用 `npm pack --dry-run` 检查

这是最简单也最容易被忽略的一步。在 `npm publish` 之前，先看看到底会发布什么：

```bash
# 列出所有会被打包的文件
npm pack --dry-run

# 或者生成 tarball 然后手动检查
npm pack
tar -tzf your-package-1.0.0.tgz
```

把这个命令加入你的 CI/CD 流程，用脚本自动检查是否有敏感文件：

```bash
#!/bin/bash
# scripts/check-publish.sh
SENSITIVE_PATTERNS=("*.map" "*.env" ".env*" "*.pem" "*.key" "*secret*" "*credentials*")

FILES=$(npm pack --dry-run 2>&1)

for pattern in "${SENSITIVE_PATTERNS[@]}"; do
  if echo "$FILES" | grep -q "$pattern"; then
    echo "❌ 发现敏感文件: $pattern"
    exit 1
  fi
done

echo "✅ 发布内容检查通过"
```

### 第 3 步：显式禁用 source map 生成

不管你用什么构建工具，生产发布时都应该显式关闭 source map：

```javascript
// webpack.config.js
module.exports = {
  mode: 'production',
  devtool: false, // 不要用 'source-map' 或 'hidden-source-map'
};

// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: false,
  },
});

// tsconfig.json
{
  "compilerOptions": {
    "sourceMap": false,
    "declarationMap": false
  }
}
```

如果你用 Bun（Claude Code 的构建工具）：

```bash
# bun build 默认生成 source map，必须显式关闭
bun build --no-sourcemap ./src/index.ts --outdir ./dist
```

### 第 4 步：添加 prepublishOnly 钩子做自动检查

在 `package.json` 里加一个发布前的自动检查脚本：

```json
{
  "scripts": {
    "prepublishOnly": "npm run build && npm run test && node scripts/check-no-secrets.js"
  }
}
```

```javascript
// scripts/check-no-secrets.js
const { execSync } = require('child_process');

const output = execSync('npm pack --dry-run 2>&1', { encoding: 'utf8' });
const lines = output.split('\n');

const forbidden = ['.map', '.env', '.pem', '.key', 'secret', 'credential', '.DS_Store'];
const violations = [];

for (const line of lines) {
  for (const pattern of forbidden) {
    if (line.toLowerCase().includes(pattern)) {
      violations.push(line.trim());
    }
  }
}

if (violations.length > 0) {
  console.error('🚫 以下文件不应该被发布:');
  violations.forEach(v => console.error(`  - ${v}`));
  process.exit(1);
}

console.log('✅ npm 包内容安全检查通过');
```

### 第 5 步：在 CI 中加入发布内容审计

GitHub Actions 示例：

```yaml
# .github/workflows/publish-audit.yml
name: Publish Audit
on:
  pull_request:
    paths:
      - 'package.json'
      - '.npmignore'
      - 'tsconfig.json'

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - name: Check publish contents
        run: |
          npm pack --dry-run 2>&1 | tee pack-contents.txt
          if grep -E '\.(map|env|pem|key)$' pack-contents.txt; then
            echo "::error::发现不应发布的敏感文件"
            exit 1
          fi
```

---

## 常见问题

### `.npmignore` 和 `package.json` 的 `files` 字段冲突时谁优先？

如果 `files` 字段存在，它的优先级最高。`.npmignore` 只在没有 `files` 字段时生效。**最佳实践是只用 `files`，不用 `.npmignore`**——白名单永远比黑名单安全。

### 我的 npm 包已经发布了敏感文件怎么办？

1. 立即 `npm unpublish your-package@affected-version`（72 小时内可操作）
2. 轮换所有可能泄露的密钥和凭证
3. 检查 npm 镜像和 CDN 缓存（unpkg、jsDelivr 等）是否仍有缓存
4. 修复配置后发布新版本

注意：npm 的 unpublish 政策是 72 小时内可以撤回，但自动化爬虫可能在几分钟内就已经备份了你的包。**预防永远比补救重要。**

### source map 到底会暴露什么？

Source map 是构建产物到原始源码的完整映射。一个 `.map` 文件通常包含：
- 完整的原始源代码（包括注释）
- 文件路径和目录结构
- 变量名、函数名（即使代码被混淆了）
- 有时还包含内联的 source content

Claude Code 的情况更极端——source map 指向了一个外部 zip 包，里面是未经任何处理的完整 TypeScript 源码。

---

## JR Academy 相关资源

- [Claude Code 工作流指南](https://jiangren.com.au/blog/claude-code-workflow) — 了解 Claude Code 的正确打开方式
- [JR Academy DevOps 课程](https://jiangren.com.au/course/devops) — 系统学习 CI/CD、安全发布流程和云原生部署
- [Gemma 4 开发者指南](/content/articles/gemma-4-developer-guide) — 用开源模型构建你的 AI 应用

---

*这篇文章由 Claude Code 源码泄露事件启发。安全不是事后补救的东西，是发布流程的一部分。花 10 分钟检查你的 npm 发布配置，总好过花 10 天做危机公关。*
