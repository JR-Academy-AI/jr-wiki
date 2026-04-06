# /weekly-tool-book — 每周 AI 工具实战手册

搜索本周最火的 AI 工具/框架，自动创建一本 3-5 章的电子书。

## 使用方法
```
/weekly-tool-book
/weekly-tool-book Cursor
```

## 执行步骤

### Step 1: 选题

如果用户没指定工具，用 WebSearch 搜索：
```
1. "best AI tools this week" OR "trending AI tools 2026"
2. "新 AI 工具 推荐" site:36kr.com OR site:sspai.com
3. site:producthunt.com AI tool top
4. "developer tools AI" trending this week
```

选题标准：
- 和开发者/职场人相关
- 还没有对应的 wiki 电子书（检查 `src/content/wiki/` 下已有的）
- 有足够内容可以写 3-5 章

### Step 2: 深度研究

确定工具后，搜索 5-8 轮获取详细信息：
```
1. "{工具名} official documentation"
2. "{工具名} tutorial getting started"
3. "{工具名} vs alternatives comparison"
4. "{工具名} 教程 使用方法"
5. "{工具名} real world use cases"
6. "{工具名} pricing plans features"
7. "{工具名} tips tricks advanced"
8. "{工具名} review 2026"
```

用 WebFetch 读取官方文档和高质量教程。

### Step 3: 创建电子书

目录: `src/content/wiki/{tool-slug}/`

**_meta.yaml**:
```yaml
title: "{工具名}实战手册"
description: "{一句话，含关键词}"
tags:
  - {tool-slug}
  - ai-tools
  - {category}
order: {自增}
```

**章节结构（3-5 章）**:

```
01-what-is-{tool}.md    — 是什么 + 为什么用它（vs 竞品对比）
02-getting-started.md   — 安装 + 第一个任务（5 分钟上手）
03-core-features.md     — 核心功能详解（每个功能配代码/截图描述）
04-advanced-tips.md     — 进阶技巧 + 实战案例
05-cheatsheet.md        — 速查表（命令/快捷键/常见问题）← 可选
```

每章 frontmatter:
```yaml
---
title: "{章节标题，含关键词}"
wiki: "{tool-slug}"
order: {N}
description: "{一句话}"
---
```

### Step 4: 内容质量（每章逐一检查）

每章 500-1000 字，**逐项检查以下清单**：

- [ ] 有具体的命令/代码/配置示例（不是伪代码）
- [ ] 有真实使用场景（不是假想的"比如你可以..."）
- [ ] 有竞品对比（什么时候用/不用这个工具）
- [ ] **至少 1 张配图**（0 图不合格）→ 用 `WebSearch "{tool} screenshot"` 或产品官网截图 URL
- [ ] 没有 AI 味禁止词（值得注意的是、总的来说、此外、综上所述、至关重要、旨在、使得、进行了）
- [ ] 长短句交替，有口语化表达
- [ ] 首段 100 字内出现工具名

**SEO 规则**:
- 每章 H2 含关键词
- 第一段 100 字内出现工具名
- 最后一章加 FAQ（2-3 个真实搜索问题）
- meta description 120 字以内

### Step 5: 发布

```bash
git add src/content/wiki/{tool-slug}/
git commit -m "content: 新电子书 — {工具名}实战手册 ({N}章)"
git push origin main
```

提醒用户：
> 电子书已创建！
> 官网地址: /wiki/{tool-slug}
> 需要运行: `ADMIN_TOKEN=xxx bun run sync` 同步到官网

## 配图处理

配图优先用外链（产品官方截图、Unsplash），但关键配图要本地保存：

1. 用 WebFetch 获取图片 URL
2. 关键图片（封面、核心功能截图）下载到 `src/content/wiki/{tool-slug}/images/`
3. markdown 里用相对路径引用：`![alt](images/screenshot.png)`
4. 不重要的图（装饰性）可以直接用外链

**图片来源**：
- 产品官网截图 URL（通常稳定）
- 产品 logo URL
- Unsplash 免费图
- 如果以上都不可用，用文字描述代替图片

## 降低 AI 率

**禁止词**：值得注意的是、总的来说、此外、综上所述、不可否认、至关重要、旨在、使得/使其、进行了

**写法要求**：
- 长短句交替，偶尔一句话单独成段
- 用口语："说白了"、"踩过坑的都知道"、"这玩意儿"
- 加个人判断："实测下来"、"我们团队试过"
- 段落长度不均匀
- 写完检查：删掉所有 AI 味连接词，读一遍看是否像人写的

## 禁止

- 不写没有官方文档支撑的功能描述
- 不编造使用数据或用户数量
- 不写模板化开场
- 不写已经有电子书的工具（先检查 src/content/wiki/）
