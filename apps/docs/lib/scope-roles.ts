/** Роли, которым может быть доступен скоуп. Порядок общий для таблицы скоупов и кружков у скоупа. */
export const SCOPE_ROLES = ['owner', 'admin', 'user', 'multi_guest', 'bot'] as const;

export type ScopeRole = (typeof SCOPE_ROLES)[number];

export const SCOPE_ROLE_LABELS: Record<ScopeRole, string> = {
  owner: 'Владелец',
  admin: 'Администратор',
  user: 'Сотрудник',
  multi_guest: 'Мульти-гость',
  bot: 'Бот',
};
