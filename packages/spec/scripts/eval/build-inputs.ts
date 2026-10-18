/**
 * Build the inputs of a run from the manifest and the scenario set.
 *
 * Everything a run needs is derived here, never copied by hand: the listing a
 * token receives, the instructions that go with it, the requests, the answer
 * key and the workspace the stub answers from. Two faults of the hand-built
 * harness cannot come back this way, because each one silently rewrote a result
 * before:
 *
 *   - a stale copy of the scenarios or of the world, so the key no longer
 *     matched what the stub answered;
 *   - a listing whose instructions name a tool that listing does not have.
 *
 * Usage: bun scripts/eval/build-inputs.ts <out-dir> [audience]
 *
 * The audience is a key of the manifest's `audiences`, `owner:corporation` when
 * left out; the run gets that listing and the scenarios written for it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { TOOL_NAME_IN_PROSE } from '../../mcp-core';
import { TOOL_SCENARIOS } from '../../mcp-scenarios';
import { pick, REFUSAL } from './world-pick';

const MANIFEST = path.join(import.meta.dirname, '..', '..', 'mcp-manifest.json');
/**
 * The fake workspace the stub answers from. The ids a scenario's key expects are
 * ids of this world, so the two change together and a run gets its own copy: a
 * copy left over from an earlier world answers with ids no key wants. How the
 * stub reads it — keys, refusals, the wrapper, the footer — is in stub-server.ts.
 */
const WORLD = path.join(import.meta.dirname, 'world.json');

/**
 * The world is described as its person sees it, through her personal token, and
 * that token's role is the listing's: `{caller}` and her card name it. A bot
 * token is not that person. Told by every footer that it was acting as her, a
 * bot read «мой токен скомпрометирован» as her personal token and refused to
 * reissue its own. The bot listing gets the world as the bot sees it, from its
 * `@as_bot` part: the footer names the bot and its kind of token, her records
 * lose their «(you)», the bot's own gain it, and the reads about the caller —
 * its token, its card, its status — answer for the bot.
 */
function worldFor(audience: string, role: string, scopes: string[]): string {
  const world = JSON.parse(fs.readFileSync(WORLD, 'utf8')) as Record<string, unknown>;
  const asBot = (world['@as_bot'] ?? {}) as Record<string, unknown>;
  delete world['@as_bot'];
  // The token's card names the scopes its listing needs: a card with fewer told
  // a model that read it it could not do what the listing offered.
  const withScopes = (card: unknown): unknown =>
    typeof card === 'string' ? card.replace(/^\*\*scopes\*\* .*$/m, `**scopes** ${scopes.join(', ')}`) : card;
  world.get_token_info = withScopes(world.get_token_info);
  asBot.get_token_info = withScopes(asBot.get_token_info);
  if (audience !== 'bot') return `${JSON.stringify({ ...world, '@role': role }, null, 2)}\n`;
  const person = String(world['@me']);
  const bot = String(asBot['@me']);
  const author = '((?:user_id|creator_id|actor_id)(?:\\*\\*)? ';
  const seenByBot = JSON.stringify(world)
    .replace(new RegExp(`${author}${person}) \\(you\\)`, 'g'), '$1')
    .replace(new RegExp(`${author}${bot})(?!\\d| \\(you\\))`, 'g'), '$1 (you)');
  const seen = { ...(JSON.parse(seenByBot) as Record<string, unknown>), ...asBot };
  delete seen['@role'];
  return `${JSON.stringify(seen, null, 2)}\n`;
}

interface Listed {
  name: string;
  description: string;
  input_schema: { properties?: Record<string, unknown> };
}

/**
 * Every scope the tools of a listing run with: their own and those of their
 * uploads. An after-step's scope stays out: a bot is listed send_message with
 * draft_id, and drafts:write is never given to a bot (ACCESS_EXCEPTIONS).
 */
function scopesOf(manifest: any, audience: string): string[] {
  const listed = new Set<string>(manifest.audiences[audience]?.tools ?? []);
  const scopes = new Set<string>();
  for (const tool of manifest.tools.filter((t: any) => listed.has(t.name))) {
    if (tool.scope) scopes.add(tool.scope);
    for (const place of Object.values<any>(tool.request?.arguments ?? {})) {
      for (const scope of place.scopes ?? []) scopes.add(scope);
    }
  }
  return [...scopes].sort();
}

/**
 * Each scenario's own right path, sent through the world before a run: the write
 * its key describes, with what the schema requires filled in. A world that
 * refuses the call a key wants fails that scenario in every run — a chain reply
 * once came back as «chat not found» because a key meant for the same number sent
 * as a chat matched its parent_message_id — and it hands a second chance to the
 * wrong path the scenario is there to catch.
 */
function rightPathRefusals(
  scenarios: typeof TOOL_SCENARIOS,
  tools: Listed[],
  writes: Set<string>,
  world: Record<string, unknown>,
): string[] {
  const byName = new Map(tools.map((t) => [t.name, t]));
  const dummy = (field: any): unknown => {
    const type = [field?.type].flat().filter((t: unknown) => t && t !== 'null')[0];
    if (field?.enum) return field.enum[0];
    if (field?.format === 'date-time') return '2026-09-18T10:00:00+03:00';
    if (type === 'integer' || type === 'number') return 1;
    if (type === 'boolean') return false;
    if (type === 'array') return [dummy(field.items ?? {})];
    if (type === 'object') {
      return Object.fromEntries((field.required ?? []).map((name: string) => [name, dummy(field.properties?.[name] ?? {})]));
    }
    return 'текст';
  };
  const put = (args: Record<string, unknown>, schema: any, place: string, value: unknown): void => {
    const [head, inner] = place.split('.') as [string, string | undefined];
    if (!inner) {
      args[head] = value;
      return;
    }
    const field = schema.properties?.[head] ?? {};
    const isList = [field.type].flat().includes('array');
    const holder: any = isList ? ((args[head] as any[])?.[0] ?? dummy(field.items ?? {})) : (args[head] ?? dummy(field));
    holder[inner] = value;
    args[head] = isList ? [holder] : holder;
  };
  const refused: string[] = [];
  for (const scenario of scenarios) {
    const expected = scenario.args;
    if (!expected) continue;
    const names = [
      ...Object.keys(expected.must ?? {}),
      ...(expected.present ?? []),
      ...Object.keys(expected.onWeekday ?? {}),
      ...Object.keys(expected.daysAgo ?? {}),
      ...Object.keys(expected.either?.[0] ?? {}),
    ].map((place) => place.split('.')[0]!);
    const candidates = scenario.accept
      .map((name) => `pachca_${name}`)
      .filter((name) => byName.has(name))
      .filter((name) => names.every((head) => (byName.get(name)!.input_schema as any).properties?.[head]));
    // The write a key wants; a key of reads names several roads, and which one
    // carries the values is not for this check to guess.
    const tool = candidates.find((name) => writes.has(name));
    if (!tool) continue;
    const schema = byName.get(tool)!.input_schema as any;
    for (const choice of expected.either?.length ? expected.either : [{}]) {
      const args: Record<string, unknown> = {};
      for (const name of schema.required ?? []) args[name] = dummy(schema.properties?.[name] ?? {});
      for (const place of expected.present ?? []) put(args, schema, place, dummy(schema.properties?.[place.split('.')[0]!] ?? {}));
      for (const [place, value] of Object.entries({ ...expected.must, ...choice })) put(args, schema, place, value);
      for (const place of [...Object.keys(expected.onWeekday ?? {}), ...Object.keys(expected.daysAgo ?? {})]) put(args, schema, place, '2026-09-18T10:00:00+03:00');
      const answer = pick(world[tool.replace(/^pachca_/, '')], args);
      if (typeof answer === 'string' && REFUSAL.test(answer)) {
        refused.push(`${scenario.id}: ${tool} ${JSON.stringify(args)} is refused by the world: ${answer.split('\n')[0]}`);
      }
    }
  }
  return refused;
}

function listing(manifest: any, audience: string): { tools: Listed[]; instructions: string } {
  const record = manifest.audiences[audience];
  if (!record) {
    throw new Error(`no audience ${audience} in the manifest; it has ${Object.keys(manifest.audiences).join(', ')}`);
  }
  const byName = new Map<string, any>(
    [...manifest.tools, ...manifest.service_tools].map((t: any) => [t.name, t]),
  );
  const tools = record.tools.map((name: string) => {
    const base = byName.get(name);
    if (!base) throw new Error(`${audience} lists ${name}, which the manifest does not define`);
    return { name, description: base.description ?? '', input_schema: base.inputSchema };
  });
  return { tools, instructions: manifest.instructions };
}

/** A name the prose quotes that no tool of this listing carries. */
function danglingNames(instructions: string, tools: Listed[]): string[] {
  const have = new Set(tools.map((t) => t.name.replace(/^pachca_/, '')));
  const quoted = new Set([...instructions.matchAll(TOOL_NAME_IN_PROSE)].map((m) => m[0]));
  return [...quoted].filter((name) => !have.has(name));
}

function build(outDir: string, audience: string): void {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const { tools, instructions } = listing(manifest, audience);
  // Which of the listed tools act. A scenario whose answer is «there is no tool
  // for this» is failed by acting, not by looking: reading around before saying
  // so is what a person would do.
  const writes = manifest.tools.filter((t: any) => t.kind === 'write').map((t: any) => t.name);

  // A run measures one listing, and only the scenarios written for it: handed the
  // owner's, a multi-guest's run fails every right refusal of a tool it lacks.
  const scenarios = TOOL_SCENARIOS.filter((s) => (s.audience ?? 'owner:corporation') === audience);
  const asks = scenarios.map((s) => ({ id: s.id, prompt: s.prompt }));
  // What the server reads an argument left out as. A send without entity_type
  // goes to a discussion, so a key that wants `entity_type: "discussion"` is met
  // by a call that leaves it out.
  const defaults = Object.fromEntries(
    tools.map((t) => [
      t.name,
      Object.fromEntries(
        Object.entries((t.input_schema.properties ?? {}) as Record<string, { default?: unknown }>)
          .filter(([, field]) => field.default !== undefined)
          .map(([name, field]) => [name, field.default]),
      ),
    ]),
  );
  const key = Object.fromEntries(
    scenarios.map((s) => [
      s.id,
      {
        accept: s.accept.map((name) => (['none', 'ask', 'answer'].includes(name) ? name : `pachca_${name}`)),
        args: s.args ?? null,
        ...(s.says ? { says: s.says } : {}),
      },
    ]),
  );

  const dangling = danglingNames(instructions, tools);
  if (dangling.length) {
    throw new Error(`instructions for ${audience} name tools it does not have: ${dangling.join(', ')}`);
  }
  if (asks.length === 0) throw new Error(`no scenarios for audience ${audience}`);
  const world = worldFor(audience, manifest.audiences[audience].role, scopesOf(manifest, audience));
  const refused = rightPathRefusals(scenarios, tools, new Set(writes), JSON.parse(world) as Record<string, unknown>);
  if (refused.length) throw new Error(`the world refuses the right path of a scenario:\n  ${refused.join('\n  ')}`);

  fs.mkdirSync(path.join(outDir, 'in'), { recursive: true });
  fs.mkdirSync(path.join(outDir, 'out'), { recursive: true });
  fs.writeFileSync(path.join(outDir, 'in', 'tools.json'), JSON.stringify(tools, null, 1));
  fs.writeFileSync(path.join(outDir, 'in', 'instructions.txt'), instructions);
  fs.writeFileSync(path.join(outDir, 'in', 'asks.json'), JSON.stringify(asks, null, 1));
  fs.writeFileSync(path.join(outDir, 'key.json'), JSON.stringify({ writes, defaults, scenarios: key }, null, 1));
  fs.writeFileSync(path.join(outDir, 'responses.json'), world);
  console.log(`${audience}: ${tools.length} tools, ${asks.length} asks -> ${outDir}`);
}

const [outDir, audience = 'owner:corporation'] = process.argv.slice(2);
if (!outDir) {
  console.error('usage: bun scripts/eval/build-inputs.ts <out-dir> [audience]');
  process.exit(1);
}
build(outDir, audience);
