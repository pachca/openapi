// Фикстуры контракта (contract/*.json): их же читает платформа. Расхождение значит подъём версии протокола.
import { expect } from 'vitest';
import errors from '../contract/errors.json' with { type: 'json' };
import jobs from '../contract/jobs.json' with { type: 'json' };
import refs from '../contract/refs.json' with { type: 'json' };

export { errors, jobs, refs };

export const bump = (file: string) =>
  `собранные приложения ждут формат из contract/${file}. Его изменение ломает их и требует подъёма версии протокола ` +
  `(PROTOCOL в src/protocol.ts и AppProtocol платформы) вместе с правкой фикстуры, см. contract/README.md`;

/** Равенство с сообщением о подъёме версии. */
export function same(file: string, what: string, got: unknown, want: unknown) {
  expect(got, `${what}\n${bump(file)}`).toStrictEqual(want);
}
