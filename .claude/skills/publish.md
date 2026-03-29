# /publish — 发布内容到线上

把当前修改提交并推送到线上。Push 到 main 后 GitHub Actions 自动构建部署。

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
4. 生成提交信息（如果用户提供了说明就用用户的，否则自动生成）
5. `git commit` 提交
6. `git push origin main` 推送
7. 告诉用户：已推送，GitHub Actions 会自动部署，2-3分钟后线上更新
8. 提供线上地址供检查

## 提交信息格式

```
content: {一句话描述}
```

例如：`content: 新增 AWS 入门电子书前3章`

## 注意事项

- 只提交内容文件（md、yaml、图片），不提交代码文件
- 构建失败时停下来告诉用户哪里出了问题
- 推送前确认当前在 main 分支
