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
 */
import fs from 'node:fs';
import path from 'node:path';
import { TOOL_NAME_IN_PROSE } from '../../mcp-core';
import { TOOL_SCENARIOS } from '../../mcp-scenarios';

const MANIFEST = path.join(import.meta.dir, '..', '..', 'mcp-manifest.json');
/**
 * The fake workspace the stub answers from. The ids a scenario's key expects are
 * ids of this world, so the two change together and a run gets its own copy: a
 * copy left over from an earlier world answers with ids no key wants.
 */
const WORLD = path.join(import.meta.dir, 'world.json');

/**
 * The world is described as its person sees it, and a bot token is not that
 * person. Told by every footer that it was acting as her, a bot read «мой токен
 * скомпрометирован» as her personal token and refused to reissue its own. The bot
 * listing gets the same world as the bot sees it: the footer names the bot, her
 * items lose their «(вы)», the bot's own message gains it.
 */
const AS_BOT = { person: 'Анна Ковалёва (18521)', bot: 'бот Дежурный (7801)' };

function worldFor(audience: string): string {
  const raw = fs.readFileSync(WORLD, 'utf8');
  if (audience !== 'bot') return raw;
  const seenByBot = raw
    .replaceAll(' (это вы)', '')
    .replaceAll(' (вы)', '')
    .replaceAll(`you: ${AS_BOT.person}`, `you: ${AS_BOT.bot}`)
    .replaceAll(`**author** ${AS_BOT.bot}`, `**author** ${AS_BOT.bot} (вы)`);
  const world = JSON.parse(seenByBot);
  const any = String(world['*']);
  world.get_token_info = `## ${AS_BOT.bot} (это вы)\n**тип токена** бот\n\n${any.slice(any.indexOf('Now: '))}`;
  return `${JSON.stringify(world, null, 2)}\n`;
}

interface Listed {
  name: string;
  description: string;
  input_schema: { properties?: Record<string, unknown> };
}

function listing(manifest: any, audience: string): { tools: Listed[]; instructions: string } {
  const record = manifest.audiences[audience];
  if (!record) throw new Error(`no audience ${audience} in the manifest`);
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

  const wanted = audience === 'bot' ? 'bot' : audience === 'user' ? 'user' : undefined;
  const scenarios = TOOL_SCENARIOS.filter((s) => (s.audience ?? undefined) === wanted);
  const asks = scenarios.map((s) => ({ id: s.id, prompt: s.prompt }));
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

  fs.mkdirSync(path.join(outDir, 'in'), { recursive: true });
  fs.mkdirSync(path.join(outDir, 'out'), { recursive: true });
  fs.writeFileSync(path.join(outDir, 'in', 'tools.json'), JSON.stringify(tools, null, 1));
  fs.writeFileSync(path.join(outDir, 'in', 'instructions.txt'), instructions);
  fs.writeFileSync(path.join(outDir, 'in', 'asks.json'), JSON.stringify(asks, null, 1));
  fs.writeFileSync(path.join(outDir, 'key.json'), JSON.stringify({ writes, scenarios: key }, null, 1));
  fs.writeFileSync(path.join(outDir, 'responses.json'), worldFor(audience));
  console.log(`${audience}: ${tools.length} tools, ${asks.length} asks -> ${outDir}`);
}

const [outDir, audience = 'owner:corporation'] = process.argv.slice(2);
if (!outDir) {
  console.error('usage: bun scripts/eval/build-inputs.ts <out-dir> [audience]');
  process.exit(1);
}
build(outDir, audience);
