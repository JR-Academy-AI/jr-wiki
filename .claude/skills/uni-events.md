---
name: uni-events
description: "为 UMelb / UNSW / UQ / USYD 4 所澳洲大学抓当周学生活动（讲座/networking/O-Week/免费活动），筛选适合中国留学生参与的整理成小红书草稿 + 敏感词扫描，产 events/{DATE}.html（4 校并排）+ events/{DATE}-covers.html（小红书封面集）+ 更新 events/index.html timeline。Use when user wants to produce daily University events materials for Xiaohongshu — the 4 schools are fixed (墨大/UNSW/UQ/USYD)."
argument-hint: "[YYYY-MM-DD 可选，默认今天 AEST]"
sync-source: "xhs-review@1.0 / uni-news-poster (jr-wiki)"
---

# /uni-events — 4 校每日校园活动 · 小红书草稿生成器

把当周 4 所澳洲大学（**墨大 UMelb / UNSW / UQ / USYD** 固定这 4 所）的学生活动抓出来，产出到：

```
src/static/uni-news-social/events/
├── {YYYY-MM-DD}.html          # 4 校并排（events-list + xhs-draft + 敏感词过检）
├── {YYYY-MM-DD}-covers.html   # 4 张小红书封面 PNG（html2canvas 下载）
└── index.html                 # 首页 timeline 插入新条目
```

**为什么只做 4 所**：这 4 所在学生活动密度和小红书有效受众上压倒性领先。其他 6 所大学新闻走 `/uni-news-poster`，活动不走。

**scope 底线**：活动只做小红书一个渠道，不做公众号发稿页。

## 🛠 执行步骤

### Step 0. 日期 + 去重

```bash
# ⚠️ 必须 AEST，不是 UTC
DATE=${1:-$(TZ='Australia/Sydney' date +%Y-%m-%d)}

# 去重：当日已产 → 退出
if [ -f "src/static/uni-news-social/events/${DATE}.html" ]; then
  echo "✅ ${DATE} events 已产，退出"
  exit 0
fi
```

### Step 1. 抓 4 校当周活动

对 UMelb / UNSW / UQ / USYD **每校跑 2-3 轮 WebSearch + WebFetch**，目标是抓当周（DATE + 未来 7 天内）的 **3-4 条硬活动**。

每校优先搜索的入口：

| 学校 | 官方活动入口 |
|---|---|
| UMelb | `events.unimelb.edu.au/events`, `umsu.unimelb.edu.au/events` |
| UNSW | `roundhouse.org.au/whats-on`, `student.unsw.edu.au/events`, `arc.unsw.edu.au/whats-on` |
| UQ | `uq.edu.au/events`, `uqu.com.au/events`, `uqunion.com.au` |
| USYD | `whatson.sydney.edu.au`, `mannings.com.au`, `vergegallery.com` |

**筛选标准（全部满足才选）**:
- ✅ 日期在 `{DATE}` ~ `{DATE + 7 天}` 内
- ✅ 对留学生友好：免费 / 开放 / 无 member 限制（或会员可现场加入）
- ✅ 有明确时间（Week 几 / HH:mm）和地点
- ✅ 类型偏好：networking / social / market / live music / info session / exhibition / free food
- ❌ 不选：内部考试、博士答辩、仅限教职工、收费 >AUD 30

### Step 2. 产 `events/{DATE}.html`

从 `events/_template.html` 复制，替换所有 `{{...}}` 占位符：

| 占位符 | 说明 |
|---|---|
| `{{DATE}}` | 当天日期，如 `2026-04-21` |
| `{{UMELB-EVENT-N-TITLE}}` | 每校 3 条活动（UMELB / UNSW / UQ / USYD × N=1,2,3,4），活动标题 |
| `{{UMELB-EVENT-N-WHEN}}` | 时间，格式 `Tue 21 Apr 12-3pm` 或 `Wed 22 Apr` |
| `{{UMELB-EVENT-N-WHERE}}` | 地点，简短（`Roundhouse`, `Campbell Place`） |
| `{{UMELB-EVENT-N-PRICE}}` | 价格：`Free` / `$10` 等（`Free` 会加绿色 pill） |
| `{{UMELB-XHS-TITLE}}` | 小红书草稿标题，≤22 字，带 emoji 或 hook |
| `{{UMELB-XHS-BODY}}` | 正文 250-400 字，第一人称，学姐/学长口吻 |
| `{{UMELB-XHS-TAGS}}` | 7-8 个 tag：`#学校中文 #学校英文 #澳洲留学 #城市 #活动类型 #留学日常 #免费活动` |

**每校可以少于 3 条活动**（挑到哪些就写哪些），但 XHS 草稿是必须的（即使只有 1 条活动也要写一段草稿）。如果某校当周真的没有活动，这个 school 的 events-list 放一条 placeholder "本周无公开活动，下周见"，xhs-body 不产。

### Step 3. 产 `events/{DATE}-covers.html`

**参考实现**：`src/static/uni-news-social/events/2026-04-20-covers.html`（4 张封面 PNG，1242×1660 竖版）。

4 张封面，每校一张，格式：
- 顶部：学校 brand 色 cover 块（含学校 code + 中文名 + 英文名）
- 中间：2-3 个当周活动"hook"（大字，例如 "Halfway Day 免费派对"）
- 底部：日期 chip + "留学生周历" slogan
- **封号红线**：不放 JR Academy / 域名 / 微信号 / 二维码

每张带「⬇ 下载 PNG」按钮（html2canvas 1.4.1）。

### Step 4. 更新 `events/index.html` timeline

在 `<!-- NEWEST-ENTRIES-ABOVE -->` 注释**下面**（也就是 timeline 最上面）插入新条目：

```html
    <a class="entry" href="./{DATE}.html">
      <div class="date-block">
        <div class="m">{MONTH_EN}</div>  <!-- APR, MAY, ... -->
        <div class="d">{DD}</div>
        <div class="y">{YYYY}</div>
      </div>
      <div class="content">
        <div class="title">4 校活动 · {DATE}</div>
        <div class="brief">{一句话汇总 4 校主打活动，≤80 字}</div>
        <div class="schools-row"><span>UMelb</span><span>UNSW</span><span>UQ</span><span>USYD</span></div>
      </div>
      <div class="arrow">→</div>
    </a>
```

### Step 5. 敏感词扫描 + 人性化检查

4 份 xhs-body 全部过这 6 类敏感词（见 `.claude/skills/uni-news-poster.md` 章节 7），命中任一替换或删除：

1. 绝对化用语（"最"、"第一"、"唯一"...）
2. 教育承诺（"包过"、"保录取"...）
3. 引流词（"加V"、"微信"、"私信领取"、"关注公众号"...）
4. AI 味（"首先其次最后"、"值得注意的是"、"综上所述"...）
5. 医疗/化妆品（本场景极少用到）
6. 政治/金融（不碰）

**人性化要求**：
- 第一人称 + 有时间线 + 有情绪（"挺 chill"、"我发现"、"去年我在那"）
- 段落长短参差 / emoji 1-2 个 / 结尾互动句（"评论区告诉我"）
- 标题 ≤22 字含 emoji

### Step 6. 输出说明

```
✅ 4 校校园活动 {DATE} 生成完成

文件：
- src/static/uni-news-social/events/{DATE}.html（4 校并排）
- src/static/uni-news-social/events/{DATE}-covers.html（4 张小红书封面）
- src/static/uni-news-social/events/index.html（timeline 插入新条目）

运营操作：
- 4 校 × 1 张封面（-covers.html 下载 PNG）
- 4 校 × 1 篇草稿（.html 点「📋 复制全部」）
- 配对发布到小红书 4 个账号（UMelb 课代表 / UNSW 课代表 / UQ 课代表 / USYD 课代表）

下一步：
  /publish
```

## 🚨 绝对禁止

1. 抓非 UMelb / UNSW / UQ / USYD 4 校的活动——scope 固定
2. 产公众号发稿页（活动只做小红书）
3. 活动时间超过 `{DATE} + 7 天`
4. 编造活动（没真实 URL 或没官方入口验证 → 丢弃）
5. 封面 / 文案出现 JR Academy / 域名 / 微信号 / 二维码（小红书封号）
6. 草稿绕过敏感词扫描
7. 改动 `src/static/uni-news-social/events/` 以外的文件

## ✅ 自检 grep（每次跑完必过）

```bash
D=src/static/uni-news-social/events
DATE={YYYY-MM-DD}

[ -f $D/${DATE}.html ]                                  || echo "❌ 缺 ${DATE}.html"
[ -f $D/${DATE}-covers.html ]                           || echo "❌ 缺 ${DATE}-covers.html"
grep -q "./${DATE}.html" $D/index.html                  || echo "❌ index.html timeline 没插入"

# 占位符必须全部替换
! grep -q "{{" $D/${DATE}.html                          || echo "❌ ${DATE}.html 还有 {{占位符}} 没替换"
! grep -q "{{" $D/${DATE}-covers.html                   || echo "❌ covers.html 还有 {{占位符}}"

# 4 校 XHS body 都有内容
for s in umelb unsw uq usyd; do
  grep -q "id=\"${s}-body\"" $D/${DATE}.html            || echo "❌ $s body 缺"
done

# 敏感词黑名单（本应在 xhs-body 里扫过，最后 grep 一次兜底）
! grep -qE '加V|微信号|保过|包过|绝对|第一|唯一' $D/${DATE}.html || echo "⚠️ ${DATE}.html 命中敏感词"

# 封号红线：封面不允许出现 JR Academy / 域名 / 二维码
! grep -qE 'JR Academy|jiangren\.com|qrcode|qr-code' $D/${DATE}-covers.html || echo "⚠️ covers.html 出现封号红线关键词"
```

## 📚 参考实现

- `.claude/skills/uni-news-poster.md`（敏感词扫描规则 / 人性化改写要求）
- `src/static/uni-news-social/events/_template.html`（HTML 骨架）
- `src/static/uni-news-social/events/2026-04-20.html`（完整示例 · 4 校 × 3-4 活动）
- `src/static/uni-news-social/events/2026-04-20-covers.html`（4 张小红书封面示例）
