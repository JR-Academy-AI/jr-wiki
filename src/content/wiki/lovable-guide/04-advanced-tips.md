---
title: "Lovable 进阶技巧：构建真实可用的生产级应用"
wiki: "lovable-guide"
order: 4
description: "掌握 Lovable 的高级用法：精准 Prompt 技巧、Supabase 全栈集成、用户认证、文件上传和实战项目案例"
---

用了 Lovable 一段时间后，你会发现它真正的威力不在于"生成代码"，而在于如何通过精准的对话，把一个想法变成可以给真实用户使用的产品。

![Lovable advanced workflow](https://lovable.dev/advanced-screenshot.png)

## 进阶技巧一：写出精准 Prompt 的框架

### WHAT + WHERE + HOW 框架

```
WHAT（改什么）：添加一个用户头像上传功能
WHERE（在哪里）：用户设置页面，在"个人信息"表单里
HOW（怎么做）：
  - 点击头像区域触发文件选择
  - 支持 JPG/PNG，最大 2MB
  - 上传到 Supabase Storage 的 avatars bucket
  - 上传成功后立即更新页面显示
  - 上传失败时显示错误 toast
```

### 一次改一件事

**错误做法**（一次改太多）：
```
改一下 UI，加几个功能，修复那个 bug，还有调整数据库结构
```

**正确做法**（分步操作）：
```
第1条：修复登录后跳转到 /dashboard 的 bug
第2条：添加"记住登录状态"复选框
第3条：登录页面 UI 改成白底深色文字风格
```

分步操作有两个好处：出了问题更容易定位，回滚也更精准。

### 明确说"不要改什么"

```
只修改 UserProfile 组件里的头像部分，
不要动其他任何组件，不要修改数据库结构
```

这句话能避免 AI 在"顺手"帮你优化时引入意外变更。

## 进阶技巧二：完整的 Supabase 用户认证

实现真实的用户注册/登录系统，需要以下步骤：

**Step 1：在 Supabase 开启 Auth**

在 Supabase Dashboard → Authentication → Settings：
- 开启 Email 认证
- 可选开启 Google OAuth（需要配置 Google Cloud Console）

**Step 2：在 Lovable 里描述认证需求**

```
帮我实现完整的用户认证：
1. 注册页面（/signup）：邮箱 + 密码 + 确认密码，注册后发验证邮件
2. 登录页面（/login）：邮箱 + 密码 + 记住我
3. 忘记密码（/forgot-password）：输入邮箱发重置链接
4. 所有需要登录的页面加上路由守卫
5. 顶部导航显示用户头像和退出按钮

用 Supabase Auth，我已经连接了 Supabase
```

Lovable 会生成完整的认证流程代码，包括 Supabase Auth hooks：

```typescript
// Lovable 生成的认证 hook 示例
import { supabase } from "@/integrations/supabase/client"

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 检查当前登录状态
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
```

## 进阶技巧三：Row Level Security 数据安全

连接 Supabase 后，**必须**开启 Row Level Security (RLS)，否则所有用户都能看到所有人的数据。

在对话里说：

```
帮我为 todos 表设置 Row Level Security：
- 用户只能看到自己的 todos（user_id = auth.uid()）
- 用户只能创建属于自己的 todos
- 用户只能更新和删除自己的 todos
```

Lovable 会生成这样的 SQL：

```sql
-- 开启 RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- 查询策略：只能看自己的
CREATE POLICY "Users can view own todos"
  ON todos FOR SELECT
  USING (auth.uid() = user_id);

-- 插入策略：只能插入属于自己的
CREATE POLICY "Users can insert own todos"
  ON todos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 更新策略
CREATE POLICY "Users can update own todos"
  ON todos FOR UPDATE
  USING (auth.uid() = user_id);

-- 删除策略
CREATE POLICY "Users can delete own todos"
  ON todos FOR DELETE
  USING (auth.uid() = user_id);
```

## 进阶技巧四：文件上传功能

```
实现图片上传功能：
- 用户可以上传图片到帖子
- 图片上传到 Supabase Storage 的 post-images bucket
- 展示上传进度条
- 上传成功后返回图片 URL，存到 posts 表的 image_url 字段
- 图片大小限制 5MB，只接受 image/* 类型
```

Lovable 生成的核心上传逻辑：

```typescript
const uploadImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}.${fileExt}`
  const filePath = `${user.id}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('post-images')
    .upload(filePath, file, {
      onUploadProgress: (progress) => {
        setUploadProgress(Math.round((progress.loaded / progress.total) * 100))
      }
    })

  if (uploadError) throw uploadError

  const { data } = supabase.storage
    .from('post-images')
    .getPublicUrl(filePath)

  return data.publicUrl
}
```

## 实战案例：构建一个简单的 SaaS 产品

以下是用 Lovable 构建一个"团队任务管理 SaaS"的完整 prompt 序列：

**Prompt 1 - 初始框架**：
```
构建一个团队任务管理 SaaS，技术栈用 React + Supabase：
- 工作空间概念（一个账号可以有多个工作空间）
- 项目和任务的层级结构
- 团队成员邀请
- 任务分配给特定成员
设计风格参考 Linear，深色主题
```

**Prompt 2 - 数据库设计**：
```
帮我设计并创建以下 Supabase 数据表：
- workspaces（工作空间）
- workspace_members（成员关系表，含权限角色）
- projects（项目）
- tasks（任务，含优先级、状态、截止日期、指派人）
每个表加上 RLS 策略，确保用户只能访问自己所在工作空间的数据
```

**Prompt 3 - 邀请功能**：
```
实现团队邀请功能：
- 工作空间 owner 可以生成邀请链接（有效期 7 天）
- 通过链接注册的新用户自动加入工作空间
- 邀请记录存 workspace_invitations 表
```

**Prompt 4 - 看板视图**：
```
添加看板视图（Kanban Board）：
- 状态列：待办、进行中、审核中、已完成
- 任务卡片可以拖拽到不同状态列
- 使用 @dnd-kit/core 库实现拖拽
```

四步之后，你有了一个功能完整的 SaaS 雏形，核心功能全部可用。
