---
title: "Bolt.new 进阶技巧：省 token、少踩坑、出活快"
wiki: "bolt-new-guide"
order: 4
description: "掌握 Bolt.new 高级 prompt 技巧、token 节约策略、三阶段开发法和常见坑的解决方案"
---

用 Bolt.new 一段时间后你会发现，同样的需求，会写 prompt 的人可能 3 条消息就搞定，不会写的人 20 条消息还在绕圈子——而且每条消息都在烧 token。这一章讲的就是怎么更高效地用 Bolt.new。

![Bolt.new prompting tips](https://a.fsdn.com/con/app/proj/bolt-diy.mirror/screenshots/bolt-diy-6f92341a.jpg)

## Prompt 写法的核心原则

### 一次只改一件事

这是最重要的一条。不要在一个 prompt 里塞五六个需求：

**别这么写**：
```
改一下 UI 风格，加个搜索功能，修复那个 bug，把数据库换成 Supabase，还有加个深色模式
```

**应该这么写**：
```
第 1 条：修复点击"删除"按钮后列表没有刷新的 bug
第 2 条：添加搜索框，输入时实时过滤列表
第 3 条：把主题切换成深色模式
```

一次改一件事，出了问题好定位，想回滚也精准。

### 用专业词汇代替模糊描述

```
❌ "把文字弄大一点、粗一点"
✅ "标题字体改成 28px，font-weight 设为 700"

❌ "按钮之间太挤了"
✅ "按钮之间加 16px 的 gap"

❌ "这个页面不好看"
✅ "参考 Linear 的设计风格，用 slate 色系，卡片加 1px border 和 8px 圆角"
```

### 指定文件和组件

项目大了以后，告诉 AI 改哪个文件能大幅减少 token 消耗：

```
只修改 src/components/TaskList.tsx 里的排序逻辑，
把默认排序从按创建时间改成按优先级降序。
不要动其他文件。
```

## 三阶段开发法

Bolt.new 社区里流行一套 **Mega Prompt** 模板，把项目开发分成三个阶段。我觉得这个思路很实用：

### Phase 1：搭骨架

```
创建一个 SaaS 仪表盘应用：
- 技术栈：React + Vite + Tailwind + shadcn/ui
- 页面：Landing Page、Dashboard、Settings
- 响应式布局，手机端适配
- 侧边栏导航 + 顶部搜索栏
- 数据先用 mock 数据，后面再接数据库
```

这一步的重点是**把架构和导航确定下来**，不急着加功能。

### Phase 2：接数据库 + 用户系统

```
现在把 mock 数据换成 Supabase 数据库：
1. 创建 users、projects、tasks 三张表
2. 加上邮箱注册/登录
3. 用 Row Level Security 确保用户只能看自己的数据
4. Dashboard 页面从数据库读取真实数据
```

### Phase 3：打磨和高级功能

```
1. 添加 Stripe 订阅支付（月付 $9.99）
2. 任务支持拖拽排序（用 @dnd-kit/core）
3. 添加实时通知功能
4. 性能优化：大列表用虚拟滚动
```

分阶段做的好处：每个阶段结束后你都有一个**能跑的版本**，随时可以停下来部署。

## Token 省着用

Bolt.new 的 token 消耗有个坑：**项目越大，每条 prompt 消耗的 token 越多**。因为 AI 每次回复都要读一遍整个项目代码。

一些数据参考：
- 新项目：每条 prompt 大约消耗 ~10,000 tokens
- 20 个组件的项目：每条 prompt 大约消耗 ~100,000 tokens

省 token 的几个技巧：

1. **第一条 prompt 写详细**：把核心功能一次说清楚，比后面一点一点加要省
2. **指定操作范围**：说明改哪个文件/组件，AI 就不需要扫描整个项目
3. **用 Haiku 做小改动**：改文案、调颜色这种事不需要 Sonnet
4. **让 AI 生成 README**：`生成一份 README.md，总结项目结构和每个组件的作用`——下次开发时引用 README 可以减少 AI 的"理解成本"

## 常见坑和解决方案

### 生成的代码报错，AI 改了好几轮还是报错

这种"错误循环"是 AI 编辑器的通病。Bolt V2 的自动 debug 功能已经把这个问题减少了 98%，但复杂场景还是会遇到。

解决方案：
```
把完整的错误信息粘贴过来（包括文件名和行号），然后说：
"请只关注这个错误，不要改其他任何代码"
```

如果 3 轮还没解决，**直接回滚到出错前的版本**，换个思路重新描述需求。

### 浏览器加载慢、403/404 错误

```bash
# 检查清单：
# 1. 用 Chrome 或 Chromium 浏览器（Safari/Firefox 兼容性差）
# 2. 关掉广告拦截器（会拦截 WebContainers 资源）
# 3. 关掉 VPN（某些 VPN 会阻断 StackBlitz 的连接）
# 4. 终端里跑一下 build 试试：
npm run build
```

### Supabase 权限错误（403）

99% 的原因是 **Row Level Security (RLS)** 没配好。在对话里说：

```
帮我检查 todos 表的 RLS 策略，
确保登录用户可以增删改查自己的数据
```

## 实战案例：从零搭一个 AI 工具导航站

这是一个我觉得很适合用 Bolt.new 做的项目类型——内容展示 + 简单交互，不需要复杂后端。

**Prompt 1**：
```
用 React + Tailwind + shadcn/ui 创建一个 AI 工具导航站：
- 首页网格展示工具卡片（logo、名称、一句话描述、标签、链接）
- 顶部搜索框 + 标签筛选（生成类、编程类、设计类、写作类）
- 点击卡片跳转到工具官网（新标签页打开）
- 支持提交新工具（表单 + localStorage）
- 深色主题，参考 futurepedia.io 风格
```

**Prompt 2**：
```
接 Supabase 数据库，把工具数据从 mock 迁移到 DB。
加一个 admin 页面（/admin），可以审核用户提交的工具。
```

两条 prompt，大约 10 分钟，一个实用的 AI 工具导航站就出来了。
