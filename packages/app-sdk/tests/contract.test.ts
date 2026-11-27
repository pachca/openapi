import { test } from 'vitest';
import { anyApi, jobsApi } from '../src/api.ts';
import { AppError, PachcaError } from '../src/server.ts';
import { errors, refs, same } from './contract.ts';

test('имя функции в ссылке и встроенные функции заданий (refs.json)', () => {
  for (const r of refs.refs) {
    const ref = r.path.reduce((o: any, p) => o[p], anyApi) as { _name: string };
    same('refs.json', `api.${r.path.join('.')}._name`, ref._name, r.name);
  }
  same('refs.json', 'jobsApi.get._name', jobsApi.get._name, '_jobs.get');
  same('refs.json', 'jobsApi.cancel._name', jobsApi.cancel._name, '_jobs.cancel');
  for (const name of [jobsApi.get._name, jobsApi.cancel._name]) same('refs.json', `встроенная ${name}`, name in refs.builtins, true);
});

test('AppError без кода это app_error со статусом из errors.json, статус только 4xx', () => {
  const e = new AppError('нельзя');
  same('errors.json', 'код AppError по умолчанию', e.code, 'app_error');
  same('errors.json', 'статус AppError по умолчанию', e.status, errors.function.app_error);
  same('errors.json', 'признак isAppError', e.isAppError, true);
  const taken = new AppError('занято', { code: 'taken', status: 409 });
  same('errors.json', 'AppError с кодом', [taken.code, taken.status], ['taken', 409]);
  same('errors.json', 'статус вне 4xx', new AppError('x', { status: 500 }).status, 400);
});

test('PachcaError узнаётся по имени и статусу: её создаёт рантайм платформы, а не этот модуль', () => {
  const fromRuntime = Object.assign(new Error('нет прав'), { name: 'PachcaError', status: 403, code: 'insufficient_scope' });
  same('errors.json', 'instanceof PachcaError у ошибки рантайма', fromRuntime instanceof PachcaError, true);
  const platform = Object.assign(new Error('нет скоупа'), { code: 'scope_missing' });
  same('errors.json', 'отказ прокси это не PachcaError', platform instanceof PachcaError, false);
  const own = new PachcaError(404, 'not_found', 'нет', null);
  same('errors.json', 'поля PachcaError', [own.name, own.status, own.code], ['PachcaError', 404, 'not_found']);
});
