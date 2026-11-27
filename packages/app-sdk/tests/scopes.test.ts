import { expect, test } from 'vitest';
import { scopeProblems } from '../src/scopes.ts';

test('известные скоупы на своей стороне проходят', () => {
  expect(scopeProblems({ bot: ['messages:create'], user: ['messages:read'] })).toStrictEqual([]);
  expect(scopeProblems(undefined)).toStrictEqual([]);
});

test('неизвестный скоуп с подсказкой похожих', () => {
  const [p] = scopeProblems({ bot: ['message:create'] });
  expect(p).toMatch(/^manifest\.pachca\.bot: скоупа message:create нет в API Пачки \(есть messages:/);
});

test('скоуп не той стороны', () => {
  expect(scopeProblems({ bot: ['users:create'], user: ['bot_self:write'] })).toStrictEqual([
    'manifest.pachca.bot: скоуп users:create боту не выдаётся, только пользователю',
    'manifest.pachca.user: скоуп bot_self:write есть только у бота, перенесите его в manifest.pachca.bot',
  ]);
});
