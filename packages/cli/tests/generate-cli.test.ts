import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const COMMANDS_DIR = path.join(__dirname, '..', 'src', 'commands');
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');

describe('generate-cli', () => {
  const generatedSections = fs.readdirSync(COMMANDS_DIR).filter((f) => {
    const fullPath = path.join(COMMANDS_DIR, f);
    return fs.statSync(fullPath).isDirectory() && !['auth', 'config'].includes(f);
  });

  describe('generated commands structure', () => {
    it('should generate commands from known sections', () => {
      const expectedSections = [
        'bots', 'chats', 'common', 'group-tags', 'link-previews',
        'members', 'messages', 'profile', 'reactions', 'read-member',
        'search', 'security', 'tasks', 'thread', 'users', 'views',
      ];

      for (const section of expectedSections) {
        expect(generatedSections, `Missing section: ${section}`).toContain(section);
      }
    });

    it('each generated command should have the auto-generated marker', () => {
      for (const section of generatedSections) {
        const sectionDir = path.join(COMMANDS_DIR, section);
        const files = fs.readdirSync(sectionDir).filter((f) => f.endsWith('.ts'));

        for (const file of files) {
          const content = fs.readFileSync(path.join(sectionDir, file), 'utf-8');
          if (content.includes('Auto-generated from openapi.yaml')) {
            expect(content).toContain('extends BaseCommand');
            expect(content).toContain('static override description');
            expect(content).toContain('static apiMethod');
            expect(content).toContain('static apiPath');
            expect(content).toContain('async run()');
          }
        }
      }
    });

    it('all generated commands should have valid class names', () => {
      for (const section of generatedSections) {
        const sectionDir = path.join(COMMANDS_DIR, section);
        const files = fs.readdirSync(sectionDir).filter((f) => f.endsWith('.ts'));

        for (const file of files) {
          const content = fs.readFileSync(path.join(sectionDir, file), 'utf-8');
          if (!content.includes('Auto-generated from openapi.yaml')) continue;
          const classMatch = content.match(/export default class (\w+)/);
          expect(classMatch, `No class found in ${section}/${file}`).toBeTruthy();
          // Class name should be PascalCase
          expect(classMatch![1]).toMatch(/^[A-Z][a-zA-Z]+$/);
        }
      }
    });
  });

  describe('messages/create command snapshot', () => {
    it('should have correct structure', () => {
      const content = fs.readFileSync(
        path.join(COMMANDS_DIR, 'messages', 'create.ts'),
        'utf-8',
      );
      expect(content).toContain('Auto-generated from openapi.yaml');
      expect(content).toContain('static apiMethod = "POST"');
      expect(content).toContain('static apiPath = "/messages"');
      expect(content).toContain('entity-id');
      expect(content).toContain('content');
      expect(content).toContain("method: 'POST'");
      expect(content).toContain("path: '/messages'");
    });
  });

  describe('users/list command snapshot', () => {
    it('should have pagination params', () => {
      const content = fs.readFileSync(
        path.join(COMMANDS_DIR, 'users', 'list.ts'),
        'utf-8',
      );
      expect(content).toContain('Auto-generated from openapi.yaml');
      expect(content).toContain('static apiMethod = "GET"');
      expect(content).toContain('limit');
      expect(content).toContain('cursor');
    });
  });

  describe('users/delete command snapshot', () => {
    it('should have force flag and confirmation', () => {
      const content = fs.readFileSync(
        path.join(COMMANDS_DIR, 'users', 'delete.ts'),
        'utf-8',
      );
      expect(content).toContain('Auto-generated from openapi.yaml');
      expect(content).toContain('static apiMethod = "DELETE"');
      expect(content).toContain('force');
      expect(content).toContain('clack.confirm');
      expect(content).toContain('Вы уверены?');
    });
  });

  describe('data files', () => {
    it('should generate workflows.json', () => {
      const filePath = path.join(DATA_DIR, 'workflows.json');
      expect(fs.existsSync(filePath)).toBe(true);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(Array.isArray(data)).toBe(true);
    });

    it('should generate alternatives.json', () => {
      const filePath = path.join(DATA_DIR, 'alternatives.json');
      expect(fs.existsSync(filePath)).toBe(true);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(typeof data).toBe('object');
      // Should have command entries
      expect(Object.keys(data).length).toBeGreaterThan(0);
    });
  });

  describe('README generation', () => {
    it('should generate README.md with auto sections', () => {
      const readmePath = path.join(__dirname, '..', 'README.md');
      expect(fs.existsSync(readmePath)).toBe(true);
      const content = fs.readFileSync(readmePath, 'utf-8');
      expect(content).toContain('AUTO:COMMANDS');
      expect(content).toContain('AUTO:FLAGS');
    });
  });

  describe('scope metadata', () => {
    it('commands with scope should have static scope property', () => {
      const content = fs.readFileSync(
        path.join(COMMANDS_DIR, 'messages', 'create.ts'),
        'utf-8',
      );
      expect(content).toContain('static scope = ');
    });
  });
});
