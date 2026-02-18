const SYNONYMS: Record<string, string[]> = {
  участники: ['сотрудники', 'users', 'пользователи', 'members'],
  сотрудники: ['участники', 'users', 'пользователи', 'members'],
  пользователи: ['участники', 'сотрудники', 'users', 'members'],
  сообщение: ['messages', 'message', 'сообщения'],
  сообщения: ['messages', 'message', 'сообщение'],
  отправить: ['создать', 'create', 'post'],
  получить: ['get', 'список', 'list'],
  удалить: ['delete'],
  изменить: ['обновить', 'update', 'put', 'редактировать'],
  обновить: ['изменить', 'update', 'put', 'редактировать'],
  редактировать: ['изменить', 'обновить', 'update', 'put'],
  чат: ['chat', 'беседа', 'канал', 'чаты'],
  чаты: ['chat', 'беседа', 'канал', 'чат'],
  канал: ['chat', 'чат', 'беседа', 'каналы'],
  каналы: ['chat', 'чат', 'беседа', 'канал'],
  беседа: ['chat', 'чат', 'канал'],
  тег: ['tag', 'метка', 'теги'],
  теги: ['tag', 'метка', 'тег'],
  файл: ['file', 'upload', 'загрузить'],
  загрузить: ['file', 'upload', 'файл'],
  вебхук: ['webhook', 'вебхуки'],
  вебхуки: ['webhook', 'вебхук'],
  реакция: ['reaction', 'реакции'],
  реакции: ['reaction', 'реакция'],
  тред: ['thread', 'обсуждение', 'треды', 'чат', 'chat'],
  треды: ['thread', 'обсуждение', 'тред', 'чаты', 'chat'],
  обсуждение: ['thread', 'тред', 'чат', 'chat'],
  задача: ['task', 'todo', 'задачи'],
  задачи: ['task', 'todo', 'задача'],
  статус: ['status', 'custom_properties'],
  свойства: ['custom_properties', 'properties'],
};

const STOP_WORDS = new Set([
  'как',
  'можно',
  'нужно',
  'мне',
  'что',
  'где',
  'когда',
  'какой',
  'какие',
  'все',
  'для',
  'это',
  'или',
  'при',
  'через',
  'после',
  'перед',
  'есть',
  'будет',
  'был',
  'быть',
  'чтобы',
  'также',
  'только',
  'уже',
  'еще',
  'ещё',
  'очень',
  'так',
  'тоже',
]);

const ACTION_PATTERNS: Record<string, string[]> = {
  отправить: ['create', 'post'],
  создать: ['create', 'post'],
  добавить: ['create', 'post'],
  написать: ['create', 'post'],
  получить: ['get', 'list'],
  список: ['list', 'get'],
  узнать: ['get', 'list'],
  посмотреть: ['get', 'list'],
  найти: ['get', 'list'],
  удалить: ['delete'],
  убрать: ['delete'],
  изменить: ['update', 'put'],
  обновить: ['update', 'put'],
  редактировать: ['update', 'put'],
  закрепить: ['pin'],
  открепить: ['unpin'],
  загрузить: ['upload', 'file'],
};

export function expandQueryWithSynonyms(query: string): string {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const expanded = new Set(words);

  for (const word of words) {
    const synonyms = SYNONYMS[word];
    if (synonyms) {
      for (const syn of synonyms) {
        expanded.add(syn);
      }
    }
  }

  return [...expanded].join(' ');
}

export function removeStopWords(query: string): string {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
    .join(' ');
}

interface ActionIntent {
  action: string[];
  entity: string;
}

export function extractActionIntent(query: string): ActionIntent | undefined {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => !STOP_WORDS.has(w) && w.length > 1);

  let action: string[] | undefined;
  const entityWords: string[] = [];

  for (const word of words) {
    if (!action && ACTION_PATTERNS[word]) {
      action = ACTION_PATTERNS[word];
    } else {
      entityWords.push(word);
    }
  }

  if (!action || entityWords.length === 0) return undefined;

  const entityExpanded = new Set(entityWords);
  for (const w of entityWords) {
    const synonyms = SYNONYMS[w];
    if (synonyms) {
      for (const syn of synonyms) {
        entityExpanded.add(syn);
      }
    }
  }

  return { action, entity: [...entityExpanded].join(' ') };
}

const CYRILLIC_RE = /^[а-яёА-ЯЁ]+$/;
const RUSSIAN_SUFFIXES = [
  'ами',
  'ями',
  'ого',
  'ому',
  'ать',
  'ить',
  'ов',
  'ев',
  'ей',
  'ах',
  'ях',
  'ом',
  'ем',
  'ам',
  'ям',
  'ий',
  'ый',
  'ой',
  'ую',
  'ие',
  'ые',
  'их',
  'ых',
  'а',
  'я',
  'у',
  'ю',
  'е',
  'и',
  'ы',
  'о',
];

const MIN_STEM_LENGTH = 4;

export function stemRussian(word: string): string | undefined {
  if (!CYRILLIC_RE.test(word) || word.length < MIN_STEM_LENGTH + 1) return undefined;

  for (const suffix of RUSSIAN_SUFFIXES) {
    if (word.endsWith(suffix) && word.length - suffix.length >= MIN_STEM_LENGTH) {
      return word.slice(0, -suffix.length);
    }
  }
  return undefined;
}

export function addStems(words: string[]): string[] {
  const result = [...words];
  for (const word of words) {
    const stem = stemRussian(word);
    if (stem && !result.includes(stem)) {
      result.push(stem);
    }
  }
  return result;
}

export function getWordVariants(word: string): string[] {
  const variants = [word];
  const stem = stemRussian(word);
  if (stem) {
    variants.push(stem);
    const stemSynonyms = SYNONYMS[stem];
    if (stemSynonyms) variants.push(...stemSynonyms);
  }
  const directSynonyms = SYNONYMS[word];
  if (directSynonyms) variants.push(...directSynonyms);
  return variants;
}

export const SUGGESTED_QUERIES = [
  'как отправить сообщение',
  'список чатов',
  'callback_id',
  'загрузить файл',
  'entity_type',
  'участники канала',
  'вебхуки',
  'ошибки и лимиты',
];
