#!/usr/bin/env node
// 扫 src/data/ai-daily/*.json 实际产出，重建 src/static/ai-news-posters/index.html 的 grid 区。
// /ai-daily-news 跑完后调一次，schedule 跑完也调，build.ts 也调。
//
// 用法：
//   bun run scripts/rebuild-ai-news-hub.mjs
//
// 替换策略：用 <!-- AI-HUB-GRID:START --> ... <!-- AI-HUB-GRID:END --> 包裹自动生成区。
// 首次运行如果 hub 没有 marker，会自动加入并保留 footer / empty-card 占位。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'src/data/ai-daily');
const HUB_FILE = path.join(ROOT, 'src/static/ai-news-posters/index.html');
const POSTERS_DIR = path.join(ROOT, 'src/static/ai-news-posters');

const ACCENT_COLORS = ['c-red', 'c-blue', 'c-green', 'c-purple']; // 循环用

function tokensToText(tokens) {
	if (!Array.isArray(tokens)) return '';
	return tokens.map(t => (t && typeof t === 'object' ? t.text || '' : String(t))).join('').replace(/\s+/g, ' ').trim();
}

function htmlEscape(s) {
	return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildCard(date, data, idx) {
	const [yyyy, mm, dd] = date.split('-');
	const dateDisplay = `${yyyy} · ${mm} · ${dd}`;
	const colorClass = ACCENT_COLORS[idx % ACCENT_COLORS.length];

	// d-hook: 取前 2 条 summary.items 的 t 字段（短标题），换行分开
	const items = data.summary?.items || [];
	const hook1 = items[0]?.t || tokensToText(data.summary?.hook) || data.date;
	const hook2 = items[1]?.t || '';
	const hookHtml = hook2 ? `${htmlEscape(hook1)}<br>${htmlEscape(hook2)}` : htmlEscape(hook1);

	// d-list: 5 条 summary.items
	const listItems = items.map((it, i) => {
		const num = it.num || String(i + 1).padStart(2, '0');
		const text = htmlEscape(it.t || '');
		return `          <div><b>${htmlEscape(num)}</b>${text}</div>`;
	}).join('\n');

	const badge = `${items.length + 1} 张`;

	return `    <!-- ================================ -->
    <!-- ${date} · ${hook1.slice(0, 30)} -->
    <!-- ================================ -->
    <a class="day-card" href="./${date}/">
      <div class="day-cover ${colorClass}">
        <div class="d-badge">${badge}</div>
        <div class="d-date">${dateDisplay}</div>
        <div class="d-hook">${hookHtml}</div>
      </div>
      <div class="day-body">
        <div class="d-tag">📰 AI 日报</div>
        <div class="d-list">
${listItems}
        </div>
        <div class="d-meta">1 合集 + ${items.length} 单图 · 1242×1660 · 点击下载</div>
      </div>
    </a>`;
}

function buildFallbackCard(date, idx) {
	const [yyyy, mm, dd] = date.split('-');
	const dateDisplay = `${yyyy} · ${mm} · ${dd}`;
	const colorClass = ACCENT_COLORS[idx % ACCENT_COLORS.length];
	return `    <!-- ================================ -->
    <!-- ${date} · 历史归档 (无 JSON) -->
    <!-- ================================ -->
    <a class="day-card" href="./${date}/">
      <div class="day-cover ${colorClass}">
        <div class="d-badge">归档</div>
        <div class="d-date">${dateDisplay}</div>
        <div class="d-hook">点击查看<br>当日海报</div>
      </div>
      <div class="day-body">
        <div class="d-tag">📰 AI 日报 · 历史</div>
        <div class="d-list">
          <div style="padding:14px 0;color:#666;font-size:12px;">老架构归档（无 summary 数据），点击进入海报页查看</div>
        </div>
        <div class="d-meta">点击查看完整海报集</div>
      </div>
    </a>`;
}

const EMPTY_CARD_PLACEHOLDER = `    <!-- ================================ -->
    <!-- 占位：待生成模板示意 -->
    <!-- ================================ -->
    <div class="empty-card">
      <h3>📆 想要某一天的海报？</h3>
      <p>跑 skill 即可按需补档：</p>
      <p><code>src/static/ai-news-posters/YYYY-MM-DD/</code></p>
      <p style="margin-top:14px;font-size:11px;">repo：<code>jr-wiki</code> · 构建输出：<code>dist/ai-news-posters/</code></p>
    </div>`;

function main() {
	if (!fs.existsSync(DATA_DIR)) {
		console.error(`❌ ${DATA_DIR} 不存在`);
		process.exit(1);
	}
	if (!fs.existsSync(HUB_FILE)) {
		console.error(`❌ ${HUB_FILE} 不存在`);
		process.exit(1);
	}

	// 1. 海报目录是 source of truth (老日期可能只有 HTML 没 JSON)
	const validDates = fs.readdirSync(POSTERS_DIR)
		.filter(f => /^\d{4}-\d{2}-\d{2}$/.test(f))
		.filter(d => fs.existsSync(path.join(POSTERS_DIR, d, 'index.html')))
		.sort()
		.reverse();

	console.log(`📂 找到 ${validDates.length} 天有海报 HTML`);

	// 2. JSON 是增强信息（有就用 summary.items，没有就 fallback）
	const cards = validDates.map((d, i) => {
		const jsonPath = path.join(DATA_DIR, `${d}.json`);
		if (fs.existsSync(jsonPath)) {
			const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
			return buildCard(d, json, i);
		}
		// Fallback: 老日期没 JSON，从 HTML 抓标题或显示日期
		console.log(`  ⚠️  ${d} 无 JSON，用 fallback card`);
		return buildFallbackCard(d, i);
	}).join('\n\n');

	const newGridContent = `\n${cards}\n\n${EMPTY_CARD_PLACEHOLDER}\n  `;

	// 4. 替换 hub index.html
	let html = fs.readFileSync(HUB_FILE, 'utf-8');

	const startMarker = '<!-- AI-HUB-GRID:START -->';
	const endMarker = '<!-- AI-HUB-GRID:END -->';

	if (html.includes(startMarker) && html.includes(endMarker)) {
		// 用 marker 替换
		const re = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`);
		html = html.replace(re, `${startMarker}${newGridContent}${endMarker}`);
	} else {
		// 首次运行：找 <div class="grid"> 内容并替换 + 加 marker
		const gridRe = /(<div class="grid">)([\s\S]*?)(<\/div>\s*<footer>)/;
		const match = html.match(gridRe);
		if (!match) {
			console.error('❌ 找不到 <div class="grid">...<footer> 结构，无法首次替换');
			process.exit(1);
		}
		html = html.replace(gridRe, `$1\n  ${startMarker}${newGridContent}${endMarker}\n  $3`);
	}

	fs.writeFileSync(HUB_FILE, html);
	console.log(`✅ 写入 ${HUB_FILE} (${validDates.length} cards)`);
	console.log(`   倒序: ${validDates.slice(0, 5).join(', ')}${validDates.length > 5 ? ` ... +${validDates.length - 5}` : ''}`);
}

main();
