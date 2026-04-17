---
title: "CI 自动同步 Pipeline 测试 2026-04-18"
description: "验证 jr-wiki push 到 main 后 GitHub Actions 自动 sync 到 MongoDB，后端读 GitHub raw 渲染为 /blog/ 页面。"
publishDate: 2026-04-18
tags:
  - internal-test
author: "JR Academy"
---

这是一篇测试文章，用于验证 jr-wiki 的 CI 自动同步流水线。

如果你能看到这篇内容，说明以下链路全部打通：

1. `src/content/articles/*.md` 在 jr-wiki 仓库
2. push 到 main 触发 GitHub Actions
3. Actions 里 `bun run build.ts` 生成 `dist/manifest.json`
4. Actions 里 `bun run sync-to-db.ts` 把元数据 POST 到 `api.jiangren.com.au/admin-cms/posts/sync/jr-wiki`
5. 后端 upsert `posts` 集合（source=jr-wiki，带 contentUrl）
6. 用户访问 `/blog/test-sync-pipeline-2026-04-18` → 后端查 DB → fetch GitHub raw .md → markdown → HTML

测试完成后可以从 Admin 后台删除本文。
