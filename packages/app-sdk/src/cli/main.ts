// Разбор команды и флагов pachca-app. Возвращает код выхода: 0 готово, 1 ошибка, 2 неверный вызов.
import { parseArgs } from 'node:util';
import { BuildError, SDK_VERSION } from '../build/index.js';
import { ApiError, call, resolveApi, SETUP } from './api.js';
import { edit, logs, pull, remove, runBuild, runCheck, secret, ship } from './commands.js';
import { CliError, type Io } from './io.js';
import { ensureLatest } from './update.js';

const HELP = `pachca-app ${SDK_VERSION}: команды разработки приложения Пачки. Запускайте из папки приложения: npx pachca-app <команда>

  check                     типы, скоупы манифеста, хосты, импорты
  build                     сборка в dist
  ship                      проверка, сборка, создание приложения (первый раз) и загрузка версии
      --name <название>     название нового приложения (по умолчанию pachca.name из package.json или имя папки)
      --approve-consent-screen   человек подтвердил изменения прав, хостов и событий
      --force               загрузить поверх версии из другой папки (только по решению человека)
  pull <папка> --app <id>   исходники текущей версии в новую папку
  logs [-n 50] [-f]         журнал приложения на платформе
  secret set|list|rm NAME   секреты приложения, значение вводится скрыто
  edit [--name] [--icon] [--visibility private|link|public]
  delete                    удалить приложение целиком, необратимо (только человек в терминале)

  --mode <режим>            сборка с .env.<режим> и отдельное приложение этого режима (по умолчанию production)
  --app <id>                другое приложение вместо приложения папки
  --profile <профиль>       профиль CLI Пачки

${SETUP}
`;

const OPTIONS = {
  mode: { type: 'string' },
  app: { type: 'string' },
  name: { type: 'string' },
  icon: { type: 'string' },
  visibility: { type: 'string' },
  profile: { type: 'string' },
  n: { type: 'string', short: 'n' },
  follow: { type: 'boolean', short: 'f' },
  'approve-consent-screen': { type: 'boolean' },
  force: { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean', short: 'v' },
} as const;

export async function main(argv: string[], io: Io): Promise<number> {
  try {
    return await dispatch(argv, io);
  } catch (e) {
    if (e instanceof CliError || e instanceof ApiError || e instanceof BuildError) {
      io.err(`\n  ${e.message}\n`);
      return e instanceof CliError ? e.exitCode : 1;
    }
    if (e instanceof TypeError && 'code' in e && String(e.code).startsWith('ERR_PARSE_ARGS')) {
      io.err(`${e.message}\n\n${HELP}`);
      return 2;
    }
    throw e;
  }
}

async function dispatch(argv: string[], io: Io): Promise<number> {
  const { values: f, positionals } = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true, strict: true });
  const [cmd, ...rest] = positionals;
  if (f.version) {
    io.out(`${SDK_VERSION}\n`);
    return 0;
  }
  if (f.help || !cmd) {
    io.err(HELP);
    return cmd || f.help ? 0 : 2;
  }
  const mode = f.mode ?? 'production';
  if (!/^[a-z][a-z0-9-]{0,31}$/.test(mode)) throw new CliError('--mode: латиница в нижнем регистре, цифры и -, например staging', 2);
  const auth = { profile: f.profile };
  const t = { mode, app: f.app };

  if (cmd === 'check' || cmd === 'build' || cmd === 'ship') {
    const updated = await ensureLatest(io, SDK_VERSION, argv);
    if (updated !== undefined) return updated;
  }
  switch (cmd) {
    case 'check':
      return (await runCheck(io, mode)) ? 0 : 1;
    case 'build':
      await runBuild(io, mode);
      return 0;
    case 'ship': {
      // вход и права проверяются до сборки: без них сборка была бы зря
      const a = await resolveApi(io, auth);
      await call(io, a, 'GET', '/apps');
      return (await ship(io, a, { ...t, name: f.name, approve: Boolean(f['approve-consent-screen']), force: Boolean(f.force) })) ? 0 : 1;
    }
    case 'pull': {
      if (!rest[0] || !f.app) throw new CliError('pull <новая папка> --app <id>', 2);
      await pull(io, await resolveApi(io, auth), rest[0], f.app, mode);
      return 0;
    }
    case 'logs': {
      const n = Number(f.n ?? 50);
      if (!Number.isInteger(n) || n < 1 || n > 200) throw new CliError('-n: число записей от 1 до 200', 2);
      await logs(io, await resolveApi(io, auth), t, { n, follow: Boolean(f.follow) });
      return 0;
    }
    case 'secret':
      await secret(io, await resolveApi(io, auth), t, rest[0], rest[1]);
      return 0;
    case 'edit':
      await edit(io, await resolveApi(io, auth), t, { name: f.name, icon: f.icon, visibility: f.visibility });
      return 0;
    case 'delete':
      await remove(io, await resolveApi(io, auth), t);
      return 0;
    default:
      io.err(`Нет команды ${cmd}\n\n${HELP}`);
      return 2;
  }
}
