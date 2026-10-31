// Команды плагина «Пачка» для таблицы на странице /guides/mcp/commands и её
// Markdown-версии. Структура и смысл частей — из argument-hint и шагов
// plugins/pachca/skills/<команда>/SKILL.md.

export interface PluginCommandArg {
  token: string;
  required: boolean;
  description: string;
}

export interface PluginCommand {
  usage: string;
  title: string;
  anchor: string;
  summary: string;
  args: PluginCommandArg[];
}

const THREAD_LINK =
  'Ссылка на тред или сообщение либо номер треда, какие ссылки подходят, сказано в разделе «Как передать тред».';

export const PLUGIN_COMMANDS: PluginCommand[] = [
  {
    usage: '/pachca:thread-summary <тред> [период]',
    title: 'Пересказ треда',
    anchor: 'pereskaz-treda',
    summary:
      'Пересказывает тред: контекст, решения, открытые вопросы и поручения, можно несколько тредов сразу. Только читает.',
    args: [
      {
        token: '<тред>',
        required: true,
        description: `${THREAD_LINK} Можно передать несколько ссылок. Если у сообщения нет треда, агент скажет об этом и не станет его создавать.`,
      },
      {
        token: '[период]',
        required: false,
        description:
          'Например «с понедельника» или «с моего последнего сообщения»: агент прочитает тред целиком, а перескажет только новое. После периода можно задать вопрос, например «ответили ли мне» или «что нужно поправить», и агент закончит ответом на него.',
      },
    ],
  },
  {
    usage: '/pachca:watch-thread <тред> [задача]',
    title: 'Слежение за тредом',
    anchor: 'slezhenie-za-tredom',
    summary:
      'Следит за тредом и отвечает в нём по вашей задаче, пока открыта сессия. Отвечает и поправляет свои ответы без отдельного «да».',
    args: [
      {
        token: '<тред>',
        required: true,
        description: `${THREAD_LINK} Вместо ссылки можно назвать коллегу или тему, тогда агент предложит самостоятельный тред, а если вы предпочитаете личные сообщения, напишет туда.`,
      },
      {
        token: '[задача]',
        required: false,
        description:
          'Что делать в треде: отвечать на вопросы, спросить коллегу и дождаться ответа, сверять документацию с обсуждением. Без неё агент спросит задачу до начала.',
      },
    ],
  },
];
