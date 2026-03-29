# /list-content — 查看所有内容

列出所有电子书和章节，以及它们的线上地址。

## 使用方法
```
/list-content
```

或查看特定电子书：
```
/list-content [书名]
```

## 执行步骤

1. 扫描 `src/content/wiki/` 下所有文件夹
2. 读取每本书的 `_meta.yaml` 获取标题和描述
3. 列出每本书下的所有章节（读 frontmatter 获取标题）
4. 以表格形式展示：

### 输出格式

```
📚 电子书列表

1. Prompt Engineering 入门
   线上地址: jiangren.com.au/learn-wiki/prompt-engineering/
   章节:
   - 第1章: 什么是Prompt → /learn-wiki/prompt-engineering/01-what-is-prompt/
   - 第2章: 基础技巧 → /learn-wiki/prompt-engineering/02-basic-techniques/
   - 第3章: 高级模式 → /learn-wiki/prompt-engineering/03-advanced-patterns/

2. ...
```

同时扫描其他内容类型：
- `src/content/articles/` — 文章
- `src/content/help/` — 帮助中心
- `src/content/stories/` — 学员故事
