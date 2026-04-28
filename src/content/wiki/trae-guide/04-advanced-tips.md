---
title: "Trae 进阶技巧：MCP 集成、.rules 配置、Vercel 一键部署"
wiki: "trae-guide"
order: 4
description: "掌握 Trae 的高级功能：MCP 外部数据源接入、项目级 AI 规则配置、Vercel 部署、版本管理和 VS Code 插件生态"
---

Trae 的基础功能上手很快，但要真正把它用出生产力，还得搞懂 MCP、.rules 和部署这些进阶功能。这一章讲的是让 Trae 从"玩具"变成"工具"的关键配置。

![Trae MCP 与高级配置](https://img.youtube.com/vi/LqTQi8kR_ek/maxresdefault.jpg)

## MCP：让 AI 连接外部世界

MCP（Model Context Protocol）是 Trae v1.3.0 引入的重要功能。简单说：**MCP 让 AI 能访问 IDE 之外的数据源和工具**。

没有 MCP 之前，Trae 的 AI 只能看到你项目里的代码文件。有了 MCP，它可以：
- 查 PostgreSQL 数据库的表结构
- 读 GitHub 上的 issue 和 PR
- 调用 Puppeteer 做浏览器自动化
- 接入火山引擎的云服务

**配置方法**：

在项目根目录创建 `.trae/mcp.json`：

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/mydb"
      }
    }
  }
}
```

配置完重启 Trae，AI 面板就能自动发现并使用这些数据源。你可以直接在 Chat 里问"数据库里 users 表有哪些字段"，AI 会通过 MCP 去查。

## .rules：项目级 AI 行为配置

`.rules` 文件（同样是 v1.3.0 引入）让你给 AI 定规矩——项目用什么代码风格、禁止哪些写法、遵循什么架构约定。

在项目根目录创建 `.trae/rules`（纯文本文件）：

```
你是一个 TypeScript 全栈开发助手。

代码规范：
- 使用 TypeScript strict mode
- 组件用函数式写法，不用 class component
- 状态管理用 Zustand，不用 Redux
- CSS 用 Tailwind，不写自定义 CSS 文件
- 变量命名用 camelCase，类型用 PascalCase

项目约定：
- API 路由放 src/app/api/ 下
- 通用组件放 src/components/ui/
- 业务组件放 src/features/{feature}/components/
- 所有 API 请求必须有错误处理
```

这样每次 AI 生成代码时，都会自动遵循这些规则。不用每次在 prompt 里重复"记得用 TypeScript"。

## Vercel 一键部署

2026 年 2 月 Trae 集成了 Vercel AI Gateway，部署变得非常简单：

1. 在 Trae 里打开你的 Next.js / Vite / Astro 项目
2. 命令面板（`Cmd+Shift+P`）搜索 **Deploy to Vercel**
3. 首次使用需要授权 Vercel 账号
4. 选择项目配置（通常默认就行）
5. 一键部署，几分钟后拿到线上 URL

```bash
# 如果你更喜欢命令行方式，也可以在 Trae 内置终端里：
npx vercel --prod
# 或者用 Vercel CLI
npm i -g vercel
vercel
```

Builder Mode 生成的项目结构通常是部署友好的——Vite / Next.js 的标准结构，Vercel 能直接识别。

## 高效使用的实战技巧

### 1. 用好版本回滚

Builder Mode 和 SOLO Mode 都支持版本历史。**养成习惯：每次 AI 做完一轮大改动，先去 History 里确认一下**。觉得没问题再继续。别等改了十轮才发现第三轮就跑偏了。

### 2. 分阶段开发

和 Bolt.new 一样的策略——别在一条 prompt 里塞所有需求：

```
阶段 1：先搭项目骨架和路由
阶段 2：做核心功能页面
阶段 3：加样式和交互动画
阶段 4：接 API 和数据库
阶段 5：优化和部署
```

每个阶段用 Builder Mode 单独处理，出了问题好定位。

### 3. 多模态输入省时间

看到一个好看的网站想复刻？截图直接拖进 Builder Mode 的对话框。AI 会分析布局、配色、组件结构，然后生成类似的代码。比你用文字描述"导航栏在上面、左边有侧边栏、主区域是卡片网格"快得多。

### 4. 导入 VS Code 工作流

Trae 支持 VS Code 的大部分插件生态。这些插件建议立刻装上：

- **GitLens**：Git 历史和 blame 信息
- **Prettier**：代码格式化
- **ESLint**：代码检查
- **Tailwind CSS IntelliSense**：Tailwind 自动补全
- **Error Lens**：行内显示错误信息
