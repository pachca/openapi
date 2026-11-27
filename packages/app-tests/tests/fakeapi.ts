// Раздел /apps API Пачки в памяти: столько, сколько нужно pachca-app. Права, хосты и события сравниваются по манифесту
// без `protocol` и `sdk`, как это делает платформа: изменились без `approve` значит consent_required.
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

export const TOKEN = 'good-token';

type FakeApp = {
  id: string;
  name: string;
  icon: string | null;
  visibility: string;
  version: number;
  consented?: string;
  files: Record<string, string>;
  secrets: Set<string>;
};

export type Request = { method: string; path: string; body: Record<string, unknown> | undefined };

export interface FakeApi {
  url: string;
  apps: Map<string, FakeApp>;
  requests: Request[];
  logs: { time: string; kind: string; text: string; allowed: boolean; reason?: string }[];
  /** Версия SDK, которую принимает платформа: другая получает sdk_outdated. Пусто: любая. */
  sdk?: string;
  close(): Promise<void>;
}

const send = (res: ServerResponse, status: number, body?: unknown) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(body === undefined ? undefined : JSON.stringify(body));
};
const refuse = (res: ServerResponse, status: number, code: string, message: string, payload: unknown = null) =>
  send(res, status, { errors: [{ key: 'system', value: null, code, message, payload }] });

const read = (req: IncomingMessage) =>
  new Promise<string>((done) => {
    let s = '';
    req.setEncoding('utf8');
    req.on('data', (c: string) => (s += c));
    req.on('end', () => done(s));
  });

const permissions = (manifest: Record<string, unknown>) => {
  const { protocol: _p, sdk: _s, description: _d, ...rest } = manifest;
  return JSON.stringify(rest);
};

export async function fakeApi(): Promise<FakeApi> {
  const apps = new Map<string, FakeApp>();
  const requests: Request[] = [];
  const logs: FakeApi['logs'] = [];
  let next = 1;
  const api = {} as FakeApi;
  const server: Server = createServer(async (req, res) => {
    const url = new URL(req.url!, 'http://x');
    const raw = await read(req);
    const body = raw ? (JSON.parse(raw) as Record<string, unknown>) : undefined;
    const path = url.pathname.replace(/^\/api\/shared\/v1/, '');
    requests.push({ method: req.method!, path: `${path}${url.search}`, body });
    if (req.headers.authorization !== `Bearer ${TOKEN}`) return send(res, 401, { error: 'invalid_token', error_description: 'Токен не найден' });
    const m = path.match(/^\/apps(?:\/([^/]+))?(?:\/([a-z]+))?(?:\/([^/]+))?$/);
    if (!m) return send(res, 404, { errors: [] });
    const [, id, sub, name] = m;
    if (!id) {
      if (req.method === 'GET') return send(res, 200, { data: [...apps.values()].map(({ files: _f, secrets: _s, ...a }) => a) });
      const app: FakeApp = { id: `app${String(next++).padStart(9, '0')}`, name: String(body!.name), icon: null, visibility: 'private', version: 0, files: {}, secrets: new Set() };
      apps.set(app.id, app);
      return send(res, 201, { data: { id: app.id, name: app.name, icon: null, visibility: 'private', version: 0 } });
    }
    const app = apps.get(id);
    if (!app) return refuse(res, 404, 'not_found', 'Не найдено');
    const view = () => ({ id: app.id, name: app.name, icon: app.icon, visibility: app.visibility, version: app.version });
    if (!sub) {
      if (req.method === 'GET') return send(res, 200, { data: view() });
      if (req.method === 'PUT') {
        Object.assign(app, Object.fromEntries(Object.entries(body!).filter(([k]) => ['name', 'icon', 'visibility'].includes(k))));
        return send(res, 200, { data: view() });
      }
      apps.delete(id);
      return send(res, 204);
    }
    if (sub === 'versions') {
      const b = body as { manifest: Record<string, unknown>; base_version: number; approve?: boolean; force?: boolean; source?: Record<string, string> };
      if (b.base_version !== app.version && !b.force) return refuse(res, 409, 'version_conflict', 'Версия не та', { version: app.version });
      if (api.sdk && b.manifest.sdk !== api.sdk) {
        const command = `npm i @pachca/app-sdk@${api.sdk} @pachca/app-react@${api.sdk}`;
        return refuse(res, 409, 'sdk_outdated', `Приложение собрано на @pachca/app-sdk ${String(b.manifest.sdk)}, платформа принимает ${api.sdk}`, { sdk: api.sdk, command });
      }
      const perms = permissions(b.manifest);
      const items = [{ kind: 'bot', text: 'Отправка сообщений', scope: 'messages:create', new: app.consented !== perms }];
      if (app.consented !== perms && !b.approve) return refuse(res, 409, 'consent_required', 'Права изменились', { hash: 'h', items });
      app.consented = perms;
      app.version++;
      app.files = b.source ?? {};
      return send(res, 200, { data: { version: app.version, hash: `h${app.version}`, items, migrations: app.version === 1 ? ['Таблица tasks создана'] : [], warnings: [] } });
    }
    if (sub === 'source') return app.version ? send(res, 200, { data: { version: app.version, files: app.files } }) : refuse(res, 404, 'not_found', 'Версий нет');
    if (sub === 'logs') return send(res, 200, { data: logs.slice(0, Number(url.searchParams.get('n') ?? 50)) });
    if (sub === 'secrets') {
      if (req.method === 'GET') return send(res, 200, { data: [...app.secrets].sort() });
      if (req.method === 'PUT') app.secrets.add(name!);
      else app.secrets.delete(name!);
      return send(res, 204);
    }
    return send(res, 404, { errors: [] });
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address() as AddressInfo;
  return Object.assign(api, {
    url: `http://127.0.0.1:${port}/api/shared/v1`,
    apps,
    requests,
    logs,
    close: () => new Promise<void>((r) => server.close(() => r())),
  });
}
