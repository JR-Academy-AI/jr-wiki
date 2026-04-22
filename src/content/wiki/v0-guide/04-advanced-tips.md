---
title: "高手进阶：Prompt 技巧与实战案例"
wiki: "v0-guide"
order: 4
description: "Vercel 官方推荐的 Prompt 三要素框架、Tailwind 精确控制、迭代策略和真实项目经验"
---

## Prompt 三要素框架

v0 的 Prompt 写法直接决定输出质量。Vercel 官方推荐的三要素：

**1. Product Surface（具体界面）**——列出每个组件和数据。别说"做个仪表盘"，要说清楚里面有什么：

```
创建运营仪表盘：
- 4 个 KPI 卡片（MRR、活跃用户数、流失率、NPS 分数）
- 趋势折线图，最近 30 天数据
- 最近订单表格，列：订单号、客户、金额、状态
- 日期范围筛选器
- 右上角通知铃铛
```

**2. Context of Use（使用场景）**——谁在用、什么时候用：
"给运营团队每天早上看，一眼看到指标变化，快速筛选异常订单。"

**3. Constraints（约束）**——颜色、风格、"不要什么"：
"深色主题，主色调 #6366f1。不用 Tab 切换，所有信息一页。表格按时间倒序。"

## Tailwind 精确控制

v0 的底层思维基于 Tailwind CSS，所以直接用 Tailwind 类名比用自然语言描述更精确：

| 模糊描述 | 精确 Tailwind 指令 |
|---------|-------------------|
| "图片小一点" | "make the image `size-4`"（精确 1rem × 1rem） |
| "文字大一点" | "set heading to `text-2xl font-semibold`" |
| "加点间距" | "add `p-6` to the card container" |
| "数字排列不整齐" | "add `tabular-nums` to all numeric cells" |

![v0 Prompt 迭代效果](https://vercel.com/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1%2Ffront%2Fblog%2Fhow-to-prompt-v0.png&w=1920&q=75)

v0 默认用 Tailwind 变量颜色（`bg-primary`），不会主动用 `indigo`，除非你要求。

## 迭代策略

- **第一次生成是草稿**，别指望一步到位
- **2-3 轮紧凑迭代**比超长 Prompt 效果好
- 每轮改 **2-3 处**，同时改 15 处 v0 会顾此失彼
- 5 轮还不满意就**重写 Prompt**，别补丁叠补丁
- 样式微调用 Design Mode（不扣钱）

## Instructions 系统

v0 支持保存可复用指令，三个层级叠加生效：

```
Account Instructions（全局）
  └─ Project Instructions（项目级）
      └─ Chat Instructions（当前聊天）
```

设置路径：点右上角头像 → Settings → Instructions。项目级在聊天侧边栏 → Project Settings。

写好 Instructions 能省大量重复描述。示例：

```
# 账户级 Instructions
- 所有代码用 TypeScript strict mode
- 组件用 named export，不用 default export
- 颜色变量用 CSS custom properties，不硬编码 hex
- 中文注释，英文变量名
- 表单验证用 zod + react-hook-form
```

```
# 项目级 Instructions
- 品牌主色 --brand: #6366f1，辅色 --accent: #f59e0b
- 字体 Inter，中文用 Noto Sans SC
- 所有页面带面包屑导航
- API 路由统一返回 { data, error } 格式
```

聊天级 Instructions 用来临时覆盖，比如"这个聊天里只生成移动端布局"。

## 版本管理与回滚

v0 会为每条消息自动存一个版本快照。几个操作技巧：

```bash
# 在 v0 聊天界面里
# 1. 点击消息左侧的版本号（v1, v2, v3...）可以预览历史版本
# 2. 点 "Restore" 回滚到该版本
# 3. 从历史版本 fork 出新分支继续迭代

# 通过 Git 面板查看 diff
# 每条消息 = 一个 commit，diff 清楚看到改了什么
```

一条经验：如果连续 3 轮迭代都在修同一个问题，回滚到出问题前的版本，换个描述方式重来，比继续打补丁效果好。

## 实战案例

| 项目类型 | 效果 | 原因 |
|---------|------|------|
| 着陆页 / 营销页 | 极好 | 最强项，接近专业设计师水准 |
| SaaS 管理后台 | 很好 | 表格、图表、表单组件成熟 |
| MVP 原型验证 | 很好 | 速度快，投资人演示够用 |
| 复杂业务逻辑 | 一般 | 前端没问题，后端要自己补 |
| 非 React 项目 | 不行 | 不支持 Vue/Angular |

真实场景：某团队用 v0 生成 CRM 仪表盘原型，3 小时从概念到可交互 demo，客户确认后再用 Cursor 做完整实现。v0 负责快速试错，Cursor 负责正式开发。
