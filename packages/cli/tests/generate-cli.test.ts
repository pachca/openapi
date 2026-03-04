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

  describe('toKebabCase via generated output', () => {
    it('should convert camelCase flag names to kebab-case (direct-url)', () => {
      const content = fs.readFileSync(
        path.join(COMMANDS_DIR, 'common', 'direct-url.ts'),
        'utf-8',
      );
      expect(content).toContain("'content-disposition'");
      expect(content).toContain("'x-amz-credential'");
      expect(content).toContain("'x-amz-algorithm'");
      expect(content).toContain("'x-amz-date'");
      expect(content).toContain("'x-amz-signature'");
      // Must NOT contain camelCase flag names
      expect(content).not.toMatch(/'contentDisposition':\s*Flags/);
      expect(content).not.toMatch(/'xAmz\w+':\s*Flags/);
    });

    it('should convert composite param names with underscores (sort flags)', () => {
      const content = fs.readFileSync(
        path.join(COMMANDS_DIR, 'chats', 'list.ts'),
        'utf-8',
      );
      // sort[last_message_at] → sort-last-message-at (not sort-last_message_at)
      expect(content).toContain("'sort-last-message-at'");
      // Flag declaration must be kebab-case (wire name in query object keeps underscores)
      expect(content).not.toMatch(/'sort-last_message_at':\s*Flags/);
    });
  });

  describe('wrapper unwrap with sibling fields', () => {
    it('users/create should have individual flags, not a single user JSON flag', () => {
      const content = fs.readFileSync(
        path.join(COMMANDS_DIR, 'users', 'create.ts'),
        'utf-8',
      );
      // Individual flags for user fields
      expect(content).toContain("'first-name': Flags.string");
      expect(content).toContain("'last-name': Flags.string");
      expect(content).toContain("'email': Flags.string");
      // Sibling field at top level of body (not inside user wrapper)
      expect(content).toContain("skip_email_notify: flags['skip-email-notify']");
      // Wrapper structure: user: { first_name, ... } at inner level
      expect(content).toContain("user: {");
      expect(content).toContain("first_name: flags['first-name']");
    });

    it('views/open should have sibling fields at top level', () => {
      const content = fs.readFileSync(
        path.join(COMMANDS_DIR, 'views', 'open.ts'),
        'utf-8',
      );
      // Siblings: type, trigger_id, private_metadata, callback_id
      expect(content).toMatch(/type: flags\['type'\],\s*\n\s*trigger_id:/);
      // View wrapper inner fields
      expect(content).toContain("view: {");
    });
  });

  describe('multipart wire names', () => {
    it('direct-url should use correct wire names in formData.append', () => {
      const content = fs.readFileSync(
        path.join(COMMANDS_DIR, 'common', 'direct-url.ts'),
        'utf-8',
      );
      expect(content).toContain("formData.append('Content-Disposition'");
      expect(content).toContain("formData.append('x-amz-credential'");
      expect(content).toContain("formData.append('x-amz-algorithm'");
      expect(content).toContain("formData.append('x-amz-date'");
      expect(content).toContain("formData.append('x-amz-signature'");
      // Flags use kebab-case
      expect(content).toContain("flags['content-disposition']");
      expect(content).toContain("flags['x-amz-credential']");
    });
  });

  describe('array query params', () => {
    it('search commands should hint comma-separated format', () => {
      const content = fs.readFileSync(
        path.join(COMMANDS_DIR, 'search', 'list-messages.ts'),
        'utf-8',
      );
      // Hint is added as string concatenation: "description" + " (через запятую)"
      expect(content).toContain('через запятую');
      expect(content).toContain("'chat-ids'");
      expect(content).toContain("'user-ids'");
    });
  });
});
