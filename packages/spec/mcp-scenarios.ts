/**
 * Scenarios for a judged run: a request as a person would type it, and the tools
 * that count as a correct first call.
 *
 * Written in Russian on purpose. The prose that routes them is English, and
 * whether English descriptions carry a Russian request to the right tool is
 * exactly the thing worth measuring rather than assuming — the people who will
 * type these do not write in English.
 *
 * More than one accepted tool is not laxity. When a request names a chat or a
 * person instead of an id, resolving it first is correct behaviour, not a miss;
 * scoring it as one taught us more about the scenario set than about the prose.
 *
 * Things are named, not numbered. Nobody talks to an agent in ids: they say
 * «в Релизах», «Петю», «тег Оформление», and finding the thing is half of every
 * request — the half where an agent invents a number or asks the person for one.
 * A prompt that hands the id over measures only the second half, and half of this
 * set used to do exactly that, which is why the numbers it produced looked better
 * than the tools were. What has no name is pointed at the way people point at it:
 * a message or a thread by a link, by quoting its words, or by where it sits. A
 * bare number is left only where a number is genuinely what arrives — an export
 * id from the notice that the archive is ready, the ids inside a webhook payload —
 * and the scenario says so.
 *
 * That is also why more than one tool is accepted so often: when the request
 * names a thing, the call that resolves the name is a correct first move, and
 * the acting call comes after it.
 */

/**
 * What the arguments of the call have to look like. Naming the right tool is
 * only half of a call: an argument outside its enum, or a required one left
 * out, fails validation just as surely as the wrong tool, and a run that grades
 * only the tool name reports it as a success. Assertions are checked against
 * the manifest at build time, so a scenario cannot demand an argument the tool
 * does not take or a value its enum does not allow.
 */
export interface ArgExpectation {
  /** Argument must be passed with exactly this value. */
  must?: Record<string, string | number | boolean | Array<string | number>>;
  /** Argument must be passed, any value. */
  present?: string[];
  /** Argument must not be passed — usually because its value would be invented. */
  absent?: string[];
  /**
   * Alternative sets of values, any one of which satisfies the assertion. Some
   * things are addressable two ways that are equally right — a thread by the
   * message it hangs off or by its own id — and a key that names only one of
   * them fails the agent for taking the other road to the same place.
   */
  either?: Array<Record<string, string | number | boolean>>;
  /**
   * The local day an argument has to land on, named as a weekday rather than a
   * date so the set does not rot: the run resolves it against the day it runs.
   * "к пятнице" said on a Saturday means the Friday six days out, and an agent
   * that writes tomorrow instead has produced a reminder that fires on the
   * wrong day — a failure no assertion on the presence of `due_at` can see.
   */
  onWeekday?: Record<string, 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>;
}

export interface ToolScenario {
  id: string;
  /** The request as a person would type it. */
  prompt: string;
  /**
   * Tool names without the prefix, any of which is a correct first call, plus
   * one answer that is not a tool.
   *
   * "none" — there is no tool for this on this surface, and saying so is the
   * whole answer. Some requests ask for capabilities deliberately not exposed
   * here, and reaching for the nearest half-fitting tool is the failure.
   *
   * "ask" — the request lacks something only the person has, and asking for it
   * is the answer; `missing` has to say what that is, or the build fails. It is
   * the narrow exception: a thin request is still a request. The agent resolves
   * the names, the dates and the defaults, writes what it can from what it has,
   * does the thing and says in one line what it assumed — a wrong guess costs
   * one correction, a question a whole round trip. The words of a message to be
   * sent are not something to write for a person; the subject of a task is — a
   * reminder with a date is a valid task. For both "none" and "ask" the failure
   * is a write: reading around first is fine. Whether a call needs the person's
   * approval is not part of this: the client asks them, per tool, the way they
   * set it up.
   *
   * "answer" — what the agent already holds answers it, and the reply has to say
   * `says`, or the build fails. The server hands the caller's name and id over
   * before the first call, so «какой у меня id» needs no call — and a reply
   * that names a wrong id is the failure, whatever was called on the way. A
   * write fails it too.
   */
  accept: string[];
  /** For an "ask" scenario: the one thing only the person has. */
  missing?: string;
  /**
   * What the reply must contain — required for an "answer" scenario, and for any
   * other whose point is what the agent concluded rather than which call it made.
   */
  says?: string[];
  /** What the arguments of that call have to look like. */
  args?: ArgExpectation;
  /** Why this scenario exists, when it is not obvious. */
  note?: string;
  /**
   * Whose listing the model sees. Omitted, it is the owner on the Corporation
   * plan — the largest listing. `user` measures what an employee is told when
   * the tool is not theirs; `bot` measures the tools only a bot token receives.
   */
  audience?: 'user' | 'bot';
}

export const TOOL_SCENARIOS: ToolScenario[] = [
  // ── За пределами переписки: правка, состав чата, чужой профиль ───────────
  {
    id: "edge-pin",
    prompt: "закрепи в «Релизах» сообщение Пети про ревью, чтобы не потерялось",
    accept: ["get_chat", "list_chat_messages", "get_thread", "search_messages", "list_chats", "search_chats", "list_company_chats", "pin_message"],
    args: { must: { id: 603381} },
    note: "Закрепление — свой инструмент, рядом с правкой и откреплением. Проверяем, что модель берёт именно его, а не правит сообщение.",
  },
  {
    id: "edge-delete-message",
    prompt: "удали моё сообщение про сентябрьский отчёт в «Релизах», я его зря отправил",
    accept: ["get_chat", "list_chat_messages", "get_thread", "search_messages", "list_chats", "search_chats", "list_company_chats", "delete_message"],
    args: { must: { id: 603390 } },
    note: "У каждой сущности своё удаление, и все они помечены разрушающими. Верно — удалить сообщение, а не заменить его текст пустым.",
  },
  {
    id: "edge-kick",
    prompt: "убери Петю из «Релизов»",
    accept: ["list_users", "search_users", "list_chats", "search_chats", "list_company_chats", "remove_member"],
    args: { must: { id: 4719 }, present: ["user_id"] },
    note: "Исключение из чата — remove_member. Первым шагом допустимо найти Петю.",
  },
  {
    id: "edge-rename",
    prompt: "переименуй канал «Релизы» в «Релизы 2027»",
    accept: ["list_chats", "search_chats", "list_company_chats", "update_chat"],
    args: { must: { id: 4719, name: "Релизы 2027" } },
  },
  {
    id: "edge-others-status",
    prompt: "поставь Пете статус «в отпуске» до среды",
    accept: ["list_users", "search_users", "update_user_status"],
    args: { must: { user_id: 3560 }, present: ["title", "expires_at"], onWeekday: { expires_at: "wednesday" } },
    note:
      "Свой статус и чужой — соседние инструменты с почти одинаковыми именами. Пара «своё и чужое» — " +
      "самая близкая из возможных. Срок назван днём недели нарочно: так его и называют. Понедельник " +
      "отсюда убран — сказанный в воскресенье, он значит «завтра», и промах было не отличить от иного " +
      "прочтения просьбы.",
  },
  {
    id: "edge-read-file",
    prompt: "прочитай, что во вложении к сообщению Ани про отчёт",
    accept: ["get_chat", "list_chat_messages", "get_thread", "search_messages", "list_chats", "search_chats", "list_company_chats", "get_message", "list_reactions", "list_message_readers"],
    args: { must: { id: 603390 } },
    note: "Инструмента чтения файла нет намеренно: агент отдаёт ссылку человеку. Верный первый шаг — открыть сообщение и увидеть вложение, а не искать несуществующее чтение файла.",
  },

  // ── Переформулировки: то же намерение чужими словами ─────────────────────
  {
    id: "rephrase-send",
    prompt: "скинь в «Релизы» сообщение, что всё готово",
    accept: ["list_chats", "search_chats", "list_company_chats", "send_message"],
    args: { must: { entity_id: 4719 }, present: ["content"] },
    note: "Чат назван словом, а отправка принимает идентификатор. Верный первый шаг — найти чат, а не подставить число наугад и не переспросить идентификатор у человека.",
  },
  {
    id: "rephrase-read",
    prompt: "подними переписку в «Релизах» за последнее время",
    accept: ["list_chats", "search_chats", "list_company_chats", "list_chat_messages"],
    args: { must: { chat_id: 4719 } },
  },
  {
    id: "rephrase-members",
    prompt: "глянь, кто вообще сидит в «Релизах»",
    accept: ["list_chats", "search_chats", "list_company_chats", "list_members"],
    args: { must: { id: 4719 } },
  },

  // ── Параметры, без которых возможность недостижима ───────────────────────
  {
    id: "public-channels",
    prompt: "какие в компании есть открытые каналы, куда я не вхожу",
    accept: ["list_chats"],
    args: { must: { availability: "public" } },
    note: "Свои чаты и открытые каналы пространства — один инструмент и разные значения availability. Сценарий в списке сотрудника: у владельца есть обходной путь — список всех чатов пространства, — и параметр там не проверить.",
    audience: "user",
  },
  {
    id: "sort-chats",
    prompt: "покажи мои чаты, начиная с самых давно молчащих",
    accept: ["list_chats", "search_chats", "list_company_chats"],
    args: { must: { sort: "last_message_at", order: "asc" } },
    note: "Порядок выдачи задаётся параметрами, а не пересортировкой на стороне агента: страница приходит одна, и перевернуть её постфактум нельзя.",
  },
  {
    id: "send-buttons",
    prompt: "спроси в «Релизах» «Идём в пятницу?» и добавь кнопки «Да» и «Нет»",
    accept: ["list_chats", "search_chats", "list_company_chats", "send_message"],
    args: { must: { entity_id: 4719 }, present: ["buttons"] },
    note: "Кнопки — часть сообщения, отдельного инструмента для них нет.",
  },
  {
    id: "task-all-day",
    prompt: "перенеси задачу «дописать отчёт» на пятницу, время неважно",
    accept: ["list_tasks", "get_task", "update_task"],
    args: { must: { id: 3456, all_day: true }, present: ["due_at"], onWeekday: { due_at: "friday" } },
    note: "«Время неважно» — это all_day, а не полночь по UTC в сроке.",
  },
  {
    id: "rephrase-search",
    prompt: "не могу вспомнить, в каком чате мы утверждали макеты — поищи",
    accept: ["search_messages"],
    note: "Разговорное «поищи» без имени инструмента. Раньше в запросе стояло «это» без опоры на предыдущую реплику — в изолированном прогоне такой запрос честно нечитаем, и модель поменьше отвечала, что искать нечего.",
  },
  {
    id: "indirect-announce",
    prompt: "команда до сих пор не в курсе, что релиз выехал, а надо бы — в «Релизы»",
    accept: ["list_chats", "search_chats", "list_company_chats", "send_message"],
    args: { must: { entity_id: 4719 }, present: ["content"] },
    note: "Намёк вместо просьбы и название вместо идентификатора: два шага до отправки, и первый из них — поиск чата.",
  },
  {
    id: "indirect-catchup",
    prompt: "меня не было неделю, что я пропустил",
    accept: ["list_chats", "search_chats", "list_company_chats", "list_threads"],
  },
  {
    id: "indirect-task",
    prompt: "мне надо не забыть дописать отчёт до пятницы",
    accept: ["create_task", "get_my_card"],
    args: { must: { kind: "reminder" }, present: ["content", "due_at"], onWeekday: { due_at: "friday" } },
    note: "Срок называют по-человечески, а уходит он моментом: сначала прочитать свою карточку ради пояса — верный первый шаг. Здесь провалились все три модели первого прогона: текст задачи уехал в kind, хотя это перечисление из пяти значений. Напоминание — это kind reminder, а текст живёт в content.",
  },
  {
    id: "indirect-status",
    prompt: "я до трёх на встрече, пусть люди видят",
    accept: ["update_my_status", "get_my_card", "get_my_status"],
    args: { present: ["title", "emoji", "expires_at"] },
    note: "«До трёх» — местное время человека. Прочитать свою карточку ради часового пояса — верный первый шаг.",
  },

  // ── Близкие пары: решает одно слово ──────────────────────────────────────
  {
    id: "pair-chat-content",
    prompt: "что пишут в «Релизах»",
    accept: ["list_chats", "search_chats", "list_company_chats", "list_chat_messages"],
    args: { must: { chat_id: 4719 } },
    note: "Против соседнего сценария: там спрашивают, что это за чат, а тут — что в нём.",
  },
  {
    id: "pair-chat-card",
    prompt: "что это вообще за чат «Платипус»",
    accept: ["list_chats", "search_chats", "list_company_chats", "get_chat"],
    args: { must: { id: 199 } },
  },
  {
    id: "pair-thread-existing",
    prompt: "давай обсудим отдельно то, что Петя написал про ревью — успеем ли к пятнице?",
    accept: ["get_chat", "list_chat_messages", "get_thread", "search_messages", "list_chats", "search_chats", "list_company_chats", "create_thread", "send_message"],
    args: { present: ["content"], either: [{ id: 603381 }, { id: 87215 }] },
  },
  {
    id: "pair-thread-new",
    prompt: "давай обсудим переезд офиса отдельно, ни к чему не привязывая",
    accept: ["create_unattached_thread", "send_message"],
    note: "У треда без сообщения нет названия, поэтому тему задаёт первое сообщение — отправить его сразу входит в дело. Промах — завести чат.",
  },
  {
    id: "pair-my-chats",
    prompt: "покажи мои чаты",
    accept: ["list_chats", "search_chats", "list_company_chats"],
  },
  {
    id: "pair-find-chat",
    prompt: "есть ли у нас чат про переезд офиса",
    accept: ["list_chats", "search_chats", "list_company_chats"],
    args: { present: ["query"] },
  },

  // ── Администрирование: боты, выгрузки, журнал, теги ──────────────────────
  {
    id: "new-bot",
    prompt: "заведи бота, который будет постить к нам оповещения из GitLab",
    accept: ["create_bot"],
    args: { present: ["name"] },
    note: "Полный ответ говорит и то, что для самих оповещений код не нужен: у бота есть входящий вебхук, и GitLab шлёт прямо в него.",
  },
  {
    id: "export-history",
    prompt: "выгрузи всю переписку пространства архивом",
    accept: ["ask"],
    missing: "адрес своего сервера, куда придёт весть о готовой выгрузке",
    note: "По контракту заказ выгрузки требует webhook_url, а это адрес сервера, который есть только у человека. Ответ на заказ приходит без номера: номер готового архива приходит в вебхук на этот адрес и в уведомление о готовности.",
  },
  {
    id: "audit-log",
    prompt: "покажи журнал безопасности за вчера",
    accept: ["get_audit_events"],
    args: { present: ["start_time"] },
  },
  {
    id: "workspace-tags",
    prompt: "какие теги вообще есть у нас в пространстве?",
    accept: ["list_tags", "get_tag"],
    note: "Теги пространства читаются списком. Проверяем, что модель не путает их с полями задач и не уходит в состав конкретного тега.",
  },
  {
    id: "archive-chat",
    prompt: "заархивируй канал «Релизы», он больше не нужен",
    accept: ["list_chats", "search_chats", "list_company_chats", "archive_chat"],
    args: { must: { id: 4719} },
    note: "Архивация — отдельный инструмент, а не правка чата: проверяем, что модель не пытается сделать её через update_chat.",
  },
  {
    id: "none-form",
    prompt: "открой человеку форму, чтобы он заполнил заявку",
    accept: ["none"],
    note: "Формы открывает только бот по нажатию его кнопки, у токена человека такого инструмента нет. Верно — сказать, что нужен бот, а не выдумать форму.",
  },
  {
    id: "new-tag-with-people",
    prompt: "создай тег «дизайнеры» и добавь туда людей",
    accept: ["create_tag", "list_users", "search_users"],
    args: { must: { name: "дизайнеры" } },
    note: "Второй шаг живёт на другой сущности: состав тега правится у сотрудника полем list_tags в update_user.",
  },

  // ── Обычная работа: прочитать, написать, поставить задачу ────────────────
  {
    id: "read-known-chat",
    prompt: "покажи последние сообщения в «Продукте»",
    accept: ["list_chats", "search_chats", "list_company_chats", "list_chat_messages"],
    args: { must: { chat_id: 144483 } },
  },
  {
    id: "digest-channel",
    prompt: "перескажи, что было в канале #релизы за сегодня",
    accept: ["list_chats", "search_chats", "list_company_chats", "get_chat", "list_chat_messages", "get_thread"],
    args: { must: { chat_id: 4719 } },
    note: "имя без идентификатора — первым шагом поиск",
  },
  {
    id: "where-discussed",
    prompt: "где у нас обсуждали переход на новый тариф?",
    accept: ["search_messages"],
  },
  {
    id: "find-channel",
    prompt: "найди канал про дизайн",
    accept: ["list_chats", "search_chats", "list_company_chats"],
  },
  {
    id: "find-person",
    prompt: "найди Петю из разработки",
    accept: ["list_users", "search_users"],
    args: { present: ["query"] },
  },
  {
    id: "my-chats-week",
    prompt: "в каких чатах что-то происходило на этой неделе?",
    accept: ["list_chats", "search_chats", "list_company_chats"],
  },
  {
    id: "open-discussions",
    prompt: "какие обсуждения шевелились за последние три дня",
    accept: ["list_threads", "list_chats"],
    note: "«Обсуждения» здесь — разговоры вообще, а не «отдельное обсуждение»: и треды, и чаты с свежими сообщениями — верный ответ.",
  },
  {
    id: "retell-thread",
    prompt: "перескажи обсуждение под сообщением Пети про ревью и выпиши решения",
    accept: ["get_chat", "list_chat_messages", "get_thread", "get_message", "list_reactions", "list_message_readers", "search_messages", "list_chats", "search_chats", "list_company_chats", "list_threads"],
    args: { must: { id: 87215 } },
  },
  {
    id: "who-agreed",
    prompt: "кто поставил реакцию на сообщение Пети про ревью?",
    accept: ["get_chat", "list_chat_messages", "get_thread", "search_messages", "list_chats", "search_chats", "list_company_chats", "get_message", "list_reactions", "list_message_readers"],
    args: { must: { id: 603381} },
  },
  {
    id: "who-in-chat",
    prompt: "кто состоит в канале «Релизы»?",
    accept: ["list_chats", "search_chats", "list_company_chats", "list_members"],
    args: { must: { id: 4719 } },
  },
  {
    id: "what-is-chat",
    prompt: "мне прислали https://app.pachca.com/chats/144483 — что это за чат?",
    accept: ["get_chat"],
    args: { must: { id: 144483 } },
  },
  {
    id: "who-is-user",
    prompt: "кто такой Петя, покажи его карточку",
    accept: ["list_users", "search_users", "get_user"],
    args: { must: { id: 3560 } },
  },
  {
    id: "read-one-message",
    prompt: "покажи целиком сообщение Ани про сентябрьский отчёт",
    accept: ["get_chat", "list_chat_messages", "get_thread", "search_messages", "list_chats", "search_chats", "list_company_chats", "get_message", "list_reactions", "list_message_readers"],
    args: { must: { id: 603390 } },
  },
  {
    id: "my-tasks",
    prompt: "покажи мои незакрытые задачи",
    accept: ["list_tasks", "get_task"],
    args: { must: { status: "undone" } },
    note: "Две модели из трёх прислали status: open — слово из английского здравого смысла, а не из перечисления.",
  },
  {
    id: "send-to-channel",
    prompt: "напиши в «Релизы», что релиз выехал",
    accept: ["list_chats", "search_chats", "list_company_chats", "send_message"],
    args: { must: { entity_id: 4719 }},
  },
  {
    id: "dm-person",
    prompt: "напиши Пете Смирнову в личку, что я задержусь",
    accept: ["list_users", "search_users", "send_message"],
    args: { must: { entity_id: 3560 }},
    note: "Человека называют по имени. Личный чат заводится по идентификатору получателя, так что сотрудника сначала находят поиском.",
  },
  {
    id: "reply-thread",
    prompt: "ответь в треде под сообщением Пети про ревью, что посмотрю завтра",
    accept: ["get_chat", "list_chat_messages", "get_thread", "search_messages", "list_chats", "search_chats", "list_company_chats", "create_thread", "send_message"],
    args: { either: [{ id: 603381 }, { id: 87215 }] },
  },
  {
    id: "chain-reply",
    prompt: "ответь Пете в самих «Релизах», не уводя в тред, что посмотрю завтра",
    accept: ["get_chat", "list_chat_messages", "get_thread", "search_messages", "list_chats", "search_chats", "list_company_chats", "send_message"],
    args: { must: { entity_id: 4719, parent_message_id: 603381 }},
    note: "Оба числа разные и оба обязательны: без parent_message_id это просто новое сообщение, а не ответ цепочкой.",
  },
  {
    id: "send-report",
    prompt: "положи отчёт файлом report.md в «Релизы», текст такой: «Сентябрь закрыт, выручка выросла на 12%»",
    accept: ["list_chats", "search_chats", "list_company_chats", "send_message"],
    args: { must: { entity_id: 4719 }},
  },
  {
    id: "start-discussion",
    prompt: "заведи отдельное обсуждение по теме переезда, без привязки к сообщению",
    accept: ["create_unattached_thread", "send_message"],
  },
  {
    id: "react",
    prompt: "поставь огонь на сообщение Пети про ревью",
    accept: ["get_chat", "list_chat_messages", "get_thread", "search_messages", "list_chats", "search_chats", "list_company_chats", "add_reaction"],
    args: { must: { id: 603381, code: "🔥" } },
    note: "Реакция названа словом, а уходит эмодзи. Малая модель на «плюс» присылала «+» и «+1», но 👍 — пример из схемы, и скопированный пример проходил бы: слово взято другое.",
  },
  {
    id: "unreact",
    prompt: "убери мою реакцию 👍 с сообщения Пети про ревью",
    accept: ["get_chat", "list_chat_messages", "get_thread", "search_messages", "list_chats", "search_chats", "list_company_chats", "remove_reaction"],
    args: { must: { id: 603381, code: "👍"} },
  },
  {
    id: "fix-typo",
    prompt: "в моём сообщении про сентябрьский отчёт замени текст на «отчёт за сентябрь готов»",
    accept: ["get_chat", "list_chat_messages", "get_thread", "search_messages", "list_chats", "search_chats", "list_company_chats", "get_message", "list_reactions", "list_message_readers", "update_message"],
  },
  {
    id: "new-channel",
    prompt: "создай канал по проекту Платипус, участников добавлю потом",
    accept: ["create_chat"],
    args: { must: { channel: true }, present: ["name"], absent: ["member_ids"] },
    note: "Канал и открытость — независимые оси. Просили канал, про доступ не сказали ни слова, так что public выставлять неоткуда.",
  },
  {
    id: "invite",
    prompt: "добавь Петю в «Платипус»",
    accept: ["list_users", "search_users", "list_chats", "search_chats", "list_company_chats", "add_members"],
    args: { must: { id: 199 }, present: ["member_ids"] },
    note: "Меняет состав чата. Человека находят по имени и добавляют — разрешение на запись спрашивает клиент, а не агент.",
  },
  {
    id: "new-task",
    prompt: "поставь мне задачу дописать отчёт к пятнице",
    accept: ["create_task", "get_my_card"],
    args: { must: { kind: "reminder" }, present: ["content", "due_at"], onWeekday: { due_at: "friday" } },
    note: "Срок называют по-человечески, а уходит он моментом: сначала прочитать свою карточку ради пояса — верный первый шаг. Задача себе: исполнителя передавать не нужно, по умолчанию это вызывающий.",
  },
  {
    id: "close-task",
    prompt: "отметь задачу «позвонить в банк» выполненной",
    accept: ["list_tasks", "get_task", "update_task"],
    args: { must: { id: 3457, status: "done" }, absent: ["content"] },
  },
  {
    id: "reassign-task",
    prompt: "передай задачу «дописать отчёт» Пете",
    accept: ["list_tasks", "get_task", "list_users", "search_users", "update_task"],
    args: { must: { id: 3456 }, present: ["performer_ids"] },
    note: "Задача уходит другому человеку и приходит ему уведомлением. Пара к закрытию задачи: одно действие видно чужому, другое нет.",
  },
  {
    id: "set-status",
    prompt: "поставь мне статус «на встрече» до 15:00",
    accept: ["update_my_status", "get_my_card", "get_my_status"],
    args: { present: ["title", "emoji", "expires_at"] },
    note: "Обратный случай к объявлению в канал: свой статус касается только вызывающего. Чтение своей карточки первым шагом тоже верно: 15:00 — местное время, пояс лежит в карточке.",
  },
  // ── Кто я: свой идентификатор агенту взять неоткуда, кроме карточки ────
  {
    id: "self-id",
    prompt: "какой у меня id в Пачке?",
    accept: ["answer"],
    says: ["18521"],
    note: "Имя и id того, от чьего лица работает агент, сервер отдаёт до первого вызова — отвечать можно сразу или сверившись с карточкой. Промах — чужой или искажённый номер.",
  },

  // ── Разговорные слова: в прозе их нет, а люди пишут именно так ─────────
  {
    id: "word-branch",
    prompt: "глянь, о чём договорились в ветке под сообщением Пети про ревью",
    accept: ["get_message", "list_reactions", "list_message_readers", "get_chat", "list_chat_messages", "get_thread", "search_messages", "list_chats", "search_chats", "list_company_chats"],
    args: { either: [{ id: 603381 }, { id: 87215 }] },
    note: "«Ветка» — это тред. В описаниях слова нет. Верно открыть сообщение и взять тред из него; сразу читать тред можно только зная его номер.",
  },
  {
    id: "word-group",
    prompt: "создай группу для команды логистики",
    accept: ["create_chat", "create_tag"],
    args: { present: ["name"] },
    note: "«Группа» в разговоре двусмысленна: групповой чат или тег (в API group_tag). Засчитываются оба прочтения; промах — отказ, будто сделать нельзя.",
  },
  {
    id: "word-remind",
    prompt: "напомни мне в пятницу позвонить в банк",
    accept: ["create_task", "get_my_card"],
    args: { present: ["due_at"], onWeekday: { due_at: "friday" } },
    note: "«Напомни» — это задача со сроком, а не сообщение в чат и не отказ. Срок из запроса обязан попасть в вызов.",
  },

  // ── Ссылки: номер приходит из адреса, а чей он — решает параметр ─────────
  {
    id: "link-message",
    prompt: "глянь https://app.pachca.com/chats/144483?message=1076601422 — о чём там речь",
    accept: ["get_message", "list_reactions", "list_message_readers"],
    args: { must: { id: 1076601422 } },
    note: "В адресе два разных номера. Нужен тот, что в message: чат открывать незачем, спрашивают про одно сообщение.",
  },
  {
    id: "link-thread-by-message",
    prompt: "перескажи, к чему пришли — https://app.pachca.com/chats?thread_message_id=1058906882",
    accept: ["get_message", "list_reactions", "list_message_readers", "get_chat", "list_chat_messages", "get_thread"],
    args: { must: { id: 1058906882 } },
    note: "Главная ловушка адресов: под thread_message_id лежит идентификатор сообщения, а не треда. Верно либо открыть сообщение и взять thread.id, либо, если модель это уже знает, читать тред. Подставить это число как thread_id — промах.",
  },
  {
    id: "link-user",
    prompt: "кто это — https://app.pachca.com/chats?user_id=309768",
    accept: ["get_user"],
    args: { must: { id: 309768 } },
  },
  {
    id: "link-reply",
    prompt: "ответь в треде https://app.pachca.com/chats?thread_message_id=1058906882, что посмотрю завтра",
    accept: ["create_thread", "send_message"],
    args: { present: ["content"], either: [{ id: 1058906882 }, { id: 265160 }] },
    note: "Ответ в тред принимает и message_id, так что число из адреса подставляется напрямую — лишнего чтения тут не нужно.",
  },

  // ── Запрос, в котором чего-то не хватает ────────────────────────────────
  //
  // Худой запрос — всё равно запрос. Имя чата, человека, дату, эмодзи, разумное
  // умолчание агент разбирает сам, а нехватку называет одной строкой после
  // того, как сделал: неверная догадка стоит одной поправки, вопрос — целого
  // круга. Исключение одно — то, что есть только у человека: слова сообщения,
  // которое он хочет отправить. Там верный ответ — спросить, ничего не отправив.
  {
    id: "thin-task-no-subject",
    prompt: "поставь мне задачу на завтра",
    accept: ["create_task"],
    args: { must: { kind: "reminder" }, present: ["due_at"] },
    note: "Срок есть, предмета нет. Задача всё равно заводится: без текста она называется «Напоминание» с датой, и это валидная задача. Промах — спросить, о чём она.",
  },
  {
    id: "thin-send-no-text",
    prompt: "напиши в «Релизы»",
    accept: ["ask"],
    missing: "слова сообщения",
    note: "Чат назван, текста нет. Верно спросить, что написать, — можно найдя чат заранее. Промах — отправить что-то от имени человека: слова сообщения за него не пишут.",
  },
  {
    id: "thin-react-which",
    prompt: "поставь реакцию на последнее сообщение Пети",
    accept: ["list_users", "search_users", "search_messages", "get_chat", "list_chat_messages", "get_thread", "list_chats", "search_chats", "list_company_chats", "add_reaction"],
    note: "Не сказано, какую реакцию. Эмодзи выбирается по смыслу просьбы — так прямо сказано в инструкциях сервера; промах — поставить её не на то сообщение.",
  },
  {
    id: "thin-add-who",
    prompt: "добавь ребят из соседней команды в «Релизы»",
    accept: ["list_chats", "search_chats", "list_company_chats", "list_members", "list_users", "search_users", "list_tags", "get_tag", "get_tag_users", "add_members", "add_tags_to_chat"],
    args: { must: { id: 4719 }, either: [{ member_ids: [3571, 3572] }, { member_ids: [3572, 3571] }, { group_tag_ids: [9112] }] },
    note: "«Ребята из соседней команды» — не список. Команда находится тегом: «Логистика», в которой нет никого из «Релизов». Верно добавить её людей или подключить сам тег; добавить наугад того, кто под руку попался, — промах.",
  },

  // ── Видимая запись: делаем, а не переспрашиваем ─────────────────────────
  {
    id: "write-announce",
    prompt: "объяви в «Релизах», что релиз выехал",
    accept: ["list_chats", "search_chats", "list_company_chats", "send_message"],
    args: { must: { entity_id: 4719 }, present: ["content"] },
    note: "Сообщение подписано именем человека и видно всему каналу. Инструмент выбран верно, но отправлять без «да» нельзя — это и проверяем отдельной осью.",
  },
  {
    id: "write-dm-self",
    prompt: "напиши мне в личку, что вечером созвон",
    accept: ["send_message"],
    args: { must: { entity_id: 18521 } },
    note: "Себе пишут по своему идентификатору, а он есть в инструкциях сервера и в подвале каждого ответа. Промах — спросить, кому писать.",
  },
  {
    id: "write-new-thread",
    prompt: "заведи отдельное обсуждение по переезду и позови туда Петю",
    accept: ["create_unattached_thread", "add_members", "send_message", "list_users", "search_users"],
    args: { present: ["member_ids"] },
    note: "Тред заводится, людей зовут вторым вызовом, первое сообщение задаёт тему: цепочка из нескольких шагов, а не один инструмент.",
  },
  {
    id: "write-edit-own",
    prompt: "поправь в моём сообщении про отчёт опечатку: не «отчот», а «отчёт»",
    accept: ["get_chat", "list_chat_messages", "get_thread", "search_messages", "list_chats", "search_chats", "list_company_chats", "get_message", "list_reactions", "list_message_readers", "update_message"],
    args: { must: { id: 603390 }},
    note: "Чтение первым шагом здесь обязательно по сути: правка заменяет содержимое целиком, поэтому починить одно слово, не зная остального текста, нельзя.",
  },

  {
    id: "how-webhooks",
    prompt: "а как в Пачке устроена проверка подписи вебхука?",
    accept: ["search_documentation"],
  },
  {
    id: "rules-threads",
    prompt: "я первый раз работаю с тредами, какие тут правила?",
    accept: ["search_documentation"],
  },
  {
    id: "deleted-trap",
    prompt: "коллега говорит, что сообщение https://app.pachca.com/chats/4719?message=194280 пустое — посмотри",
    accept: ["get_message"],
    args: { must: { id: 194280 } },
    says: ["удал"],
    note: "Ловушка — принять удалённое за пустое. Лента удалённые сообщения не отдаёт, а по id такое сообщение открывается с пустым content и заполненным deleted_at; судится то, что агент сказал: оно удалено.",
  },
  {
    id: "channel-write-trap",
    prompt: "напиши в «Релизы», что релиз выехал, но я там только подписчик",
    accept: ["send_message", "create_thread", "get_chat", "list_chat_messages", "get_thread", "list_members", "list_chats", "search_chats", "list_company_chats"],
    args: { must: { entity_id: 4719 } },
    note: "Подписчик в канал писать не может, но может комментировать в его тредах. Отсюда верные первые шаги: попробовать и получить внятный отказ, уйти сразу в тред под сообщением, сначала прочитать чат, чтобы найти сообщение для треда, или посмотреть состав и свою роль. Чтение перед тредом выбрала крупная модель, и это план, а не промах.",
  },
  {
    id: "thread-chat-trap",
    prompt: "напиши в тред «Переезд офиса», что посмотрю завтра",
    accept: ["search_messages", "list_threads", "list_chat_messages", "get_thread", "send_message"],
    args: { must: { entity_id: 265150 }, present: ["content"] },
    note: "Названия у треда нет, и в списке тредов нет текста: тред по теме находят поиском сообщений, а найденное сообщение говорит, в каком оно чате. Перебрать треды списком и прочитать их тоже можно.",
  },

  // ── Покрытие: у каждого инструмента набора свой сценарий ─────────────────
  {
    id: "method-workspace-chats",
    prompt: "покажи все чаты пространства, включая закрытые, где меня нет",
    accept: ["list_chats", "search_chats", "list_company_chats"],
    note: "Инструмент владельца на «Корпорации»: весь список чатов, а не только свои.",
  },
  {
    id: "method-history-start",
    prompt: "покажи самые первые сообщения в «Релизах», с начала истории",
    accept: ["list_chats", "search_chats", "list_company_chats", "list_chat_messages"],
    args: { must: { chat_id: 4719, order: "asc" } },
  },
  {
    id: "method-readers",
    prompt: "кто уже прочитал моё сообщение про отчёт?",
    accept: ["get_chat", "list_chat_messages", "get_thread", "search_messages", "list_chats", "search_chats", "list_company_chats", "list_message_readers"],
    args: { must: { id: 603390} },
  },
  {
    id: "method-all-people",
    prompt: "покажи список всех сотрудников пространства",
    accept: ["list_users", "search_users"],
    args: { absent: ["query"] },
  },
  {
    id: "method-tag-link",
    prompt: "кто входит в этот тег: https://app.pachca.com/chats?tag_id=6608",
    accept: ["get_tag_users"],
    args: { must: { id: 6608 } },
    note: "Ссылка на тег разбирается так же, как на чат или человека: число из tag_id — это тег.",
  },
  {
    id: "method-channel-editors",
    prompt: "кто может писать в канале «Релизы»?",
    accept: ["list_chats", "search_chats", "list_company_chats", "list_members"],
    args: { must: { id: 4719 } },
    note: "Писать в канале могут владелец, админы и редакторы — это роли в чате из списка участников, а не роль сотрудника в пространстве. Фильтр берёт одну роль, поэтому один список со всеми ролями — тоже верный путь.",
  },
  {
    id: "method-one-task",
    prompt: "покажи задачу «дописать отчёт» целиком",
    accept: ["list_tasks", "get_task"],
    args: { must: { id: 3456 } },
  },
  {
    id: "method-one-tag",
    prompt: "что за тег «Оформление» и сколько в нём людей?",
    accept: ["list_tags", "get_tag", "get_tag_users"],
    args: { present: ["names"] },
  },
  {
    id: "method-task-fields",
    prompt: "какие дополнительные поля есть у задач в нашем пространстве?",
    accept: ["list_custom_fields"],
    args: { must: { entity_type: "Task" } },
  },
  {
    id: "method-user-fields",
    prompt: "что у нас можно заполнить в карточке сотрудника сверх имени и должности?",
    accept: ["list_custom_fields"],
    args: { must: { entity_type: "User" } },
    note: "Дополнительные поля бывают у сотрудников и у задач — один метод, тип выбирается аргументом. Пара с полями задач проверяет выбор в обе стороны.",
  },
  {
    id: "method-my-bots",
    prompt: "покажи ботов, которых я могу редактировать",
    accept: ["list_bots", "get_bot"],
  },
  {
    id: "method-one-bot",
    prompt: "покажи настройки бота «Дежурный»",
    accept: ["list_bots", "get_bot"],
    args: { must: { id: 7801 } },
  },
  {
    id: "method-workspace-bots",
    prompt: "покажи всех ботов пространства, в том числе чужих",
    accept: ["list_bots", "list_company_bots"],
  },
  {
    id: "method-unpin",
    prompt: "открепи в «Релизах» закреплённое сообщение Пети",
    accept: ["get_chat", "list_chat_messages", "get_thread", "search_messages", "list_chats", "search_chats", "list_company_chats", "unpin_message"],
    args: { must: { id: 603381} },
  },
  {
    id: "method-unarchive",
    prompt: "верни канал «Релизы» из архива",
    accept: ["list_chats", "search_chats", "list_company_chats", "unarchive_chat"],
    args: { must: { id: 4719} },
  },
  {
    id: "method-leave",
    prompt: "выйди из «Платипуса», он мне больше не нужен",
    accept: ["list_chats", "search_chats", "list_company_chats", "leave_chat"],
    args: { must: { id: 199} },
  },
  {
    id: "method-remove-member",
    prompt: "убери Петю из «Платипуса»",
    accept: ["list_users", "search_users", "list_chats", "search_chats", "list_company_chats", "remove_member"],
    args: { must: { id: 199 }, present: ["user_id"] },
  },
  {
    id: "method-member-role",
    prompt: "сделай Петю редактором в канале «Релизы»",
    accept: ["list_users", "search_users", "list_chats", "search_chats", "list_company_chats", "update_member_role"],
    args: { must: { id: 4719, role: "editor" }},
  },
  {
    id: "method-attach-tag",
    prompt: "подключи к «Релизам» тег «Оформление», чтобы новые оформители попадали туда сами",
    accept: ["list_chats", "search_chats", "list_company_chats", "list_tags", "get_tag", "add_tags_to_chat"],
    args: { must: { id: 4719 }},
    note: "Тег привязывается к чату, а не добавляется людьми поштучно.",
  },
  {
    id: "method-detach-tag",
    prompt: "отвяжи тег «Оформление» от «Релизов»",
    accept: ["list_chats", "search_chats", "list_company_chats", "list_tags", "get_tag", "remove_tag_from_chat"],
    args: { must: { id: 4719 }},
  },
  {
    id: "method-clear-status",
    prompt: "сними мой статус",
    accept: ["delete_my_status"],
  },
  {
    id: "method-my-avatar",
    prompt: "поставь мне на аватар эту картинку, вот она в base64: iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    accept: ["update_profile_avatar"],
  },
  {
    id: "method-clear-avatar",
    prompt: "убери моё фото из профиля",
    accept: ["delete_profile_avatar"],
  },
  {
    id: "method-create-user",
    prompt: "заведи нового сотрудника: Иван Петров, почта ivan.petrov@example.com",
    accept: ["create_user"],
  },
  {
    id: "method-update-user",
    prompt: "поменяй Пете должность на «ведущий дизайнер»",
    accept: ["list_users", "search_users", "update_user"],
    args: { must: { id: 3560 }},
  },
  {
    id: "method-user-avatar",
    prompt: "поставь Пете фото, вот картинка в base64: iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    accept: ["list_users", "search_users", "update_user_avatar"],
    args: { must: { user_id: 3560 }},
  },
  {
    id: "method-user-clear-avatar",
    prompt: "убери фото у Пети",
    accept: ["list_users", "search_users", "delete_user_avatar"],
    args: { must: { user_id: 3560} },
  },
  {
    id: "method-user-status",
    prompt: "поставь Пете статус «на созвоне» 📞 до 16:00",
    accept: ["list_users", "search_users", "update_user_status", "get_user", "get_user_status"],
    args: { must: { user_id: 3560 }},
  },
  {
    id: "method-user-clear-status",
    prompt: "сними статус у Пети",
    accept: ["list_users", "search_users", "delete_user_status"],
    args: { must: { user_id: 3560} },
  },
  {
    id: "method-create-tag",
    prompt: "создай тег «логистика»",
    accept: ["create_tag"],
    args: { must: { name: "логистика" } },
  },
  {
    id: "method-rename-tag",
    prompt: "переименуй тег «Оформление» в «Дизайн»",
    accept: ["list_tags", "get_tag", "update_tag"],
    args: { must: { id: 6608, name: "Дизайн" } },
  },
  {
    id: "method-bot-webhook",
    prompt: "поменяй боту «Дежурный» адрес исходящего вебхука на https://hooks.example.com/pachca",
    accept: ["list_bots", "get_bot", "update_bot"],
    args: { must: { id: 7801, outgoing_url: "https://hooks.example.com/pachca" } },
  },
  {
    id: "method-bot-token",
    prompt: "токен бота «Дежурный» утёк, перевыпусти его",
    accept: ["list_bots", "get_bot", "recreate_bot_token"],
    args: { must: { id: 7801} },
  },
  {
    id: "method-export-chats",
    prompt: "выгрузи переписку «Релизов» и «Платипуса» за март 2026 года",
    accept: ["list_chats", "search_chats", "list_company_chats", "request_export", "download_export"],
    note: "С конкретными чатами одна выгрузка берёт до 366 дней, так что март помещается целиком.",
  },
  {
    id: "method-export-download",
    prompt: "выгрузка 5577 готова, забери архив",
    accept: ["download_export"],
    args: { must: { id: 5577 } },
    note: "Число здесь остаётся числом: у выгрузки нет названия, и её номер человек берёт из уведомления о готовности архива.",
  },
  {
    id: "method-delete-task",
    prompt: "удали задачу «позвонить в банк»",
    accept: ["list_tasks", "get_task", "delete_task"],
    args: { must: { id: 3457 } },
  },
  {
    id: "method-delete-user",
    prompt: "удали Петю из пространства насовсем",
    accept: ["list_users", "search_users", "delete_user"],
    args: { must: { id: 3560 } },
    note: "Удаление навсегда против блокировки: suspended в update_user оставляет данные, delete_user — нет.",
  },
  {
    id: "method-delete-tag",
    prompt: "удали тег «Логистика»",
    accept: ["list_tags", "get_tag", "delete_tag"],
    args: { must: { id: 9112 } },
  },
  {
    id: "method-delete-bot",
    prompt: "удали бота «Дежурный»",
    accept: ["list_bots", "get_bot", "delete_bot"],
    args: { must: { id: 7801 } },
  },

  // ── Список сотрудника: чего у него нет, и что он об этом говорит ─────────
  {
    id: "role-user-delete-person",
    prompt: "удали Петю из пространства",
    accept: ["none", "list_users", "search_users"],
    audience: "user",
    note: "У сотрудника удаления людей нет: верно — сказать, что нужен администратор, а не удалить что-то ещё.",
  },
  {
    id: "role-user-create-tag",
    prompt: "создай тег «маркетинг»",
    accept: ["none"],
    audience: "user",
  },
  {
    id: "role-user-audit",
    prompt: "покажи, кто заходил в пространство вчера",
    accept: ["none"],
    audience: "user",
    note: "Журнал только у владельца на «Корпорации». Ответ «нет прав» вместо попытки собрать ответ из чатов.",
  },
  {
    id: "role-user-export",
    prompt: "выгрузи всю переписку за прошлый месяц",
    accept: ["none"],
    audience: "user",
  },
  {
    id: "role-user-all-chats",
    prompt: "покажи все чаты пространства, даже закрытые",
    accept: ["none", "list_chats", "search_chats", "list_company_chats"],
    audience: "user",
    note: "Свои чаты сотрудник видит, все — нет. Показать свои и сказать про границу — тоже верно.",
  },
  {
    id: "role-user-others-title",
    prompt: "поменяй Пете должность на «тимлид»",
    accept: ["none"],
    audience: "user",
  },

  // ── Список бота: инструменты, которые получает только токен бота ─────────
  {
    id: "bot-events",
    prompt: "проверь, какие события пришли с прошлой проверки",
    accept: ["get_webhook_events"],
    audience: "bot",
  },
  {
    id: "bot-ack-event",
    prompt: "событие 777001 обработано, убери его из журнала",
    accept: ["delete_webhook_event"],
    args: { must: { id: "777001" } },
    audience: "bot",
    note: "Число здесь остаётся числом: идентификатор события приходит боту в самом событии, а не из речи человека.",
  },
  {
    id: "bot-open-form",
    prompt: "человек нажал кнопку «Отпуск», trigger_id 7f3c9a21 — открой ему форму заявки с датами начала и конца",
    accept: ["open_form"],
    args: { must: { trigger_id: "7f3c9a21" }, present: ["view"] },
    audience: "bot",
  },
  {
    id: "bot-form-error",
    prompt: "пришла отправка формы: view_id 4410, submit_id 7c1e-22; дата окончания раньше даты начала — верни ошибку под полем date_end",
    accept: ["answer_form"],
    args: { present: ["view_id", "submit_id", "errors"] },
    audience: "bot",
    note: "Числа здесь остаются числами: view_id и submit_id приходят боту в теле отправки формы.",
  },
  {
    id: "bot-link-preview",
    prompt: "в моём сообщении 5520 есть ссылка https://docs.example.com/report — добавь к ней превью с заголовком «Отчёт за квартал» и описанием «Выручка и расходы по отделам»",
    accept: ["add_link_preview"],
    args: { must: { id: 5520 }, present: ["link_previews"] },
    audience: "bot",
  },
  {
    id: "bot-own-token",
    prompt: "мой токен скомпрометирован, перевыпусти его",
    accept: ["self_recreate_bot_token"],
    audience: "bot",
  },
  {
    id: "bot-own-webhook",
    prompt: "поменяй мой адрес исходящего вебхука на https://hooks.example.com/bot",
    accept: ["self_update_bot_webhook"],
    args: { present: ["outgoing_url"] },
    audience: "bot",
  },
];
