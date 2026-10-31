/**
 * Apply an OpenAPI Overlay v1.0.0 to a base spec.
 *
 * The build fails (exit 1) when:
 * - a target passes through a `$ref`, misses a segment or matches nothing (see overlay-target.ts);
 * - an update adds a key the base node does not have;
 * - Cyrillic text is left outside `default`, `enum` and `const` (server values stay as they are);
 * - a dictionary entry below is not used;
 * - the English spec differs from the Russian one anywhere except texts: description, summary,
 *   title, x-enum-descriptions, example and examples.
 *
 * Usage: bun scripts/apply-overlay.ts [--base openapi.yaml] [--overlay overlay.en.yaml] [--output openapi.en.yaml]
 */
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { resolveTarget } from './overlay-target';

// ---------------------------------------------------------------------------
// Deep merge (only overwrites leaf values, preserves structure)
// ---------------------------------------------------------------------------

function deepMerge(target: any, source: any): any {
	if (source === null || source === undefined) return target;
	if (typeof source !== 'object' || Array.isArray(source)) return source;
	if (typeof target !== 'object' || target === null || Array.isArray(target)) return source;

	const result = { ...target };
	for (const key of Object.keys(source)) {
		result[key] = deepMerge(result[key], source[key]);
	}
	return result;
}

// ---------------------------------------------------------------------------
// Post-processing: translate remaining Russian strings
// ---------------------------------------------------------------------------

const CYRILLIC_RE = /[а-яА-ЯёЁ]/;

/** Keys whose subtree is data shown as an example: only there the dictionary below applies. */
const EXAMPLE_KEYS = new Set(['example', 'examples']);

/** Schema keywords holding values the server uses as they are: never translated. */
const VALUE_KEYS = new Set(['default', 'enum', 'const']);

/** Keys whose subtree is text: the English spec may differ from the Russian one only there. */
const TEXT_KEYS = new Set(['description', 'summary', 'title', 'x-enum-descriptions', ...EXAMPLE_KEYS]);

/**
 * Descriptions of the response wrapper templates (`DataResponse<T>` and friends in typespec.tsp).
 * TypeSpec inlines them into every response, so they are translated here by their exact text
 * and only at `paths.*.*.responses.*.content.*.schema.description`.
 */
const RESPONSE_WRAPPERS: Record<string, string> = {
	'Обертка ответа с данными и пагинацией': 'Response wrapper with data and pagination',
	'Обертка ответа с данными': 'Response wrapper with data',
	'Обертка ответа с данными и метаданными': 'Response wrapper with data and metadata',
	'Обертка ответа поисковых результатов с данными и пагинацией': 'Search results response wrapper with data and pagination',
};

/**
 * Translations of example values (`example` and `examples` subtrees only).
 * Descriptions and every other text go to overlay.en.yaml. An unused entry fails the build.
 */
const RU_TO_EN: Record<string, string> = {
	// Example values used in bot/voice examples
	'Бот задач': 'Tasks bot',
	'Бот релизов': 'Release bot',
	'Заказ от {{ client }} на сумму {{ amount }} ₽': 'Order from {{ client }} for {{ amount }} ₽',
	'{"client": "ООО Ромашка", "amount": 15000}': '{"client": "Acme Corp", "amount": 15000}',
	'Привет, посмотри пожалуйста последний отчёт': 'Hi, please take a look at the latest report',
	// Bot tokens, catalog page and scope catalog examples
	'Сервер уведомлений': 'Notification server',
	'Собирает сводку по задачам и присылает её в чат': 'Collects a summary of tasks and sends it to the chat',
	'Собирает сводку по задачам Jira и присылает её в чат': 'Collects a summary of Jira tasks and sends it to the chat',
	'Отправка сообщений': 'Send messages',
	'Сообщения': 'Messages',
	'Работа с сообщениями': 'Working with messages',
	'Только чтение': 'Read only',
	'Администратор': 'Administrator',

	// Example values — models
	'Разработка': 'Development',
	'футболки': 't-shirts',
	'Олег': 'Oleg',
	'задач': 'task',
	'Петров': 'Petrov',
	'Продукт': 'Product',
	'Санкт-Петербург': 'Saint Petersburg',
	'Город': 'City',
	'Мой API токен': 'My API Token',
	'Поле не может быть пустым': 'Field cannot be empty',
	'Отдел разработки': 'Engineering',
	'Старший разработчик': 'Senior Developer',
	'Текст сообщения': 'Message text',
	'Бассейн': 'Pool',
	'Новое название тега': 'New tag name',
	'Очень занят': 'Very busy',
	'Вернусь после 15:00': 'Back after 3 PM',

	// Example values — messages and buttons
	'Подробнее': 'Learn more',
	'Отлично!': 'Great!',
	'Бот Поддержки': 'Support Bot',
	'Статья: Отправка файлов': 'Article: Sending files',
	'Пример отправки файлов на удаленный сервер': 'Example of sending files to a remote server',
	'Синий склад': 'Blue warehouse',

	// Example titles (`summary` of request examples)
	'Минимальный запрос': 'Minimal request',
	'Сообщение с кнопкой': 'Message with a button',

	// Example values — messages content
	'Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)':
		'Yesterday we sold 756 t-shirts (10% more than last Sunday)',
	'Вот попробуйте написать правильно это с первого раза: Будущий, Полощи, Прийти, Грейпфрут, Мозаика, Бюллетень, Дуршлаг, Винегрет.':
		'Try to spell these correctly on the first attempt: bureaucracy, accommodate, definitely, entrepreneur, liaison, necessary, surveillance, questionnaire.',
	'Забрать со склада 21 заказ': 'Pick up 21 orders from the warehouse',

	// Example values — user status
	'Я в отпуске до 15 апреля. По срочным вопросам обращайтесь к @ivanov.':
		'I am on vacation until April 15. For urgent matters, contact @ivanov.',

	// Example values — forms / views
	'Уведомление об отпуске': 'Vacation notification',
	'Закрыть': 'Close',
	'Отправить заявку': 'Submit request',
	'Рассылки': 'Newsletters',
	'Выберите интересующие вас рассылки': 'Select the newsletters you are interested in',
	'Ничего': 'None',
	'Каждый день бот будет присылать список новых задач в вашей команде':
		'Every day the bot will send a list of new tasks in your team',
	'Дата начала отпуска': 'Vacation start date',
	'Укажите дату начала отпуска': 'Select the vacation start date',
	'Заявление': 'Application',
	'Загрузите заполненное заявление с электронной подписью (в формате pdf, jpg или png)':
		'Upload the completed application with an electronic signature (in pdf, jpg, or png format)',
	'Основная информация': 'General information',
	'Описание отпуска': 'Vacation description',
	'Куда собираетесь и что будете делать': 'Where are you going and what will you be doing',
	'Начальный текст': 'Initial text',
	'Возможно вам подскаджут, какие места лучше посетить':
		'Others might suggest the best places to visit',
	'Информацию о доступных вам днях отпуска вы можете прочитать по [ссылке](https://example.com/timeoff)':
		'You can read about your available vacation days at [this link](https://example.com/timeoff)',
	'Заполните форму. После отправки формы в общий чат будет отправлено текстовое уведомление, а ваш отпуск будет сохранен в базе.':
		'Fill out the form. After submitting, a text notification will be sent to the general chat, and your vacation will be saved in the database.',
	'Доступность': 'Availability',
	'Если вы не планируете выходить на связь, то выберите вариант Ничего':
		'If you do not plan to be available, select None',
	'Выберите команду': 'Select a team',
	'Выберите одну из команд': 'Select one of the teams',
	'Время рассылки': 'Newsletter time',
	'Укажите, в какое время присылать выбранные рассылки':
		'Specify the time to send the selected newsletters',
};

// ---------------------------------------------------------------------------
// Walking the spec with keyword context
// ---------------------------------------------------------------------------

/**
 * Where a node sits: `zone` is set inside text (`description`…) or example subtrees,
 * `propsMap` inside a `properties` map, whose keys are property names, not keywords.
 */
interface WalkCtx {
	zone: 'text' | 'example' | null;
	propsMap: boolean;
}

const ROOT_CTX: WalkCtx = { zone: null, propsMap: false };

function isSchemaLike(obj: any): boolean {
	return ['type', 'enum', 'const', 'allOf', 'anyOf', 'oneOf', '$ref'].some((k) => k in obj);
}

/** Context of `obj[key]`, plus whether it is a server value (`default`, `enum`, `const`). */
function childCtx(obj: any, key: string, ctx: WalkCtx): { ctx: WalkCtx; isValue: boolean } {
	if (Array.isArray(obj) || ctx.zone !== null) return { ctx, isValue: false };
	if (ctx.propsMap) return { ctx: ROOT_CTX, isValue: false };
	if (TEXT_KEYS.has(key)) return { ctx: { zone: EXAMPLE_KEYS.has(key) ? 'example' : 'text', propsMap: false }, isValue: false };
	if (key === 'properties') return { ctx: { zone: null, propsMap: true }, isValue: false };
	return { ctx: ROOT_CTX, isValue: VALUE_KEYS.has(key) && isSchemaLike(obj) };
}

function normalize(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}

/** Replace Russian example values using RU_TO_EN. Only `example` and `examples` subtrees are touched. */
function translateExamples(obj: any, ctx: WalkCtx, used: Set<string>): number {
	if (obj === null || typeof obj !== 'object') return 0;
	let count = 0;
	for (const key of Object.keys(obj)) {
		const { ctx: next, isValue } = childCtx(obj, key, ctx);
		if (isValue) continue;
		const val = obj[key];
		if (typeof val === 'string') {
			if (next.zone !== 'example' || !CYRILLIC_RE.test(val)) continue;
			const normalized = normalize(val);
			if (RU_TO_EN[normalized] !== undefined) {
				obj[key] = RU_TO_EN[normalized];
				used.add(normalized);
				count++;
			}
		} else {
			count += translateExamples(val, next, used);
		}
	}
	return count;
}

/** Translate the inlined response wrapper descriptions (see RESPONSE_WRAPPERS). */
function translateResponseWrappers(doc: any, used: Set<string>): number {
	let count = 0;
	for (const methods of Object.values<any>(doc.paths ?? {})) {
		for (const op of Object.values<any>(methods ?? {})) {
			for (const response of Object.values<any>(op?.responses ?? {})) {
				for (const media of Object.values<any>(response?.content ?? {})) {
					const schema = media?.schema;
					if (typeof schema?.description !== 'string') continue;
					const normalized = normalize(schema.description);
					if (RESPONSE_WRAPPERS[normalized] !== undefined) {
						schema.description = RESPONSE_WRAPPERS[normalized];
						used.add(normalized);
						count++;
					}
				}
			}
		}
	}
	return count;
}

/** Paths of strings with Cyrillic text left after translation (server values excluded). */
function findRemainingCyrillic(obj: any, ctx: WalkCtx, at: string, found: string[]): void {
	if (obj === null || typeof obj !== 'object') return;
	for (const key of Object.keys(obj)) {
		const { ctx: next, isValue } = childCtx(obj, key, ctx);
		if (isValue) continue;
		const val = obj[key];
		const childAt = Array.isArray(obj) ? `${at}[${key}]` : `${at}.${key}`;
		if (typeof val === 'string') {
			if (CYRILLIC_RE.test(val)) found.push(`${childAt} = "${val.substring(0, 80)}..."`);
		} else {
			findRemainingCyrillic(val, next, childAt, found);
		}
	}
}

/**
 * Structural parity: the English spec must equal the Russian one everywhere except
 * strings inside text and example subtrees. Keys, types, array lengths and every
 * other value (`default`, `enum`, `const`, `required`, formats, limits) must match.
 */
function findStructuralDiffs(ru: any, en: any, ctx: WalkCtx, at: string, found: string[]): void {
	const kind = (v: any) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
	if (kind(ru) !== kind(en)) {
		found.push(`${at}: ${kind(ru)} in RU, ${kind(en)} in EN`);
		return;
	}
	if (ru === null || typeof ru !== 'object') {
		if (ru !== en && !(typeof ru === 'string' && ctx.zone !== null)) {
			found.push(`${at}: RU ${JSON.stringify(ru)}, EN ${JSON.stringify(en)}`);
		}
		return;
	}
	if (Array.isArray(ru) && ru.length !== en.length) {
		found.push(`${at}: ${ru.length} items in RU, ${en.length} in EN`);
		return;
	}
	for (const key of Object.keys(en)) {
		if (!(key in ru)) found.push(`${at}.${key}: added in EN`);
	}
	for (const key of Object.keys(ru)) {
		const childAt = Array.isArray(ru) ? `${at}[${key}]` : `${at}.${key}`;
		if (!(key in en)) {
			found.push(`${childAt}: missing in EN`);
			continue;
		}
		findStructuralDiffs(ru[key], en[key], childCtx(ru, key, ctx).ctx, childAt, found);
	}
}

function reportAndExit(title: string, items: string[], fix: string): never {
	console.error(`\nERROR: ${title} (${items.length}):`);
	for (const item of items.slice(0, 40)) console.error(`  ✗ ${item}`);
	if (items.length > 40) console.error(`  ... and ${items.length - 40} more`);
	console.error(`\nFix: ${fix}`);
	process.exit(1);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
	const specDir = path.resolve(__dirname, '..');
	let basePath = path.join(specDir, 'openapi.yaml');
	let overlayPath = path.join(specDir, 'overlay.en.yaml');
	let outputPath = path.join(specDir, 'openapi.en.yaml');

	// Parse args
	const args = process.argv.slice(2);
	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--base' && args[i + 1]) basePath = path.resolve(args[++i]);
		if (args[i] === '--overlay' && args[i + 1]) overlayPath = path.resolve(args[++i]);
		if (args[i] === '--output' && args[i + 1]) outputPath = path.resolve(args[++i]);
	}

	// Read files
	const baseText = fs.readFileSync(basePath, 'utf8');
	const baseDoc = yaml.load(baseText) as any;
	const ruDoc = yaml.load(baseText) as any;
	const overlay = yaml.load(fs.readFileSync(overlayPath, 'utf8')) as any;

	// Validate overlay structure
	if (!overlay.overlay || !overlay.info || !Array.isArray(overlay.actions)) {
		throw new Error('Invalid overlay: must have "overlay", "info", and "actions" fields');
	}

	const failed: string[] = [];
	let applied = 0;

	for (const action of overlay.actions) {
		try {
			const { parent, key } = resolveTarget(baseDoc, action.target);
			const update = action.update;
			if (update === null || typeof update !== 'object' || Array.isArray(update)) {
				throw new Error(`Only "update" with an object of fields is supported. Target: ${action.target}`);
			}
			const absent = Object.keys(update).filter((k) => parent[key]?.[k] === undefined);
			if (absent.length > 0) {
				throw new Error(`Update adds ${absent.join(', ')} absent in the base spec. Target: ${action.target}`);
			}
			parent[key] = deepMerge(parent[key], update);
			applied++;
		} catch (err) {
			failed.push((err as Error).message);
		}
	}
	if (failed.length > 0) {
		reportAndExit(
			'overlay actions failed',
			failed,
			'point each target at the node where the text lives (the component path, not a path through $ref), ' +
				'and delete targets whose node no longer exists'
		);
	}

	// Post-process: response wrapper templates and example values
	const used = new Set<string>();
	const wrappers = translateResponseWrappers(baseDoc, used);
	const examples = translateExamples(baseDoc, ROOT_CTX, used);
	console.log(`Post-processed ${wrappers} response wrapper descriptions and ${examples} example values`);

	// Verify no Cyrillic remains — fail build if any found
	const remaining: string[] = [];
	findRemainingCyrillic(baseDoc, ROOT_CTX, '$', remaining);
	if (remaining.length > 0) {
		reportAndExit(
			'strings with Cyrillic text still remain',
			remaining,
			'translate texts in overlay.en.yaml; example values go to RU_TO_EN in scripts/apply-overlay.ts'
		);
	}

	const unused = [...Object.keys(RESPONSE_WRAPPERS), ...Object.keys(RU_TO_EN)].filter((k) => !used.has(k));
	if (unused.length > 0) {
		reportAndExit('dictionary entries are not used', unused, 'delete them from scripts/apply-overlay.ts');
	}

	// RU and EN must differ only in texts
	const diffs: string[] = [];
	findStructuralDiffs(ruDoc, baseDoc, ROOT_CTX, '$', diffs);
	if (diffs.length > 0) {
		reportAndExit(
			'the English spec differs from the Russian one outside texts',
			diffs,
			'an overlay or a dictionary entry changed a value, a key or a structure; translate only texts'
		);
	}

	// Write output
	const output = yaml.dump(baseDoc, {
		lineWidth: 120,
		noRefs: true,
		quotingType: "'",
		forceQuotes: false,
	});
	fs.writeFileSync(outputPath, output);

	console.log(`Applied ${applied}/${overlay.actions.length} overlay actions → ${path.basename(outputPath)}`);
}

main();
