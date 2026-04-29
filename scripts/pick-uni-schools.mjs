#!/usr/bin/env node
// 选今天该跑哪几所大学 — 核心 6 校池里挑最久没产 JSON 的 N 所。
//
// Usage:
//   node scripts/pick-uni-schools.mjs --date 2026-04-29 --count 2
//
// 输出：空格分隔的 school slug 列表（已跳过 today 已产校），方便 bash `for SCHOOL in $(...)`。
//
// 替代旧 prompt 里的内联 node -e（转义噩梦 + 难以本地复现）。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CORE_SIX = ['uq', 'umelb', 'unsw', 'usyd', 'monash', 'adelaide'];
const BANNED = new Set(['anu', 'rmit', 'uts', 'uwa']);

function parseArgs() {
	const args = { date: '', count: 2 };
	for (let i = 2; i < process.argv.length; i++) {
		const a = process.argv[i];
		if (a === '--date') args.date = process.argv[++i];
		else if (a === '--count') args.count = Number(process.argv[++i]);
	}
	if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
		console.error('❌ --date YYYY-MM-DD 必传');
		process.exit(2);
	}
	if (!Number.isFinite(args.count) || args.count < 1 || args.count > 6) {
		console.error('❌ --count 要 1-6');
		process.exit(2);
	}
	return args;
}

function latestDate(school) {
	const dir = path.join(ROOT, 'src/data/uni-news', school);
	if (!fs.existsSync(dir)) return '';
	const files = fs.readdirSync(dir)
		.filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
		.map(f => f.replace(/\.json$/, ''))
		.sort();
	return files[files.length - 1] || '';
}

function main() {
	const { date, count } = parseArgs();

	const stale = CORE_SIX
		.filter(s => !BANNED.has(s))
		.map(school => ({ school, last: latestDate(school) }))
		.filter(({ school }) => latestDate(school) !== date)
		.sort((a, b) => a.last.localeCompare(b.last));

	const picked = stale.slice(0, count).map(x => x.school);

	console.error(`pool: ${stale.map(x => `${x.school}(${x.last || 'never'})`).join(' ')}`);
	console.error(`picked ${picked.length}/${count}: ${picked.join(' ')}`);

	console.log(picked.join(' '));
}

main();
