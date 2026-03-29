/**
 * Minimal YAML parser for frontmatter and _meta.yaml files.
 */
export function parse(yaml: string): Record<string, any> {
	const result: Record<string, any> = {};
	const lines = yaml.split('\n');
	let currentKey = '';
	let currentArray: string[] | null = null;

	for (const line of lines) {
		const arrayMatch = line.match(/^\s+-\s+(.+)/);
		if (arrayMatch && currentKey) {
			if (!currentArray) { currentArray = []; result[currentKey] = currentArray; }
			currentArray.push(parseValue(arrayMatch[1].trim()));
			continue;
		}
		const kvMatch = line.match(/^(\w[\w-]*)\s*:\s*(.*)/);
		if (kvMatch) {
			currentArray = null;
			currentKey = kvMatch[1];
			const rawVal = kvMatch[2].trim();
			if (rawVal === '' || rawVal === '|' || rawVal === '>') {
				result[currentKey] = rawVal === '' ? null : '';
			} else {
				result[currentKey] = parseValue(rawVal);
			}
		}
	}
	return result;
}

function parseValue(val: string): any {
	if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) return val.slice(1, -1);
	if (val === 'true') return true;
	if (val === 'false') return false;
	if (/^-?\d+(\.\d+)?$/.test(val)) return Number(val);
	if (val.startsWith('[') && val.endsWith(']')) return val.slice(1, -1).split(',').map((s) => parseValue(s.trim()));
	return val;
}
