---
title: "核心功能：从代码生成到一键部署"
wiki: "bolt-new-guide"
order: 3
description: "深入了解 Bolt.new 的代码生成机制、实时预览、Supabase 数据库集成和部署方案"
---

Bolt.new 不只是一个 AI 对话框，它是一个完整的浏览器内开发环境。代码生成只是起点，围绕它的工具链才是真正好用的部分。

## 代码生成与编辑

Bolt.new v2 的 AI 不再是"生成完你自己看"——它会自主规划、生成、调试。跟 v1 最大的区别：构建失败时 AI 自动读取错误信息并尝试修复，不用你手动复制报错。

**Diffs 机制**：v2 只更新变更的代码部分，不重写整个文件。更快的速度，更少的 Token。

你可以随时在 AI 生成和手动编辑之间切换：

```typescript
// AI 生成了基础的数据获取 hook
// 你觉得需要加重试逻辑，直接在编辑器里改
export function useData(url: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(err => {
        if (retryCount < 3) {
          setTimeout(() => setRetryCount(c => c + 1), 1000 * retryCount);
        }
      })
      .finally(() => setLoading(false));
  }, [url, retryCount]);

  return { data, loading, retry: () => setRetryCount(0) };
}
```

改完后告诉 AI"我加了重试逻辑，帮我在 UI 上加一个重试按钮"，它会基于你的修改继续开发。

## Visual Inspector

大概只有 5% 的用户知道这个功能——在预览面板里悬停任何 UI 元素，Bolt.new 会高亮它对应的代码位置。点击元素后直接描述你想怎么改，比手动翻代码找位置快得多。

## 数据库：Supabase 集成

需要后端数据？Bolt.new 原生支持 Supabase（开源的 Firebase 替代品）。

![Bolt.new 与 Supabase 集成](https://supabase.com/images/blog/bolt-cloud-launch/bolt-cloud-launch-og.png)

连接步骤：
1. 在项目设置中选择 Supabase
2. 授权你的 Supabase 账户
3. 选择已有项目或让 Bolt 创建新的

连接后 AI 自动处理建表、权限、API 生成：

```sql
-- Bolt.new 自动生成的数据库结构
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 行级安全策略：用户只能访问自己的数据
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);
```

Supabase 还自带认证系统，支持邮箱/密码登录和 Google、GitHub OAuth。同一个 Supabase 项目可以同时服务 Web 应用和移动应用。

## 部署方案对比

| 方式 | 速度 | 自定义域名 | 适合场景 |
|------|------|-----------|---------|
| bolt.host | ~30 秒 | 付费计划支持 | 快速分享、演示 |
| Netlify | ~1 分钟 | 支持 | 正式上线、SEO |
| Cloudflare | ~2 分钟 | 支持 | 全球加速 |
| 下载 ZIP | — | 随意 | 本地开发、自行部署 |

## GitHub 集成

在 Integrations → GitHub 里连接账号，代码自动同步到你的仓库。几个要注意的点：

```
✅ 支持：个人 GitHub 账户自动同步
✅ 支持：每次 AI 修改自动 commit
❌ 不支持：GitHub Organization 账户
❌ 不支持：在 Bolt 内做 Git merge
⚠️  注意：Bolt 和 GitHub 同时修改时，Bolt 版本优先
```

建议用 feature branch 开发，不要直接在 main 上改。需要合并代码时到 GitHub 上操作 Pull Request。
