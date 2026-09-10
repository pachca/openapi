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
 * Ids and names are mixed on purpose, because both are how ids actually reach an
 * agent. A person talking names things — "напиши в «Релизы»" — and the resolving
 * call is then the whole measurement: the failure is inventing a number or
 * asking the person for one. An id in the prompt stands for the other two
 * routes, a pasted link and a previous result, and those scenarios are what
 * measures the acting tool itself. A set built only on ids would never test the
 * first half of almost every real request.
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
  must?: Record<string, string | number | boolean>;
  /** Argument must be passed, any value. */
  present?: string[];
  /** Argument must not be passed — usually because its value would be invented. */
  absent?: string[];
}

export interface ToolScenario {
  id: string;
  /** The request as a person would type it. */
  prompt: string;
  /**
   * Tool names without the prefix, any of which is a correct first call, plus
   * two answers that are not tools.
   *
   * "none" — there is no tool for this on this surface, and saying so is the
   * whole answer. Some requests ask for capabilities deliberately not exposed
   * here, and reaching for the nearest half-fitting tool is the failure.
   *
   * "ask" — the tool exists, but the request does not carry what it needs, and
   * the honest first move is a question rather than a call with a guessed
   * value. The two are different failures and must not be conflated: "none" is
   * about the surface, "ask" is about the request.
   */
  accept: string[];
  /** What the arguments of that call have to look like. */
  args?: ArgExpectation;
  /**
   * The call changes something other people will see, so a human has to say yes
   * before it goes through. Declared per scenario rather than derived from the
   * tool, because the same tool is automatic in a direct message and needs a
   * yes in a shared chat.
   */
  confirmFirst?: boolean;
  /** Why this scenario exists, when it is not obvious. */
  note?: string;
}

export const TOOL_SCENARIOS: ToolScenario[] = [
  // ── Край ядра: то, что мы обрезали сами ──────────────────────────────────
  {
    id: "edge-pin",
    prompt: "закрепи сообщение 194270 в чате, чтобы не потерялось",
    accept: ["none", "search_documentation"],
    note: "Закрепление опущено из ядра пересмотром 10.09: у соседа его нет вовсе, а в разговоре просят редко. Проверяем, читается ли эта граница или модель назовёт что-то похожее.",
  },
  {
    id: "edge-delete-message",
    prompt: "удали сообщение 194275, я его зря отправил",
    accept: ["none", "search_documentation"],
    note: "Удаление опущено в хвост намеренно, чтобы модель не бралась за него сама. Верный ответ — сказать, что инструмента нет, а не предложить правку текста вместо удаления.",
  },
  {
    id: "edge-kick",
    prompt: "убери Петю из чата 198",
    accept: ["none", "search_documentation"],
    note: "Добавление участников в ядре есть, исключение — нет. Соблазн назвать соседний инструмент максимальный.",
  },
  {
    id: "edge-rename",
    prompt: "переименуй канал 198 в «Релизы 2027»",
    accept: ["none", "search_documentation"],
  },
  {
    id: "edge-others-status",
    prompt: "поставь Пете статус «в отпуске» до понедельника",
    accept: ["none", "search_documentation"],
    note: "Свой статус в ядре есть, чужой — административное действие вне MCP. Пара «своё и чужое» — самая близкая из возможных.",
  },
  {
    id: "edge-read-file",
    prompt: "прочитай, что во вложении к сообщению 194275",
    accept: ["read_message"],
    note: "Инструмента чтения файла нет намеренно: агент отдаёт ссылку человеку. Верный первый шаг — открыть сообщение и увидеть вложение, а не искать несуществующее чтение файла.",
  },

  // ── Переформулировки: то же намерение чужими словами ─────────────────────
  {
    id: "rephrase-send",
    prompt: "скинь в «Релизы» сообщение, что всё готово",
    accept: ["search_chats", "list_chats"],
    note: "Чат назван словом, а отправка принимает идентификатор. Верный первый шаг — найти чат, а не подставить число наугад и не переспросить идентификатор у человека.",
  },
  {
    id: "rephrase-read",
    prompt: "подними переписку в «Релизах» за последнее время",
    accept: ["search_chats", "list_chats"],
  },
  {
    id: "rephrase-members",
    prompt: "глянь, кто вообще сидит в «Релизах»",
    accept: ["search_chats", "list_chats"],
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
    accept: ["search_chats", "list_chats"],
    note: "Намёк вместо просьбы и название вместо идентификатора: два шага до отправки, и первый из них — поиск чата.",
  },
  {
    id: "indirect-catchup",
    prompt: "меня не было неделю, что я пропустил",
    accept: ["list_chats", "list_threads"],
  },
  {
    id: "indirect-task",
    prompt: "мне надо не забыть дописать отчёт до пятницы",
    accept: ["create_task"],
    args: { must: { kind: "reminder" }, present: ["content", "due_at"] },
    note: "Здесь провалились все три модели первого прогона: текст задачи уехал в kind, хотя это перечисление из пяти значений. Напоминание — это kind reminder, а текст живёт в content.",
  },
  {
    id: "indirect-status",
    prompt: "я до трёх на встрече, пусть люди видят",
    accept: ["update_my_status"],
  },

  // ── Близкие пары: решает одно слово ──────────────────────────────────────
  {
    id: "pair-chat-content",
    prompt: "что пишут в чате 198",
    accept: ["read_chat"],
    note: "Против соседнего сценария: там спрашивают, что это за чат, а тут — что в нём.",
  },
  {
    id: "pair-chat-card",
    prompt: "что это вообще за чат 198",
    accept: ["read_chat_info"],
  },
  {
    id: "pair-thread-existing",
    prompt: "давай обсудим сообщение 194270 отдельно — успеем ли к пятнице?",
    accept: ["reply_in_thread"],
  },
  {
    id: "pair-thread-new",
    prompt: "давай обсудим переезд офиса отдельно, ни к чему не привязывая",
    accept: ["create_standalone_thread"],
  },
  {
    id: "pair-my-chats",
    prompt: "покажи мои чаты",
    accept: ["list_chats"],
  },
  {
    id: "pair-find-chat",
    prompt: "есть ли у нас чат про переезд офиса",
    accept: ["search_chats"],
  },

  // ── Инструмента нет: верный ответ — сказать об этом ──────────────────────
  {
    id: "none-create-bot",
    prompt: "заведи бота, который будет постить к нам оповещения из GitLab",
    accept: ["none", "search_documentation"],
    note: "Провижининг ботов вынесен за пределы MCP: это работа разработчика своим токеном.",
  },
  {
    id: "none-export",
    prompt: "выгрузи всю переписку пространства архивом",
    accept: ["none", "search_documentation"],
    note: "Выгрузки в хвосте и требуют тарифа и роли владельца.",
  },
  {
    id: "none-audit",
    prompt: "покажи журнал безопасности за вчера",
    accept: ["none", "search_documentation"],
  },
  {
    id: "none-archive",
    prompt: "заархивируй канал 198, он больше не нужен",
    accept: ["none", "search_documentation"],
    note: "Архивация в хвосте: инструмента нет, и агент должен сказать это, а не искать замену.",
  },
  {
    id: "none-form",
    prompt: "открой человеку форму, чтобы он заполнил заявку",
    accept: ["none", "search_documentation"],
  },
  {
    id: "none-tags",
    prompt: "создай тег «дизайнеры» и добавь туда людей",
    accept: ["none", "search_documentation"],
  },

  {
    id: "read-known-chat",
    prompt: "покажи последние сообщения в чате 198",
    accept: ["read_chat"],
  },
  {
    id: "digest-channel",
    prompt: "перескажи, что было в канале #релизы за сегодня",
    accept: ["search_chats"],
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
    accept: ["search_chats"],
  },
  {
    id: "find-person",
    prompt: "найди Петю из разработки",
    accept: ["search_users"],
  },
  {
    id: "my-chats-week",
    prompt: "в каких чатах что-то происходило на этой неделе?",
    accept: ["list_chats"],
  },
  {
    id: "open-discussions",
    prompt: "какие обсуждения шевелились за последние три дня",
    accept: ["list_threads"],
  },
  {
    id: "retell-thread",
    prompt: "перескажи вот это обсуждение и выпиши решения, тред 265142",
    accept: ["read_thread"],
  },
  {
    id: "who-agreed",
    prompt: "кто поставил реакцию на сообщение 194270?",
    accept: ["list_reactions"],
  },
  {
    id: "who-in-chat",
    prompt: "кто состоит в канале 198?",
    accept: ["list_chat_members"],
  },
  {
    id: "what-is-chat",
    prompt: "мне прислали https://app.pachca.com/chats/144483 — что это за чат?",
    accept: ["read_chat_info"],
  },
  {
    id: "who-is-user",
    prompt: "кто такой пользователь 3560, покажи его карточку",
    accept: ["read_user"],
  },
  {
    id: "read-one-message",
    prompt: "покажи сообщение 194275 целиком",
    accept: ["read_message"],
  },
  {
    id: "my-tasks",
    prompt: "покажи мои незакрытые задачи",
    accept: ["list_tasks"],
    args: { must: { status: "undone" } },
    note: "Две модели из трёх прислали status: open — слово из английского здравого смысла, а не из перечисления.",
  },
  {
    id: "send-to-channel",
    prompt: "напиши в «Релизы», что релиз выехал",
    accept: ["search_chats", "list_chats"],
  },
  {
    id: "dm-person",
    prompt: "напиши Пете Смирнову в личку, что я задержусь",
    accept: ["search_users"],
    note: "Человека называют по имени. Личный чат заводится по идентификатору получателя, так что сотрудника сначала находят поиском.",
  },
  {
    id: "reply-thread",
    prompt: "ответь в треде на сообщение 194270, что посмотрю завтра",
    accept: ["reply_in_thread"],
  },
  {
    id: "chain-reply",
    prompt: "ответь в самом канале 198 на сообщение 194270, что посмотрю завтра, не уводя в тред",
    accept: ["send_message"],
    args: { must: { chat_id: 198, parent_message_id: 194270 }, present: ["content"] },
    confirmFirst: true,
    note: "Оба числа разные и оба обязательны: без parent_message_id это просто новое сообщение, а не ответ цепочкой.",
  },
  {
    id: "send-report",
    prompt: "положи отчёт файлом report.md в чат 198, текст такой: «Сентябрь закрыт, выручка выросла на 12%»",
    accept: ["send_file"],
    args: { must: { chat_id: 198, filename: "report.md" }, present: ["content"], absent: ["user_id"] },
    confirmFirst: true,
  },
  {
    id: "start-discussion",
    prompt: "заведи отдельное обсуждение по теме переезда, без привязки к сообщению",
    accept: ["create_standalone_thread"],
  },
  {
    id: "react",
    prompt: "поставь плюс на сообщение 194270",
    accept: ["add_reaction"],
    args: { must: { message_id: 194270, code: "👍" } },
    confirmFirst: true,
    note: "«Плюс» — это эмодзи, а не знак. Малая модель прислала code: «+», что не реакция.",
  },
  {
    id: "unreact",
    prompt: "убери мою реакцию 👍 с сообщения 194270",
    accept: ["remove_reaction"],
    args: { must: { message_id: 194270, code: "👍" } },
  },
  {
    id: "fix-typo",
    prompt: "замени текст сообщения 194275 на «отчёт за сентябрь готов»",
    accept: ["update_message"],
  },
  {
    id: "new-channel",
    prompt: "создай канал по проекту Платипус, участников добавлю потом",
    accept: ["create_chat"],
    args: { must: { channel: true }, present: ["name"], absent: ["member_ids"] },
    confirmFirst: true,
    note: "Канал и открытость — независимые оси. Просили канал, про доступ не сказали ни слова, так что public выставлять неоткуда.",
  },
  {
    id: "invite",
    prompt: "добавь пользователя 3560 в чат 198",
    accept: ["add_chat_members"],
    args: { must: { chat_id: 198 }, present: ["member_ids"] },
    confirmFirst: true,
    note: "Меняет состав чата: подтверждение обязательно при любом раскладе.",
  },
  {
    id: "new-task",
    prompt: "поставь мне задачу дописать отчёт к пятнице",
    accept: ["create_task"],
    args: { must: { kind: "reminder" }, present: ["content", "due_at"], absent: ["performer_ids"] },
    note: "Задача себе: исполнителя передавать не нужно, по умолчанию это вызывающий.",
  },
  {
    id: "close-task",
    prompt: "отметь задачу 3456 выполненной",
    accept: ["update_task"],
    args: { must: { task_id: 3456, status: "done" }, absent: ["content"] },
  },
  {
    id: "set-status",
    prompt: "поставь мне статус «на встрече» до 15:00",
    accept: ["update_my_status"],
  },
  // ── Ссылки: номер приходит из адреса, а чей он — решает параметр ─────────
  {
    id: "link-message",
    prompt: "глянь https://app.pachca.com/chats/144483?message=1076601422 — о чём там речь",
    accept: ["read_message"],
    note: "В адресе два разных номера. Нужен тот, что в message: чат открывать незачем, спрашивают про одно сообщение.",
  },
  {
    id: "link-thread-by-message",
    prompt: "перескажи, к чему пришли — https://app.pachca.com/chats?thread_message_id=1058906882",
    accept: ["read_message", "read_thread"],
    note: "Главная ловушка адресов: под thread_message_id лежит идентификатор сообщения, а не треда. Верно либо открыть сообщение и взять thread.id, либо, если модель это уже знает, читать тред. Подставить это число как thread_id — промах.",
  },
  {
    id: "link-user",
    prompt: "кто это — https://app.pachca.com/chats?user_id=309768",
    accept: ["read_user"],
  },
  {
    id: "link-reply",
    prompt: "ответь в треде https://app.pachca.com/chats?thread_message_id=1058906882, что посмотрю завтра",
    accept: ["reply_in_thread"],
    note: "Ответ в тред принимает и message_id, так что число из адреса подставляется напрямую — лишнего чтения тут не нужно.",
  },

  // ── Запрос без того, что инструменту нужно: спросить, а не угадать ───────
  //
  // Появление ответа "ask" вскрыло в наборе целый класс небрежности: пять
  // сценариев записи просили отправить сообщение, не давая его текста. Пока
  // засчитывалось только имя инструмента, это было не видно — модель называла
  // отправку, и никто не спрашивал, что именно она отправит. Все три модели
  // независимо отказались выдумывать текст. Сценарии переписаны так, чтобы
  // текст в запросе был; здесь же остались те, где нехватка данных и есть
  // предмет проверки.
  {
    id: "ask-task-no-subject",
    prompt: "поставь мне задачу на завтра",
    accept: ["ask"],
    note: "Срок есть, а что делать — нет. Придумать текст задачи нельзя: в календаре у человека останется наша выдумка. Верный ход — спросить, а не выбрать что-нибудь из разговора.",
  },
  {
    id: "ask-send-no-text",
    prompt: "напиши в «Релизы»",
    accept: ["ask", "search_chats", "list_chats"],
    note: "Чат назван, текста нет. Найти чат заранее — не ошибка, отправить придуманный текст — ошибка. Оба верных хода приняты, потому что порядок здесь не предопределён.",
  },
  {
    id: "ask-react-which",
    prompt: "поставь реакцию на последнее сообщение Пети",
    accept: ["ask", "search_users", "search_messages"],
    note: "Не сказано какую реакцию. Найти человека или сообщение можно сразу, а вот эмодзи выбрать за человека нельзя.",
  },
  {
    id: "ask-add-who",
    prompt: "добавь ребят из соседней команды в «Релизы»",
    accept: ["ask", "search_chats", "search_users"],
    note: "«Ребята из соседней команды» — не список. Состав чата меняется необратимо, так что угадывать людей нельзя ни при каких условиях.",
  },

  // ── Видимая запись: сначала спросить человека ────────────────────────────
  {
    id: "confirm-announce",
    prompt: "объяви в канале 198, что релиз выехал",
    accept: ["send_message"],
    args: { must: { chat_id: 198 }, present: ["content"] },
    confirmFirst: true,
    note: "Сообщение подписано именем человека и видно всему каналу. Инструмент выбран верно, но отправлять без «да» нельзя — это и проверяем отдельной осью.",
  },
  {
    id: "confirm-dm-self",
    prompt: "напиши мне в личку, что вечером созвон",
    accept: ["send_message"],
    confirmFirst: false,
    note: "Обратный случай к соседнему: сообщение себе никто, кроме автора, не увидит, и спрашивать разрешения не о чем. Пара нужна, чтобы подтверждение не превратилось в рефлекс на любую запись.",
  },
  {
    id: "confirm-new-thread",
    prompt: "заведи отдельное обсуждение по переезду и позови туда Петю",
    accept: ["create_standalone_thread", "search_users"],
    confirmFirst: true,
    note: "Создание треда спрашивает всегда: появляется новое место, куда позовут людей.",
  },
  {
    id: "confirm-edit-own",
    prompt: "поправь в сообщении 194275 опечатку: не «отчот», а «отчёт»",
    accept: ["read_message", "update_message"],
    note: "Чат в запросе не назван, поэтому ось подтверждения тут не проверяется: правка отвечает уровнем shared, а он различает личную переписку и общий чат. Проверять то, чего в запросе нет, — значит мерить угадывание. Правка видна в общем чате: у читателей оно уже было перед глазами. Чтение принято первым шагом не из мягкости — правка заменяет содержимое целиком, поэтому починить одно слово, не зная остального текста, нельзя. Две модели пришли к этому сами, а набор такого хода не предусматривал.",
  },

  {
    id: "how-webhooks",
    prompt: "а как в Пачке устроена проверка подписи вебхука?",
    accept: ["search_documentation"],
  },
  {
    id: "rules-threads",
    prompt: "я первый раз работаю с тредами, какие тут правила?",
    accept: ["get_instructions", "search_documentation"],
  },
  {
    id: "deleted-trap",
    prompt: "открой сообщение 194275, коллега говорит что оно пустое",
    accept: ["read_message"],
  },
  {
    id: "channel-write-trap",
    prompt: "напиши в канал 198, что релиз выехал, но я там только подписчик",
    accept: ["send_message", "reply_in_thread", "read_chat", "list_chat_members"],
    note: "Подписчик в канал писать не может, но может комментировать в его тредах — так написано в описании отправки. Отсюда три верных первых шага: попробовать и получить внятный отказ, уйти сразу в обсуждение, либо сначала прочитать чат, чтобы найти сообщение, к которому тред и привязывать. Последнее выбрала крупная модель, и это план, а не промах. Четвёртый ход — посмотреть состав с фильтром по редакторам: описание инструмента прямо предлагает так узнавать, кто в канале может писать.",
  },
  {
    id: "thread-chat-trap",
    prompt: "напиши в чат треда 2637266155, что посмотрю завтра",
    accept: ["send_message", "reply_in_thread"],
  },
];

/**
 * The second half of a run. The scenarios above measure which tool gets called;
 * these measure what the agent says when no tool fits, which is a separate
 * failure with a separate cause.
 *
 * The core is twenty-five tools over an API of eighty operations, so most of
 * what a person asks for outside it is not missing from Pachca — it is missing
 * from this server. An answer that stops at "there is no tool" reads to the
 * person as "Pachca cannot do this", and that is wrong far more often than it
 * is right. The scenarios split on exactly that: `api` means the capability
 * exists and the answer has to hand over the method, `absent` means it does not
 * and the answer has to say so without inventing an endpoint to soften it.
 */
export interface AnswerScenario {
  id: string;
  /** The request as a person would type it. */
  prompt: string;
  /** Where the capability actually lives. */
  reach: 'api' | 'absent';
  /**
   * Operations the answer has to name, checked against the spec so a rename
   * cannot leave a scenario quietly demanding something that no longer exists.
   * Empty for `absent` — there is nothing to name, and naming anything is the
   * failure.
   */
  mustName: Array<{ method: string; path: string }>;
  /** A condition the answer has to carry: a plan, a role, a kind of token. */
  mustFlag?: string;
  /**
   * The nearest real thing. Not a substitute — a field or a habit that answers
   * the underlying need once the person knows the feature itself is absent.
   */
  nearest?: string;
  /** What a run actually got wrong here, when that is what the scenario is for. */
  note?: string;
}

export const ANSWER_SCENARIOS: AnswerScenario[] = [
  // ── Есть в API, нет инструмента ──────────────────────────────────────────
  {
    id: 'api-bot',
    prompt: 'заведи бота, который будет постить к нам оповещения из GitLab',
    reach: 'api',
    mustName: [{ method: 'POST', path: '/bots' }],
    mustFlag: 'личный токен, скоуп bots:write',
    note: 'Полный ответ говорит и то, что для самих оповещений API не нужен: у бота есть входящий вебхук, и GitLab шлёт прямо в него.',
  },
  {
    id: 'api-export',
    prompt: 'выгрузи всю переписку пространства архивом, юристы просят',
    reach: 'api',
    mustName: [
      { method: 'POST', path: '/chats/exports' },
      { method: 'GET', path: '/chats/exports/{id}' },
    ],
    mustFlag: 'тариф «Корпорация»',
    note: 'Просят «всю», а одна выгрузка берёт 45 дней. Ответ, который об этом молчит, обещает невыполнимое.',
  },
  {
    id: 'api-audit',
    prompt: 'покажи, кто заходил в пространство вчера',
    reach: 'api',
    mustName: [{ method: 'GET', path: '/audit_events' }],
    mustFlag: 'тариф «Корпорация», роль Владельца',
  },
  {
    id: 'api-archive',
    prompt: 'заархивируй канал 198, он больше не нужен',
    reach: 'api',
    mustName: [{ method: 'PUT', path: '/chats/{id}/archive' }],
    mustFlag: 'роль в самом чате, а не в пространстве',
  },
  {
    id: 'api-tags',
    prompt: 'создай тег «дизайнеры» и добавь туда четверых',
    reach: 'api',
    mustName: [
      { method: 'POST', path: '/group_tags' },
      { method: 'PUT', path: '/users/{id}' },
    ],
    mustFlag: 'состав тега правится у сотрудника полем list_tags',
    note: 'Единственный сценарий, разваливший две модели из трёх. Второй шаг живёт на другой сущности, и обе придумали правдоподобный, но несуществующий: одна — POST /chats/{id}/group_tags (это привязка тега к чату), другая — PUT /group_tags/{id} (принимает только name).',
  },

  // ── Нет ни инструмента, ни метода ────────────────────────────────────────
  {
    id: 'gone-schedule',
    prompt: 'запланируй отправку сообщения в чат 198 на завтра в 9 утра',
    reach: 'absent',
    mustName: [],
    nearest: 'напоминание POST /tasks с kind reminder, либо планировщик снаружи',
  },
  {
    id: 'gone-poll',
    prompt: 'сделай в канале 198 опрос с голосованием, куда идём на корпоратив',
    reach: 'absent',
    mustName: [],
    nearest: 'голосование реакциями и сбор через список реакций',
    note: 'Ловушка — формы: POST /views/open выглядит как опрос, но открывается только по trigger_id от нажатия кнопки, так что предложить его вместо опроса значит послать человека в тупик.',
  },
  {
    id: 'gone-presence',
    prompt: 'покажи, кто из команды сейчас онлайн',
    reach: 'absent',
    mustName: [],
    nearest: 'last_activity_at в карточке сотрудника',
    note: 'Ловушка в соседнем поле: user_status — это статус, который человек ставит себе сам, а не присутствие. Модель поменьше указала именно на него и потеряла last_activity_at.',
  },
  {
    id: 'gone-call',
    prompt: 'позвони Пете, надо срочно обсудить',
    reach: 'absent',
    mustName: [],
    nearest: 'meet_room_url в объекте чата — ссылка на видеочат',
    note: 'Мимо прошли все три: поле есть в объекте чата, но ни один гайд не связывает его с «как созвониться», и найти его через документацию не получилось ни у кого.',
  },
];
