import known from './generated/scopes.json' with { type: 'json' };

const roles: Readonly<Record<string, readonly string[] | null>> = known;

export function scopeProblems(pachca: { bot?: readonly string[]; user?: readonly string[] } | undefined): string[] {
  const problems: string[] = [];
  for (const side of ['bot', 'user'] as const) {
    for (const sc of pachca?.[side] ?? []) {
      if (!(sc in roles)) {
        const area = sc.split(':')[0];
        const near = Object.keys(roles).filter((k) => k.split(':')[0] === area || k.split(':')[0] === `${area}s`);
        problems.push(`manifest.pachca.${side}: скоупа ${sc} нет в API Пачки${near.length ? ` (есть ${near.join(', ')})` : ''}`);
        continue;
      }
      const r = roles[sc];
      if (!r) continue;
      if (side === 'bot' && !r.includes('bot')) problems.push(`manifest.pachca.bot: скоуп ${sc} боту не выдаётся, только пользователю`);
      if (side === 'user' && !r.some((x) => x !== 'bot')) problems.push(`manifest.pachca.user: скоуп ${sc} есть только у бота, перенесите его в manifest.pachca.bot`);
    }
  }
  return problems;
}
