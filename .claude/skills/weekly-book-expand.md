# /weekly-book-expand — 每周电子书扩章

给已有的电子书自动补充新章节，搜索最新实践和案例保持内容更新。

## 使用方法
```
/weekly-book-expand
/weekly-book-expand prompt-engineering
```

## 执行步骤

### Step 1: 选择要扩展的书

如果用户没指定，自动选择：
1. 扫描 `src/content/wiki/` 下所有电子书
2. 读取每本书的 _meta.yaml 和章节数
3. 优先扩展：章节最少的 > 最近没更新的 > 最热门标签的

### Step 2: 分析现有内容

读取目标书的所有章节：
- 已经覆盖了哪些主题
- 缺少什么（对比行业标准教程目录）
- 哪些章节内容已经过时

### Step 3: 搜索最新内容

根据书的主题搜索：
```
1. "{主题} latest best practices 2026"
2. "{主题} new features updates"
3. "{主题} advanced techniques tutorial"
4. "{主题} 最新 教程 实战"
5. "{主题} common mistakes pitfalls"
```

WebFetch 读取高质量来源。

### Step 4: 生成新章节

创建 1-2 个新章节文件，接在现有章节后面：

```yaml
---
title: "{新章节标题}"
wiki: "{book-slug}"
order: {接着上一章的 order + 1}
description: "{一句话}"
---
```

新章节的选题方向：
- **最新实践** — 该领域最近 3 个月的新发展
- **实战案例** — 真实项目中的应用场景
- **常见坑** — 踩过的坑和解决方案
- **进阶技巧** — 现有章节没覆盖的高级用法

每章 500-1000 字，必须有代码/配置示例。

### Step 5: 发布

```bash
git add src/content/wiki/{book-slug}/
git commit -m "content: {书名} 新增第{N}章 — {章节标题}"
git push origin main
```

提醒：
> 新章节已添加！
> `/wiki/{book-slug}` 侧边栏会自动显示新章节
> 需要运行: `ADMIN_TOKEN=xxx bun run sync`

## 规则

- 新章节必须和已有内容互补，不重复
- 引用的技术必须是最新的（不引用过时的 API/工具版本）
- 每章至少 1 个可运行的代码示例
- 禁止模板化内容
