---
description: 每周日抓未来 7 天 AU/SG/MY/US/GB 节假日，产出 JSON 给 admin 营销日历用
---

# /weekly-holidays — 未来一周 5 国节假日调查

**目的**：给运营/营销做下周内容排期参考。看到 "下周五 US Memorial Day" 就知道要么避开、要么蹭。

**不产海报、不发公众号、不进 hub**。纯内部数据 → admin 页面读取。

## 使用

```
/weekly-holidays              # 默认：从"本周日 AEST"起算，抓未来 7 天
/weekly-holidays 2026-04-27   # 手动指定 weekStartDate（必须是周一）
```

## 产出

```
src/data/weekly-holidays/
├── _my-holidays-{year}.json   # MY 年度静态表（手维护，每年刷一次）
├── {weekStartDate}.json       # 本周快照 (e.g. 2026-04-27.json)
└── latest.json                # 永远是最新一周（admin 读这个）
```

## 执行步骤

### Step 0: 确定周窗口（AEST 时区强制）

```bash
# schedule 跑在 UTC → 必须用 AEST 取日期，否则误差一天
# 默认：从 AEST 下周一开始，7 天窗口
if [ -n "$1" ]; then
  WEEK_START="$1"
else
  # AEST 今天
  TODAY=$(TZ='Australia/Sydney' date +%Y-%m-%d)
  # 找下一个周一（如果今天是周日，就是明天；其他天则是下下周一）
  WEEK_START=$(TZ='Australia/Sydney' date -v+mon -j -f "%Y-%m-%d" "$TODAY" +%Y-%m-%d 2>/dev/null || python3 -c "
from datetime import date, timedelta
t = date.fromisoformat('$TODAY')
days = (7 - t.weekday()) % 7
if days == 0: days = 7
print((t + timedelta(days=days)).isoformat())
")
fi

WEEK_END=$(python3 -c "
from datetime import date, timedelta
print((date.fromisoformat('$WEEK_START') + timedelta(days=6)).isoformat())
")

YEAR=$(echo "$WEEK_START" | cut -d- -f1)
echo "Window: $WEEK_START → $WEEK_END"
```

### Step 1: 抓 Nager.Date 数据（AU/SG/US/GB）

MY **不支持**，单独处理。其他 4 国 API 已验证可用（AU 25 条/年 · SG 10 · US 16 · GB 14）。

```bash
for C in AU SG US GB; do
  curl -s "https://date.nager.at/api/v3/PublicHolidays/$YEAR/$C" -o "/tmp/hol-$C-$YEAR.json"
done
```

跨年情况：如果 `WEEK_END` 落在下一年（如 12 月底跑），也抓下一年的，两份合并。

### Step 2: MY 数据从静态文件读

```bash
MY_FILE="src/data/weekly-holidays/_my-holidays-$YEAR.json"
if [ ! -f "$MY_FILE" ]; then
  echo "❌ 缺少 $MY_FILE — 年度 MY 节日表没维护"
  echo "   停下来问用户要 $YEAR 年 Malaysia 联邦公共假日（或让我按官方来源研究生成）"
  exit 1
fi
```

**MY 年度表格式**（手维护，每年年初更新一次）:

```json
{
  "country": "MY",
  "year": 2026,
  "source": "https://publicholidays.com.my/{year}/  · 以马来西亚公共假期管理局（Kementerian Dalam Negeri）官方公报为准",
  "holidays": [
    { "date": "2026-01-01", "name": "New Year's Day", "localName": "Tahun Baru", "type": "Public" },
    { "date": "2026-05-01", "name": "Labour Day", "localName": "Hari Pekerja", "type": "Public" }
  ]
}
```

⚠️ MY 每年很多伊斯兰/印度教节日日期浮动（Hari Raya / Deepavali / Wesak），**绝不能用去年的日期**。年初查 [publicholidays.com.my](https://publicholidays.com.my/) 手工更新。

### Step 3: 过滤到本周窗口 + AI 增强

对每条 Nager/MY 数据：
1. 过滤：`WEEK_START <= date <= WEEK_END`
2. AI 生成 `nameZh`（中文译名，不要音译堆砌，用学员熟知的名字，如 "Anzac Day" → "澳新军团日"）
3. AI 生成 `marketingNote`（1 句话，≤40 字，给运营看的营销提示）

**marketingNote 写作规则**（重要，别写成模版）：
- ✅ 具体：说清楚这个节"学员在不在线、什么内容适合发、哪个人群共鸣"
- ❌ 禁：写"节日快乐"、"记得安排内容"、"适合营销"这种废话
- 句式参考：
  - "US Memorial Day · 美股休市 + 暑期实习季开端，适合推美本求职内容"
  - "Hari Raya · 马来穆斯林学员线下活动多，避开重推广，改发社群互动"
  - "Anzac Day · 澳洲连假前夜，发布长文章转化差，改短视频/海报"

### Step 4: 写 JSON 文件

```json
{
  "schemaVersion": "1.0",
  "weekStartDate": "2026-04-27",
  "weekEndDate": "2026-05-03",
  "generatedAt": "2026-04-26T22:00:00+10:00",
  "countries": [
    { "code": "AU", "label": "澳洲", "flag": "🇦🇺" },
    { "code": "SG", "label": "新加坡", "flag": "🇸🇬" },
    { "code": "MY", "label": "马来西亚", "flag": "🇲🇾" },
    { "code": "US", "label": "美国", "flag": "🇺🇸" },
    { "code": "GB", "label": "英国", "flag": "🇬🇧" }
  ],
  "holidays": [
    {
      "date": "2026-05-01",
      "country": "MY",
      "name": "Labour Day",
      "localName": "Hari Pekerja",
      "nameZh": "劳动节",
      "type": "Public",
      "marketingNote": "马来学员连假，线上活跃度低；推 '如何用假期准备 IT 面试' 短内容"
    }
  ]
}
```

排序：按 `date` 升序，同一天按 `countries` 声明顺序。

### Step 5: 同时覆盖 latest.json

```bash
cp "src/data/weekly-holidays/$WEEK_START.json" "src/data/weekly-holidays/latest.json"
```

admin 页面只 fetch `latest.json`，永远看到最新一周。

### Step 6: 报告

```
🗓️ 未来一周节假日 ({WEEK_START} → {WEEK_END})

🇦🇺 AU: {n} 条
🇸🇬 SG: {n} 条
🇲🇾 MY: {n} 条
🇺🇸 US: {n} 条
🇬🇧 GB: {n} 条
合计: {total} 条

文件:
  src/data/weekly-holidays/{WEEK_START}.json
  src/data/weekly-holidays/latest.json (已覆盖)

admin 查看: /weekly-holidays
下一步: /publish 推到 GitHub（admin 立即可见）
```

## 空窗口情况

如果某一周 5 国都没假日（罕见，通常至少 US/GB 月底有 bank holiday），仍然要写文件，holidays: []。admin 页面会显示"本周 5 国都在正常工作 · 平静周"。

## 调度

`/schedule` 已挂：每周日 09:00 AEST 跑一次。

## 不做什么

- ❌ 不生成海报、小红书、MP 文章
- ❌ 不写 markdown 到 articles/
- ❌ 不进 jiangren.com.au（纯 admin 内部工具）
- ❌ 不覆盖历史 JSON（{weekStartDate}.json 一旦存在不重写，避免 marketingNote 被 AI 改来改去）
