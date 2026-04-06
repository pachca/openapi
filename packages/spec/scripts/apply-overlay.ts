/**
 * Apply an OpenAPI Overlay v1.0.0 to a base spec.
 *
 * Usage: tsx scripts/apply-overlay.ts [--base openapi.yaml] [--overlay overlay.en.yaml] [--output openapi.en.yaml]
 */
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

// ---------------------------------------------------------------------------
// JSONPath-subset resolver
// ---------------------------------------------------------------------------

interface Resolved {
	parent: any;
	key: string | number;
}

/**
 * Parse a JSONPath target string into segments.
 * Supports: $, .key, ['key'], [N], [?(@.name=='value')]
 */
function parseTarget(target: string): string[] {
	const segments: string[] = [];
	let i = 0;
	if (target[i] === '$') i++; // skip root

	while (i < target.length) {
		if (target[i] === '.') {
			i++;
			// Read dotted property name (stops at . or [)
			let name = '';
			while (i < target.length && target[i] !== '.' && target[i] !== '[') {
				name += target[i++];
			}
			if (name) segments.push(name);
		} else if (target[i] === '[') {
			i++; // skip [
			if (target[i] === "'") {
				// Bracket string: ['key']
				i++; // skip opening '
				let name = '';
				while (i < target.length && target[i] !== "'") {
					name += target[i++];
				}
				i++; // skip closing '
				i++; // skip ]
				segments.push(name);
			} else if (target[i] === '?') {
				// Filter: [?(@.name=='value')] — find matching ) then ]
				let depth = 0;
				let filterEnd = i;
				while (filterEnd < target.length) {
					if (target[filterEnd] === '(') depth++;
					if (target[filterEnd] === ')') {
						depth--;
						if (depth === 0) {
							// find the closing ] after )
							filterEnd = target.indexOf(']', filterEnd);
							break;
						}
					}
					filterEnd++;
				}
				const filterExpr = target.substring(i, filterEnd);
				segments.push(filterExpr);
				i = filterEnd + 1;
			} else {
				// Numeric index: [0]
				let num = '';
				while (i < target.length && target[i] !== ']') {
					num += target[i++];
				}
				i++; // skip ]
				segments.push(num);
			}
		} else {
			i++;
		}
	}
	return segments;
}

/**
 * Parse a filter expression like ?(@.name=='value') and return {prop, value}.
 */
function parseFilter(filter: string): { prop: string; value: string } | null {
	// ?(@.prop=='value') or ?(@.prop=='value')
	const m = filter.match(/\?\(@\.(\w+)==['"](.*?)['"]\)/);
	if (!m) return null;
	return { prop: m[1], value: m[2] };
}

/**
 * Follow $ref if present in the current object.
 */
function followRef(obj: any, doc: any): any {
	if (obj && typeof obj === 'object' && obj.$ref && typeof obj.$ref === 'string') {
		const ref = obj.$ref;
		if (!ref.startsWith('#/')) return obj;
		const parts = ref.replace('#/', '').split('/');
		let resolved = doc;
		for (const part of parts) {
			resolved = resolved?.[part];
		}
		return resolved ?? obj;
	}
	return obj;
}

/**
 * Resolve a JSONPath target to {parent, key} in the document.
 */
function resolveTarget(doc: any, target: string): Resolved {
	const segments = parseTarget(target);
	let current = doc;

	for (let i = 0; i < segments.length; i++) {
		const seg = segments[i];
		const isLast = i === segments.length - 1;

		// Follow $ref before navigating
		current = followRef(current, doc);

		if (seg.startsWith('?')) {
			// Array filter
			const filter = parseFilter(seg);
			if (!filter || !Array.isArray(current)) {
				throw new Error(`Cannot apply filter "${seg}" — current value is not an array or filter is invalid. Target: ${target}`);
			}
			const idx = current.findIndex((item: any) => String(item[filter.prop]) === filter.value);
			if (idx === -1) {
				throw new Error(`Filter "${seg}" matched no elements in array. Target: ${target}`);
			}
			if (isLast) {
				return { parent: current, key: idx };
			}
			current = current[idx];
		} else if (/^\d+$/.test(seg)) {
			// Numeric index
			const idx = parseInt(seg, 10);
			if (isLast) {
				return { parent: current, key: idx };
			}
			current = current[idx];
		} else {
			// Object property
			if (isLast) {
				return { parent: current, key: seg };
			}
			if (current[seg] === undefined) {
				throw new Error(`Property "${seg}" not found. Target: ${target}`);
			}
			current = current[seg];
		}
	}

	throw new Error(`Could not resolve target: ${target}`);
}

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

/** Translation dictionary for inline strings not reachable via JSONPath overlay targets */
const RU_TO_EN: Record<string, string> = {
	// Response wrapper descriptions (inline schemas in response bodies)
	'Обертка ответа с данными и пагинацией': 'Response wrapper with data and pagination',
	'Обертка ответа с данными': 'Response wrapper with data',
	'Обертка ответа поисковых результатов с данными и пагинацией': 'Search results response wrapper with data and pagination',

	// Avatar model
	'Данные аватара': 'Avatar data',
	'URL аватара': 'Avatar URL',
	'Файл изображения для аватара': 'Avatar image file',
	'Изменение и удаление аватара профиля': 'Update and delete profile avatar',
	'Изменение и удаление аватара сотрудника': 'Update and delete employee avatar',

	// ChatSortField enum
	'Поле сортировки чатов': 'Chat sort field',
	'По идентификатору чата': 'By chat ID',
	'По дате и времени создания последнего сообщения': 'By date and time of the last message',

	// MessageSortField enum
	'Поле сортировки сообщений': 'Message sort field',
	'По идентификатору сообщения': 'By message ID',

	// x-param-names descriptions
	'Идентификатор чата': 'Chat ID',
	'Дата и время создания последнего сообщения': 'Date and time of the last message creation',
	'Идентификатор сообщения': 'Message ID',

	// Example values — models
	'Разработка': 'Development',
	'футболки': 't-shirts',
	'Олег': 'Oleg',
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
	'Отменить': 'Cancel',
	'Отправить заявку': 'Submit request',
	'Отправить': 'Submit',
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
	'Информацию о доступных вам днях отпуска вы можете прочитать по [ссылке](https://www.website.com/timeoff)':
		'You can read about your available vacation days at [this link](https://www.website.com/timeoff)',
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

/**
 * Recursively walk the document and replace Russian strings using the dictionary.
 * Handles: description, example, default, text fields + array/object values.
 */
function translateRemaining(obj: any): number {
	if (obj === null || obj === undefined || typeof obj !== 'object') return 0;
	let count = 0;

	if (Array.isArray(obj)) {
		for (let i = 0; i < obj.length; i++) {
			if (typeof obj[i] === 'string' && CYRILLIC_RE.test(obj[i])) {
				const normalized = obj[i].replace(/\s+/g, ' ').trim();
				if (RU_TO_EN[normalized]) {
					obj[i] = RU_TO_EN[normalized];
					count++;
				}
			} else {
				count += translateRemaining(obj[i]);
			}
		}
		return count;
	}

	for (const key of Object.keys(obj)) {
		const val = obj[key];
		if (typeof val === 'string' && CYRILLIC_RE.test(val)) {
			const normalized = val.replace(/\s+/g, ' ').trim();
			if (RU_TO_EN[normalized]) {
				obj[key] = RU_TO_EN[normalized];
				count++;
			}
		} else if (typeof val === 'object' && val !== null) {
			count += translateRemaining(val);
		}
	}
	return count;
}

/**
 * After post-processing, verify no Cyrillic remains in description/example/default fields.
 * Returns list of paths with remaining Cyrillic text.
 */
function findRemainingCyrillic(obj: any, path = '$'): string[] {
	if (obj === null || obj === undefined || typeof obj !== 'object') return [];
	const found: string[] = [];

	if (Array.isArray(obj)) {
		for (let i = 0; i < obj.length; i++) {
			if (typeof obj[i] === 'string' && CYRILLIC_RE.test(obj[i])) {
				found.push(`${path}[${i}] = "${obj[i].substring(0, 60)}..."`);
			} else {
				found.push(...findRemainingCyrillic(obj[i], `${path}[${i}]`));
			}
		}
		return found;
	}

	for (const key of Object.keys(obj)) {
		const val = obj[key];
		if (typeof val === 'string' && CYRILLIC_RE.test(val)) {
			found.push(`${path}.${key} = "${val.substring(0, 80)}..."`);
		} else if (typeof val === 'object' && val !== null) {
			found.push(...findRemainingCyrillic(val, `${path}.${key}`));
		}
	}
	return found;
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
	const baseDoc = yaml.load(fs.readFileSync(basePath, 'utf8')) as any;
	const overlay = yaml.load(fs.readFileSync(overlayPath, 'utf8')) as any;

	// Validate overlay structure
	if (!overlay.overlay || !overlay.info || !Array.isArray(overlay.actions)) {
		throw new Error('Invalid overlay: must have "overlay", "info", and "actions" fields');
	}

	let applied = 0;
	let skipped = 0;
	let errors = 0;

	for (const action of overlay.actions) {
		try {
			const { parent, key } = resolveTarget(baseDoc, action.target);

			if (action.remove === true) {
				if (Array.isArray(parent)) {
					parent.splice(key as number, 1);
				} else {
					delete parent[key];
				}
			} else if (action.update !== undefined) {
				if (typeof action.update === 'object' && action.update !== null && !Array.isArray(action.update)) {
					parent[key] = deepMerge(parent[key], action.update);
				} else {
					parent[key] = action.update;
				}
			}
			applied++;
		} catch (err) {
			const msg = (err as Error).message;
			// Skip targets that reference $ref-resolved paths not directly in the spec
			if (msg.includes('not found')) {
				skipped++;
			} else {
				console.error(`ERROR applying action: ${msg}`);
				errors++;
			}
		}
	}

	if (skipped > 0) {
		console.log(`Skipped ${skipped} actions (targets resolved from $ref, not directly present in spec)`);
	}

	// Post-process: translate any remaining Russian strings
	const translated = translateRemaining(baseDoc);
	if (translated > 0) {
		console.log(`Post-processed ${translated} remaining Russian strings`);
	}

	// Verify no Cyrillic remains — fail build if any found
	const remaining = findRemainingCyrillic(baseDoc);
	if (remaining.length > 0) {
		console.error(`\nERROR: ${remaining.length} strings with Cyrillic text still remain:`);
		for (const r of remaining.slice(0, 30)) {
			console.error(`  ✗ ${r}`);
		}
		if (remaining.length > 30) {
			console.error(`  ... and ${remaining.length - 30} more`);
		}
		console.error(`\nFix: add translations to RU_TO_EN in scripts/apply-overlay.ts or to overlay.en.yaml`);
		process.exit(1);
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
	if (errors > 0) {
		console.error(`${errors} actions failed — see errors above`);
		process.exit(1);
	}
}

main();
