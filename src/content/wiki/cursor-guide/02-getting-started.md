---
title: "安装与第一个 Agent Mode 项目"
wiki: "cursor-guide"
order: 2
description: "5 分钟装好 Cursor，用 Agent Mode 跑通第一个自主编程项目"
---

## 下载安装

Cursor 支持 macOS、Windows、Linux，去官网下载安装包：

![Cursor 下载与安装](https://img.youtube.com/vi/gqUQbjsYZLQ/maxresdefault.jpg)

```bash
# macOS（推荐 Homebrew）
brew install --cask cursor

# Linux（AppImage，下载后直接运行）
chmod +x cursor-*.AppImage
./cursor-*.AppImage

# Windows
# 去 cursor.com 下载 .exe，双击安装
```

第一次启动会问你要不要导入 VS Code 设置。**一定要导入**——快捷键、主题、插件、snippets 全部保留，零切换成本。

## 注册与登录

启动后右上角点头像登录。支持 Google、GitHub、邮箱注册。免费用户（Hobby 计划）的额度：

| 免费额度 | 说明 |
|---------|------|
| Tab 自动补全 | 2000 次/月 |
| Premium 模型请求 | 50 次/月（Claude Sonnet、GPT-4o） |
| Agent Mode | 包含在 Premium 请求内 |
| 慢速请求 | 无限（排队等，但不花钱） |

50 次 premium 请求足够你体验完整功能。用完了还能无限次慢速请求，只是要排队等几秒。

## 第一个项目：用 Agent Mode 建一个天气应用

打开一个空文件夹，按 `Ctrl/Cmd + I` 打开 Composer，切到 **Agent** 模式（面板顶部有 Normal / Agent 切换），输入：

```
创建一个 React + TypeScript 天气查询应用：
- 用 Vite 脚手架
- 调用 OpenWeatherMap 免费 API
- 输入城市名显示当前天气和 5 天预报
- 用 Tailwind CSS 做响应式布局
- 加载状态和错误处理都要有
```

Agent Mode 会自动规划并执行：

1. 运行 `npm create vite@latest` 初始化项目
2. 安装 Tailwind CSS、axios 依赖
3. 创建 `WeatherApp.tsx`、`WeatherCard.tsx`、`api/weather.ts`
4. 编写 API 调用逻辑和 UI 组件
5. 运行 `npm run dev` 启动开发服务器

每一步都展示文件 diff 和终端输出。Agent 改错了？对话里直接说"回滚最后一步"就行。

## 四种交互模式速查

Cursor 有四种 AI 交互方式，搞清楚什么时候用哪个：

| 模式 | 快捷键 | 用途 | 会改代码吗 |
|------|--------|------|-----------|
| **Tab** | `Tab` | 行内自动补全 | 会 |
| **Cmd+K** | `Ctrl/Cmd + K` | 选中代码后原地修改 | 会 |
| **Chat** | `Ctrl/Cmd + L` | 问问题、讨论方案 | 不会 |
| **Composer/Agent** | `Ctrl/Cmd + I` | 多文件任务、自主编程 | 会 |

日常使用频率：Tab > Cmd+K > Agent > Chat。大部分代码靠 Tab 补全搞定，复杂任务才需要开 Agent。

## 索引与 .cursorignore

Cursor 打开项目后会自动索引代码库。大项目可以用 `.cursorignore` 排除不需要索引的目录，和 `.gitignore` 语法一样：

```
node_modules/
dist/
build/
.git/
*.lock
coverage/
.next/
__pycache__/
```

索引完成前 AI 的回答可能缺少上下文。项目设置里可以看到索引状态：`Cursor Settings > Features > Codebase Indexing`。

## 导入 VS Code 插件的注意事项

Cursor 兼容绝大部分 VS Code 插件，但有几个冲突需要注意：

```bash
# 必须禁用的插件（和 Cursor AI 冲突）：
# - GitHub Copilot / Copilot Chat
# - Tabnine
# - Codeium（就是 Windsurf 那家）
# - Amazon CodeWhisperer

# 推荐保留的插件：
# - ESLint / Prettier（代码规范）
# - GitLens（Git 增强）
# - Error Lens（行内报错提示）
# - Thunder Client（API 测试）
```

装了 Copilot 不禁用的话，两个 AI 会同时给你补全建议，体验非常混乱。
