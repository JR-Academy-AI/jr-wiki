# /edit-chapter — 修改章节内容

修改已有章节的标题或内容。

## 使用方法
```
/edit-chapter [书名] [章节] [修改说明]
```

例子：
- `/edit-chapter prompt-engineering 第2章 把标题改成"Prompt基础技巧与模板"`
- `/edit-chapter prompt-engineering 02 在末尾加一个实战练习`
- `/edit-chapter aws入门 第1章 重写开头段落，更通俗易懂`

## 执行步骤

1. 根据书名找到对应文件夹（支持中文名模糊匹配）
2. 根据章节号找到对应 md 文件（支持 "第2章"、"02"、章节标题 等方式匹配）
3. 读取当前内容展示给用户确认
4. 按照修改说明进行修改
5. 展示修改前后对比
6. 提醒用 `/publish` 发布或 `/preview` 预览

## 规则

- 不要改动 frontmatter 的 `wiki` 和 `order` 字段（除非用户明确要求调整顺序）
- 修改标题时同步更新 frontmatter 的 `title`
- 保持 Markdown 格式规范
- 禁止模版化/AI味内容
