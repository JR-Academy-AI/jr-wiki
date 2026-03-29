# /add-chapter — 给电子书添加新章节

给已有的电子书添加一个新章节。

## 使用方法
```
/add-chapter [书名或slug] [章节标题] [内容描述]
```

例子：
- `/add-chapter prompt-engineering 实战案例 用3个真实场景演示prompt技巧`
- `/add-chapter aws入门 S3存储服务 讲解S3的基本概念和操作`

## 执行步骤

1. 找到对应的书籍文件夹（支持中文书名模糊匹配或英文 slug）
2. 查看已有章节，确定新章节的序号和 order
3. 创建新的 markdown 文件，如 `04-practical-examples.md`
4. 填入 frontmatter（title、wiki、order、description）
5. 如果用户提供了内容描述，生成初始内容框架
6. 显示结果，提醒用 `/preview` 预览或 `/publish` 发布

## 规则

- 文件名格式：`{序号}-{英文slug}.md`，如 `04-practical-examples.md`
- frontmatter 的 `wiki` 字段必须和文件夹名完全一致
- order 按顺序递增
- 内容遵循 CONTENT_GUIDE.md 的 Markdown 格式要求
- 禁止模版化/AI味内容（参考主项目 CLAUDE.md 的反模版规则）
