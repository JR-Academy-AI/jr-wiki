#!/usr/bin/env node
// 扫 src/static/ai-news-posters/{date}/ 目录 + src/data/ai-daily/{date}.json
// 在 src/static/ai-news-posters/index.html 的 AI-HUB-GRID:START/END 区段
// 重建 day-card grid。
// 由 AI Daily Render routine 在 push 之前调用，保证当天卡片自动出现在 hub 页。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HUB_DIR = path.join(ROOT, 'src/static/ai-news-posters');
const INDEX_PATH = path.join(HUB_DIR, 'index.html');
const JSON_DIR = path.join(ROOT, 'src/data/ai-daily');

const COLORS = ['c-red', 'c-blue', 'c-green', 'c-purple', 'c-orange'];

const START_MARK = '<!-- AI-HUB-GRID:START -->';
const END_MARK = '<!-- AI-HUB-GRID:END -->';

function escapeHtml(s) {
	return String(s ?? '').replace(/[&<>"']/g, c => (
		{ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
	));
}

function findDates() {
	if (!fs.existsSync(HUB_DIR)) return [];
	return fs.readdirSync(HUB_DIR)
		.filter(f => /^\d{4}-\d{2}-\d{2}$/.test(f))
		.filter(f => {
			const stat = fs.statSync(path.join(HUB_DIR, f), { throwIfNoEntry: false });
			return stat?.isDirectory();
		})
		.sort((a, b) => b.localeCompare(a));
}

function readJson(date) {
	const p = path.join(JSON_DIR, `${date}.json`);
	if (!fs.existsSync(p)) return null;
	try {
		return JSON.parse(fs.readFileSync(p, 'utf8'));
	} catch (e) {
		console.warn(`⚠️  ${date} JSON parse failed: ${e.message}`);
		return null;
	}
}

function renderRichCard(date, data, color) {
	const items = (data?.summary?.items || []).slice(0, 5);
	if (items.length === 0) return renderArchiveCard(date, color);

	const [y, mo, d] = date.split('-');
	const top2 = items.slice(0, 2).map(it => escapeHtml(it.t || '')).join('<br>');
	const list = items.map(it => (
		`          <div><b>${escapeHtml(it.num || '')}</b>${escapeHtml(it.t || '')}</div>`
	)).join('\n');

	return `    <!-- ================================ -->
    <!-- ${date} · ${escapeHtml((items[0]?.t || '').slice(0, 50))} -->
    <!-- ================================ -->
    <a class="day-card" href="./${date}/">
      <div class="day-cover ${color}">
        <div class="d-badge">6 张</div>
        <div class="d-date">${y} · ${mo} · ${d}</div>
        <div class="d-hook">${top2}</div>
      </div>
      <div class="day-body">
        <div class="d-tag">📰 AI 日报</div>
        <div class="d-list">
${list}
        </div>
        <div class="d-meta">1 合集 + 5 单图 · 1242×1660 · 点击下载</div>
      </div>
    </a>`;
}

function renderArchiveCard(date, color) {
	const [y, mo, d] = date.split('-');
	return `    <!-- ================================ -->
    <!-- ${date} · 历史归档 (无 JSON) -->
    <!-- ================================ -->
    <a class="day-card" href="./${date}/">
      <div class="day-cover ${color}">
        <div class="d-badge">归档</div>
        <div class="d-date">${y} · ${mo} · ${d}</div>
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

function renderEmptyCard() {
	return `    <!-- ================================ -->
    <!-- 占位：待生成模板示意 -->
    <!-- ================================ -->
    <div class="empty-card">
      <h3>📆 想要某一天的海报？</h3>
      <p>跑 skill 即可按需补档：</p>
      <p><code>src/static/ai-news-posters/YYYY-MM-DD/</code></p>
      <p style="margin-top:14px;font-size:11px;">repo：<code>jr-wiki</code> · 构建输出：<code>dist/ai-news-posters/</code></p>
    </div>`;
}

function buildGrid(dates) {
	const cards = dates.map((date, i) => {
		const data = readJson(date);
		const color = COLORS[i % COLORS.length];
		return data ? renderRichCard(date, data, color) : renderArchiveCard(date, color);
	});
	cards.push(renderEmptyCard());
	return cards.join('\n\n');
}

function main() {
	const dates = findDates();
	if (dates.length === 0) {
		console.error('❌ 没找到任何日期目录');
		process.exit(1);
	}

	const html = fs.readFileSync(INDEX_PATH, 'utf8');
	const startIdx = html.indexOf(START_MARK);
	const endIdx = html.indexOf(END_MARK);
	if (startIdx === -1 || endIdx === -1) {
		console.error(`❌ index.html 找不到 ${START_MARK} / ${END_MARK} 标记`);
		process.exit(1);
	}

	const before = html.slice(0, startIdx + START_MARK.length);
	const after = html.slice(endIdx);
	const grid = buildGrid(dates);
	const next = `${before}\n${grid}\n  ${after}`;

	if (next === html) {
		console.log(`✓ 无变化 (${dates.length} 张卡片，最新 ${dates[0]})`);
		return;
	}

	fs.writeFileSync(INDEX_PATH, next);
	console.log(`✓ index.html 重建 — ${dates.length} 张卡片，最新 ${dates[0]}`);
}

main();
