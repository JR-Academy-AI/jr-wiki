# 每日 AI 新闻自动抓取系统 — Setup 指南

> 每天早上 3 点自动抓 20 条 AI 新闻（全球 10 条 + 澳洲 10 条），调用 Claude API
> 生成中文简介和摘要，保存到 `~/news/news_YYYY_MM_DD.md`。

---

## 目录结构

```
scripts/news-scraper/
├── news_scraper.py     # 主脚本
├── requirements.txt    # Python 依赖
└── SETUP.md            # 本文档
```

---

## 一步步配置

### Step 1. 准备 Python 环境

要求 Python **3.10+**（因为代码里用了 `tuple` / `list` 等新版类型提示）。

```bash
python3 --version
```

### Step 2. 安装依赖（推荐用虚拟环境）

```bash
cd ~/jr-wiki/scripts/news-scraper

# 创建并激活虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

记下虚拟环境里的 Python 绝对路径，后面 crontab 要用：

```bash
which python3
# 输出类似：/home/user/jr-wiki/scripts/news-scraper/venv/bin/python3
```

### Step 3. 配置 Claude API Key

```bash
export ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxxxxxx"
```

建议把这一行加到 `~/.bashrc` 或 `~/.zshrc`，之后 `source ~/.bashrc` 让它立刻生效。

### Step 4. 手动测试一次

```bash
cd ~/jr-wiki/scripts/news-scraper
source venv/bin/activate
python3 news_scraper.py
```

预期输出：

```
[信息] 抓取「🌍 全球AI新闻」...
[信息] 「🌍 全球AI新闻」抓到 10 条，开始生成摘要...
[信息] 抓取「🇦🇺 澳洲IT/AI新闻」...
[信息] 「🇦🇺 澳洲IT/AI新闻」抓到 10 条，开始生成摘要...
[完成] 已生成 /home/user/news/news_YYYY_MM_DD.md
```

打开 `~/news/news_YYYY_MM_DD.md` 确认内容符合预期。

---

## Step 5. 设置 crontab（每天早上 3 点自动运行）

### 5.1 查看路径

先把这两个绝对路径记下来，后面要替换：

```bash
# 虚拟环境的 Python
which python3
# => /home/user/jr-wiki/scripts/news-scraper/venv/bin/python3

# 脚本位置
realpath news_scraper.py
# => /home/user/jr-wiki/scripts/news-scraper/news_scraper.py
```

### 5.2 编辑 crontab

```bash
crontab -e
```

在文件末尾加入下面这行（**记得替换 API Key 和路径**）：

```cron
0 3 * * * ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxxxxxx" /home/user/jr-wiki/scripts/news-scraper/venv/bin/python3 /home/user/jr-wiki/scripts/news-scraper/news_scraper.py >> /home/user/jr-wiki/scripts/news-scraper/cron.log 2>&1
```

cron 字段含义：

```
0 3 * * *  →  每天 03:00 运行
│ │ │ │ │
│ │ │ │ └── 星期（0-6, 0=周日）
│ │ │ └──── 月份（1-12）
│ │ └────── 日期（1-31）
│ └──────── 小时（0-23）
└────────── 分钟（0-59）
```

### 5.3（可选）API Key 放到系统环境里，crontab 更干净

把 Key 写到 `~/.profile`：

```bash
echo 'export ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxxxxxx"' >> ~/.profile
```

然后 crontab 行改用 bash 登录 shell 来继承环境：

```cron
0 3 * * * /bin/bash -l -c '/home/user/jr-wiki/scripts/news-scraper/venv/bin/python3 /home/user/jr-wiki/scripts/news-scraper/news_scraper.py' >> /home/user/jr-wiki/scripts/news-scraper/cron.log 2>&1
```

### 5.4 验证 crontab 已生效

```bash
crontab -l
```

---

## Step 6. 日常排查

```bash
# 查看今天生成的文件
ls -lh ~/news/

# 查看 cron 执行日志
tail -n 100 ~/jr-wiki/scripts/news-scraper/cron.log

# 查看 cron 守护进程状态（Linux）
systemctl status cron
```

如果 cron 没触发：

1. 确认 cron 服务在运行：`sudo systemctl start cron`
2. 确认时区正确：`timedatectl`（cron 用系统时区）
3. 用绝对路径调用 Python，不要依赖 PATH
4. 把 stderr 一起重定向到日志：`>> xxx.log 2>&1`

---

## FAQ

**Q: Google News RSS 会不会被墙？**
A: 在部分网络环境下 `news.google.com` 无法访问。如果报 `urlopen error`，可以在脚本前加代理：

```bash
export HTTPS_PROXY=http://127.0.0.1:7890
```

**Q: 想改关键词/条数怎么办？**
A: 编辑 `news_scraper.py` 顶部的 `NEWS_PER_CATEGORY` 和 `CATEGORIES`。

**Q: 想加更多分类？**
A: 在 `CATEGORIES` 列表里追加新的 dict 即可，脚本会自动多渲染一个 section。

**Q: 换 Claude 模型？**
A: 改 `news_scraper.py` 顶部的 `MODEL` 常量。

---

## 卸载

```bash
# 删除 crontab 里那一行
crontab -e

# 删除代码
rm -rf ~/jr-wiki/scripts/news-scraper

# 删除已生成的新闻（可选）
rm -rf ~/news
```
