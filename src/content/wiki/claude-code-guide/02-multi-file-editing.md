---
title: "多文件编辑：Claude Code 的杀手锏"
wiki: "claude-code-guide"
order: 2
description: "一句话改 10 个文件，跨文件重构不再痛苦"
---

## 为什么多文件编辑重要

改一个接口名，可能涉及 controller、service、DTO、测试、前端调用 5+ 个文件。手动改容易漏，Claude Code 一次搞定。

## 实战：重命名一个 API

```
> 把 getUserList 改名为 fetchUsers，所有引用的地方都改掉
```

Claude Code 会：
1. 用 Grep 搜索所有引用
2. 逐个文件 Edit 替换
3. 检查 import 路径是否需要调整
4. 展示所有修改的 diff

你确认后一次性应用。

## 实战：给所有 API 加错误处理

```
> 检查 src/services/ 下所有 fetch 调用，没有 try-catch 的都加上，错误统一用 toast 提示
```

这种跨文件的模式化修改，手动做要半小时，Claude Code 2 分钟。

## 技巧：用 CLAUDE.md 控制行为

在项目根目录放一个 `CLAUDE.md`，写上项目规范：

```markdown
# CLAUDE.md
- 错误处理用 try-catch + toast.error()
- API 调用统一用 services/ 下的函数
- 组件用 TypeScript + styled-components
```

Claude Code 每次启动都会读这个文件，自动遵守你的规范。
