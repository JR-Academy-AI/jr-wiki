# /preview — 本地预览网站

启动本地开发服务器预览当前内容。

## 使用方法
```
/preview
```

## 执行步骤

1. 确认在 jr-wiki 目录下
2. 确认依赖已安装（`node_modules` 存在），没有则运行 `bun install`
3. 运行 `bun run dev`
4. 告诉用户：浏览器打开 http://localhost:4321/learn-wiki/ 即可预览

## 注意事项

- 如果端口 4321 被占用，Astro 会自动换端口，注意终端输出
- Ctrl+C 停止预览
