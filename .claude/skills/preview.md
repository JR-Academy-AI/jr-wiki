# /preview — 本地预览

构建内容并启动本地预览服务器。

## 使用方法
```
/preview
```

## 执行步骤

1. 确认在 jr-wiki 目录下
2. 运行 `bun run dev`（会先 build 再启动 serve）
3. 告诉用户预览地址

## 预览地址

- 内部管理预览页: http://localhost:4321/_preview/
- manifest.json: http://localhost:4321/manifest.json
- 原始 Markdown: http://localhost:4321/content/articles/xxx.md

## 注意事项

- 这是 jr-wiki 的内容预览，不是官网页面预览
- 要看官网渲染效果，需要同时启动后端 (`jr-academy`) 和前端 (`jr-academy-web-zh`)
- Ctrl+C 停止预览
