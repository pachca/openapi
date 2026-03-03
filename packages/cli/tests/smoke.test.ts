import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const COMMANDS_DIR = path.join(__dirname, '..', 'src', 'commands');

/**
 * Smoke tests: verify all generated commands have valid TypeScript syntax
 * and expected structure. These don't execute the commands but verify
 * they are well-formed.
 */
describe('smoke tests', () => {
  // Collect all generated command files
  const generatedCommands: { section: string; action: string; filePath: string }[] = [];
  const sections = fs.readdirSync(COMMANDS_DIR).filter((f) => {
    const fullPath = path.join(COMMANDS_DIR, f);
    return fs.statSync(fullPath).isDirectory();
  });

  for (const section of sections) {
    const sectionDir = path.join(COMMANDS_DIR, section);
    const files = fs.readdirSync(sectionDir).filter((f) => f.endsWith('.ts'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(sectionDir, file), 'utf-8');
      if (content.includes('Auto-generated from openapi.yaml')) {
        generatedCommands.push({
          section,
          action: file.replace('.ts', ''),
          filePath: path.join(sectionDir, file),
        });
      }
    }
  }

  it('should have at least 50 generated commands', () => {
    expect(generatedCommands.length).toBeGreaterThanOrEqual(50);
  });

  describe('each generated command', () => {
    for (const cmd of generatedCommands) {
      describe(`${cmd.section}/${cmd.action}`, () => {
        let content: string;

        it('should be readable', () => {
          content = fs.readFileSync(cmd.filePath, 'utf-8');
          expect(content.length).toBeGreaterThan(100);
        });

        it('should have a default export class', () => {
          content = content || fs.readFileSync(cmd.filePath, 'utf-8');
          expect(content).toMatch(/export default class \w+ extends BaseCommand/);
        });

        it('should have a description', () => {
          content = content || fs.readFileSync(cmd.filePath, 'utf-8');
          expect(content).toContain('static override description');
        });

        it('should have apiMethod and apiPath', () => {
          content = content || fs.readFileSync(cmd.filePath, 'utf-8');
          const methodMatch = content.match(/static apiMethod = "(\w+)"/);
          const pathMatch = content.match(/static apiPath = "([^"]+)"/);
          expect(methodMatch).toBeTruthy();
          expect(pathMatch).toBeTruthy();
          expect(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).toContain(methodMatch![1]);
          expect(pathMatch![1]).toMatch(/^\//);
        });

        it('should have flags with BaseCommand.baseFlags', () => {
          content = content || fs.readFileSync(cmd.filePath, 'utf-8');
          expect(content).toContain('...BaseCommand.baseFlags');
        });

        it('should parse flags in run()', () => {
          content = content || fs.readFileSync(cmd.filePath, 'utf-8');
          expect(content).toContain('await this.parse(');
          expect(content).toContain('this.parsedFlags = flags');
        });

        it('should call apiRequest', () => {
          content = content || fs.readFileSync(cmd.filePath, 'utf-8');
          expect(content).toContain('this.apiRequest(');
        });

        it('DELETE commands should have force flag', () => {
          content = content || fs.readFileSync(cmd.filePath, 'utf-8');
          const methodMatch = content.match(/static apiMethod = "(\w+)"/);
          if (methodMatch?.[1] === 'DELETE') {
            expect(content).toContain('force');
            expect(content).toContain('Вы уверены?');
          }
        });

        it('list commands should have pagination', () => {
          content = content || fs.readFileSync(cmd.filePath, 'utf-8');
          if (cmd.action.startsWith('list') && content.includes("'all'")) {
            expect(content).toContain('flags.all');
            expect(content).toContain('cursor');
            expect(content).toContain('limit');
          }
        });

        it('flag names should be kebab-case', () => {
          content = content || fs.readFileSync(cmd.filePath, 'utf-8');
          // Extract all flag names from Flags declarations: 'flagName': Flags.type({
          const flagNames = [...content.matchAll(/'([^']+)':\s*Flags\.\w+\(/g)].map((m) => m[1]);
          for (const name of flagNames) {
            expect(name, `Flag "${name}" should be kebab-case`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
          }
        });

        it('boolean flags should have allowNo', () => {
          content = content || fs.readFileSync(cmd.filePath, 'utf-8');
          // Find Flags.boolean blocks, except --force and --all which are action flags
          const booleanBlocks = [...content.matchAll(/'([^']+)':\s*Flags\.boolean\(\{([^}]*)\}/gs)];
          for (const [, name, body] of booleanBlocks) {
            if (name === 'force' || name === 'all') continue;
            expect(body, `Boolean flag --${name} should have allowNo: true`).toContain('allowNo: true');
          }
        });

        it('should not have dead requiresAuth', () => {
          content = content || fs.readFileSync(cmd.filePath, 'utf-8');
          expect(content).not.toContain('static requiresAuth');
        });

        it('should not import unused Readable', () => {
          content = content || fs.readFileSync(cmd.filePath, 'utf-8');
          if (content.includes("from 'node:stream'")) {
            expect(content, 'Readable imported but not used').toContain('Readable.');
          }
        });

        it('PUT/PATCH with wrapper body should warn on empty fields', () => {
          content = content || fs.readFileSync(cmd.filePath, 'utf-8');
          const methodMatch = content.match(/static apiMethod = "(\w+)"/);
          const method = methodMatch?.[1];
          if ((method === 'PUT' || method === 'PATCH') && content.includes('const inner =')) {
            expect(content).toContain('Object.keys(inner).length === 0');
          }
        });

        it('JSON array/object flags should use parseJSON', () => {
          content = content || fs.readFileSync(cmd.filePath, 'utf-8');
          // Find flags parsed as JSON in the body — pattern: this.parseJSON(flags['name'], 'name')
          // Ensure no raw JSON.parse(flags[...]) calls
          expect(content).not.toMatch(/JSON\.parse\(flags\[/);
        });
      });
    }
  });
});
