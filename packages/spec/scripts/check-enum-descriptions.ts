/**
 * Validate that x-enum-descriptions and x-scope-roles cover exactly the enum
 * members they annotate — in both the RU spec and the EN one.
 *
 * Why a separate check: overlay:validate only verifies that a translation for
 * the x-enum-descriptions block EXISTS. It never looks inside, so a member
 * added to an enum without a description, or a description left behind after a
 * member was renamed, passes it unnoticed.
 *
 * Keys are compared after the same normalization the docs parser applies
 * (see normalizeEnumDescriptions in apps/docs/lib/openapi/parser.ts): TypeSpec
 * rejects quoted keys in object literals, so a member named `chats:read` is
 * emitted as `chats_read`. Comparing raw keys would fail on OAuthScope alone
 * and force a permanent exception; comparing the way the consumer reads them
 * keeps the check honest and exception-free.
 *
 * Usage: bun scripts/check-enum-descriptions.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

/** Extension keys whose entries must line up with the enum members. */
const KEYED_BY_ENUM_MEMBER = ['x-enum-descriptions', 'x-scope-roles'] as const;

interface Problem {
	file: string;
	schema: string;
	extension: string;
	missing: string[];
	unknown: string[];
}

/** Underscored member name → enum value, mirroring the TypeSpec emitter. */
function resolveKey(key: string, enumValues: string[]): string {
	if (enumValues.includes(key)) return key;
	const byUnderscore = new Map(enumValues.map((v) => [v.replace(/:/g, '_'), v]));
	return byUnderscore.get(key) ?? key;
}

function checkDocument(file: string, doc: any): Problem[] {
	const problems: Problem[] = [];
	const schemas = doc?.components?.schemas ?? {};

	for (const [schemaName, schema] of Object.entries<any>(schemas)) {
		for (const extension of KEYED_BY_ENUM_MEMBER) {
			const block = schema?.[extension];
			if (!block || typeof block !== 'object') continue;

			const enumValues: string[] = Array.isArray(schema.enum) ? schema.enum : [];
			if (enumValues.length === 0) {
				problems.push({
					file,
					schema: schemaName,
					extension,
					missing: [],
					unknown: ['схема размечена, но не является enum'],
				});
				continue;
			}

			const described = new Set(Object.keys(block).map((k) => resolveKey(k, enumValues)));
			const missing = enumValues.filter((v) => !described.has(v));
			const unknown = [...described].filter((v) => !enumValues.includes(v));

			if (missing.length > 0 || unknown.length > 0) {
				problems.push({ file, schema: schemaName, extension, missing, unknown });
			}
		}
	}

	return problems;
}

function main() {
	const specDir = path.resolve(__dirname, '..');
	const files = ['openapi.yaml', 'openapi.en.yaml'];

	const problems: Problem[] = [];
	let annotated = 0;

	for (const file of files) {
		const full = path.join(specDir, file);
		if (!fs.existsSync(full)) {
			console.error(`✗ Нет файла ${file} — сначала соберите спеку`);
			process.exit(1);
		}
		const doc = yaml.load(fs.readFileSync(full, 'utf8')) as any;
		annotated += Object.values<any>(doc?.components?.schemas ?? {}).filter((s) =>
			KEYED_BY_ENUM_MEMBER.some((k) => s?.[k])
		).length;
		problems.push(...checkDocument(file, doc));
	}

	if (problems.length === 0) {
		console.log(`✓ Описания enum на месте: проверено ${annotated} размеченных схем в ${files.length} файлах`);
		process.exit(0);
	}

	console.error(`\nРасхождения описаний enum (${problems.length}):\n`);
	for (const p of problems) {
		console.error(`  ✗ ${p.file} → ${p.schema}.${p.extension}`);
		if (p.missing.length > 0) console.error(`      нет описания у: ${p.missing.join(', ')}`);
		if (p.unknown.length > 0) console.error(`      описание без члена enum: ${p.unknown.join(', ')}`);
	}
	console.error(
		'\nКлючи сравниваются после нормализации `:` → `_`, как их читает дока.' +
			'\nПравить надо тело enum в typespec.tsp и x-enum-descriptions рядом с ним,' +
			'\nа для английского — соответствующую запись в overlay.en.yaml.\n'
	);
	process.exit(1);
}

main();
