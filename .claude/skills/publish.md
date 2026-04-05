# /publish — 发布内容到线上

把当前修改提交并推送到线上。Push 到 main 后 GitHub Actions 自动构建部署到 nginx。

## 使用方法
```
/publish [说明]
```

例子：
- `/publish`
- `/publish 新增了AWS入门电子书`
- `/publish 修改了prompt工程第3章内容`

## 执行步骤

1. 运行 `bun run build` 确认构建没有错误
2. 运行 `git status` 查看有哪些修改
3. 用 `git add` 只添加 `src/content/` 和 `public/images/` 下的文件变更
4. 生成提交信息
5. `git commit` 提交
6. `git push origin main` 推送
7. **判断是否需要同步元数据到数据库**（见下方规则）
8. 告诉用户结果

## 是否需要 sync？

### 不需要 sync（只改了内容）

修改已有 .md 文件的正文 → push 后 nginx 部署 → 官网自动读到新内容。

告诉用户：
> ✅ 已推送。nginx 部署后（2-3 分钟）官网自动显示新内容，不需要额外操作。

### 需要 sync（新增/删除/改元数据）

以下情况需要运行 sync 把元数据更新到 MongoDB：
- **新增**了 .md 文件（新文章、新章节、新故事）
- **删除**了 .md 文件
- **修改**了 frontmatter 中的 title、description、tags（元数据变了）

告诉用户：
> ✅ 已推送。因为新增/删除了内容，需要同步元数据到数据库：
> ```bash
> ADMIN_TOKEN=xxx bun run sync
> ```
> 如果是生产环境：
> ```bash
> ADMIN_TOKEN=xxx API_URL=https://api.jiangren.com.au bun run sync
> ```

## 提交信息格式

```
content: {一句话描述}
```

例如：`content: 新增 AWS 入门电子书前3章`

## 注意事项

- 只提交内容文件（md、yaml、图片），不提交代码文件
- 构建失败时停下来告诉用户哪里出了问题
- 推送前确认当前在 main 分支
