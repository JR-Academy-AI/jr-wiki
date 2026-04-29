#!/usr/bin/env node
// 校验单校 uni-news JSON 是否符合 schema 主轴 + 运营红线。
//
// Usage:
//   node scripts/lint-uni-content.mjs --school unsw --date 2026-04-29
//
// Exit:
//   0 = OK
//   1 = 内容/格式不合规（agent 应该 rm 文件继续下一校）
//   2 = usage 错（参数 / 文件不存在）
//
// 替代旧 prompt 里 30 行 jq + grep + bash 自检。错误信息单点输出，方便 routine log 排查。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const BANNED_PATTERNS = [
	/JR Academy/i,
	/匠人学院/,
	/jiangren\.com/i,
	/加V/i,
	/\bVX\b/i,
	/薇信/,
	/包过/,
	/保过/,
	/保录取/,
];

function parseArgs() {
	const args = { school: '', date: '' };
	for (let i = 2; i < process.argv.length; i++) {
		const a = process.argv[i];
		if (a === '--school') args.school = process.argv[++i];
		else if (a === '--date') args.date = process.argv[++i];
	}
	if (!args.school || !/^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
		console.error('Usage: lint-uni-content.mjs --school <slug> --date YYYY-MM-DD');
		process.exit(2);
	}
	return args;
}

function fail(reason) {
	console.error(`❌ ${reason}`);
	process.exit(1);
}

function collectStrings(obj, acc = []) {
	if (typeof obj === 'string') acc.push(obj);
	else if (Array.isArray(obj)) obj.forEach(v => collectStrings(v, acc));
	else if (obj && typeof obj === 'object') Object.values(obj).forEach(v => collectStrings(v, acc));
	return acc;
}

function main() {
	const { school, date } = parseArgs();
	const jsonPath = path.join(ROOT, 'src/data/uni-news', school, `${date}.json`);

	if (!fs.existsSync(jsonPath)) fail(`JSON 不存在: ${jsonPath}`);

	let raw;
	try {
		raw = fs.readFileSync(jsonPath, 'utf8');
	} catch (e) {
		fail(`读文件失败: ${e.message}`);
	}

	let data;
	try {
		data = JSON.parse(raw);
	} catch (e) {
		fail(`JSON parse 失败: ${e.message}`);
	}

	for (const k of ['date', 'school', 'summary', 'news', 'quickview', 'xhsCopy']) {
		if (!(k in data)) fail(`缺必填字段 .${k}`);
	}
	if (data.school !== school) fail(`.school = "${data.school}" 但目录是 ${school}`);
	if (data.date !== date) fail(`.date = "${data.date}" 但文件名是 ${date}`);

	if (!Array.isArray(data.news)) fail('.news 必须是数组');
	if (data.news.length < 2 || data.news.length > 4) {
		fail(`.news 长度 = ${data.news.length}（需要 2-4）`);
	}

	const xc = data.xhsCopy;
	if (!xc || typeof xc !== 'object') fail('.xhsCopy 必须是对象');
	for (const p of ['p1', 'p2', 'p3', 'p4', 'p5']) {
		const item = xc[p];
		if (!item) fail(`.xhsCopy.${p} 缺失`);
		if (typeof item.title !== 'string' || !item.title.trim()) fail(`.xhsCopy.${p}.title 缺/空`);
		if (typeof item.body !== 'string' || !item.body.trim()) fail(`.xhsCopy.${p}.body 缺/空`);
		const tags = item.tags;
		if (!Array.isArray(tags) && typeof tags !== 'string') fail(`.xhsCopy.${p}.tags 缺`);
	}

	if (data.mp && typeof data.mp.title === 'string') {
		if (/｜.*日报\s*$/.test(data.mp.title)) {
			fail(`.mp.title 含禁用「｜...日报」后缀: ${data.mp.title}`);
		}
	}

	// 封号红线只扫小红书+微信正文（外发给读者的部分）
	// 不扫 mp.cta（公众号底部 CTA 允许写"关注 JR Academy"）、
	// 不扫 drafts.sensitivityScan[].rule（rule 名本身就是规则文本）
	const userFacingStrings = [];
	for (const p of ['p1', 'p2', 'p3', 'p4', 'p5']) {
		const item = xc[p];
		if (item?.body) userFacingStrings.push(item.body);
		if (Array.isArray(item?.tags)) userFacingStrings.push(...item.tags);
		else if (typeof item?.tags === 'string') userFacingStrings.push(item.tags);
	}
	if (Array.isArray(data.drafts?.sections)) {
		for (const sec of data.drafts.sections) {
			if (sec?.body) userFacingStrings.push(sec.body);
		}
	}
	for (const s of userFacingStrings) {
		for (const re of BANNED_PATTERNS) {
			if (re.test(s)) {
				fail(`封号红线命中 [${re.source}]: "${String(s).slice(0, 80)}..."`);
			}
		}
	}

	console.log(`✅ ${school}/${date}.json OK · news=${data.news.length} · xhsCopy=5/5`);
	process.exit(0);
}

main();
