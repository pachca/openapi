import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  type Schema, type Endpoint,
  parseOpenAPI, resolveAllOf, getSchemaType,
} from '../scripts/openapi-parser.js';

const COMMANDS_DIR = path.join(__dirname, '..', 'src', 'commands');

// ----- Helpers -----

function toKebabCase(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/_/g, '-').toLowerCase();
}

/** Same logic as generator for composite param flag name */
function compositeParamFlagName(subName: string): string {
  return toKebabCase(subName.replace(/[\[\]]/g, '-').replace(/-+/g, '-').replace(/-$/, ''));
}

function getWrapperKey(schema: Schema): string | null {
  const resolved = resolveAllOf(schema);
  if (!resolved.properties) return null;
  const keys = Object.keys(resolved.properties);
  const objectKeys = keys.filter((k) => {
    const inner = resolveAllOf(resolved.properties![k]);
    return inner.properties && Object.keys(inner.properties).length > 0;
  });
  if (objectKeys.length === 1) return objectKeys[0];
  return null;
}

function extractBodyFields(requestBody?: Endpoint['requestBody']) {
  if (!requestBody) return [];
  const content = requestBody.content['application/json'] || requestBody.content['multipart/form-data'];
  if (!content?.schema) return [];

  const resolved = resolveAllOf(content.schema);
  const properties = resolved.properties || {};

  const topKeys = Object.keys(properties);
  const objectKeys = topKeys.filter((k) => {
    const inner = resolveAllOf(properties[k]);
    return inner.properties && Object.keys(inner.properties).length > 0;
  });

  if (objectKeys.length === 1) {
    const wrapperKey = objectKeys[0];
    const innerResolved = resolveAllOf(properties[wrapperKey]);
    if (innerResolved.properties) {
      const fields = Object.entries(innerResolved.properties)
        .filter(([, v]) => !v.readOnly)
        .map(([name, p]) => ({ name, type: getSchemaType(p), enum: p.enum, isSibling: false }));

      for (const key of topKeys) {
        if (key === wrapperKey) continue;
        const p = resolveAllOf(properties[key]);
        fields.push({ name: key, type: getSchemaType(p), enum: p.enum, isSibling: true });
      }
      return fields;
    }
  }

  return Object.entries(properties).filter(([, v]) => !v.readOnly)
    .map(([name, p]) => ({ name, type: getSchemaType(p), enum: p.enum, isSibling: false }));
}

const MULTIPART_WIRE_NAMES: Record<string, string> = {
  contentDisposition: 'Content-Disposition',
  xAmzCredential: 'x-amz-credential',
  xAmzAlgorithm: 'x-amz-algorithm',
  xAmzDate: 'x-amz-date',
  xAmzSignature: 'x-amz-signature',
};

// ----- Tests -----

describe('contract tests', () => {
  const endpoints = parseOpenAPI();

  it('should have at least 50 endpoints', () => {
    expect(endpoints.length).toBeGreaterThanOrEqual(50);
  });

  // Build map of generated command files
  const generatedFiles = new Map<string, string>();
  const commandSections = fs.readdirSync(COMMANDS_DIR).filter((f) =>
    fs.statSync(path.join(COMMANDS_DIR, f)).isDirectory()
  );
  for (const section of commandSections) {
    const sectionDir = path.join(COMMANDS_DIR, section);
    for (const file of fs.readdirSync(sectionDir).filter((f) => f.endsWith('.ts'))) {
      const content = fs.readFileSync(path.join(sectionDir, file), 'utf-8');
      if (content.includes('Auto-generated from openapi.yaml')) {
        generatedFiles.set(`${section}/${file.replace('.ts', '')}`, content);
      }
    }
  }

  function findCommand(ep: Endpoint): { key: string; content: string } | null {
    for (const [key, content] of generatedFiles) {
      const m = content.match(/static apiMethod = "(\w+)"/);
      const p = content.match(/static apiPath = "([^"]+)"/);
      if (m?.[1] === ep.method && p?.[1] === ep.path) return { key, content };
    }
    return null;
  }

  /** Check if flag name exists in the command source (handles both 'name': and name: forms) */
  function hasFlag(content: string, flagName: string): boolean {
    return content.includes(`'${flagName}'`) || new RegExp(`\\b${flagName}:\\s*Flags\\.`).test(content);
  }

  for (const endpoint of endpoints) {
    const cmd = findCommand(endpoint);
    if (!cmd) continue;

    const hasPagination = endpoint.parameters.some((p) => p.in === 'query' && p.name === 'limit');

    describe(`${endpoint.method} ${endpoint.path} → ${cmd.key}`, () => {
      it('method matches', () => {
        expect(cmd.content).toMatch(new RegExp(`static apiMethod = "${endpoint.method}"`));
      });

      it('path matches', () => {
        expect(cmd.content).toContain(`static apiPath = "${endpoint.path}"`);
      });

      // Path parameters → Args
      const pathParams = [...endpoint.path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      for (const param of pathParams) {
        it(`path param {${param}} → arg`, () => {
          expect(cmd.content).toContain(`${param}: Args.`);
        });
      }

      // Query parameters → Flags
      const queryParams = endpoint.parameters.filter((p) => p.in === 'query');
      for (const param of queryParams) {
        // Skip limit/cursor — generator replaces them with its own pagination flags
        if (hasPagination && (param.name === 'limit' || param.name === 'cursor')) continue;

        if (param['x-param-names']) {
          it(`composite sort params → --sort and --order flags`, () => {
            expect(hasFlag(cmd.content, 'sort')).toBe(true);
            expect(hasFlag(cmd.content, 'order')).toBe(true);
          });
        } else {
          const kebabName = toKebabCase(param.name);
          it(`query ${param.name} → --${kebabName}`, () => {
            expect(hasFlag(cmd.content, kebabName)).toBe(true);
          });
        }
      }

      // Body fields → Flags
      const bodyFields = extractBodyFields(endpoint.requestBody);
      for (const field of bodyFields) {
        const kebabName = toKebabCase(field.name);
        it(`body ${field.name} → --${kebabName}`, () => {
          expect(hasFlag(cmd.content, kebabName)).toBe(true);
        });
      }

      // Enum constraints
      for (const field of bodyFields) {
        if (field.enum && field.enum.length > 0) {
          it(`enum ${field.name} has options`, () => {
            for (const val of field.enum!) expect(cmd.content).toContain(String(val));
          });
        }
      }
      for (const param of queryParams) {
        if (hasPagination && (param.name === 'limit' || param.name === 'cursor')) continue;
        if (param['x-param-names']) continue;
        if (param.schema.enum && param.schema.enum.length > 0) {
          it(`query enum ${param.name} has options`, () => {
            for (const val of param.schema.enum!) expect(cmd.content).toContain(String(val));
          });
        }
      }

      // Scope
      if (endpoint.requirements?.scope) {
        it(`scope = "${endpoint.requirements.scope}"`, () => {
          expect(cmd.content).toContain(`static scope = "${endpoint.requirements!.scope}"`);
        });
      }

      // Wrapper unwrap
      if (endpoint.requestBody?.content['application/json']) {
        const jsonSchema = endpoint.requestBody.content['application/json'].schema;
        const wrapperKey = getWrapperKey(jsonSchema);
        if (wrapperKey) {
          it(`wrapper key "${wrapperKey}"`, () => {
            expect(cmd.content).toContain(`${wrapperKey}: {`);
          });

          const resolved = resolveAllOf(jsonSchema);
          const siblings = Object.keys(resolved.properties || {}).filter((k) => k !== wrapperKey);
          for (const sibling of siblings) {
            const sibResolved = resolveAllOf((resolved.properties || {})[sibling]);
            if (!sibResolved.properties || Object.keys(sibResolved.properties).length === 0) {
              it(`sibling "${sibling}" at top level`, () => {
                expect(cmd.content).toMatch(new RegExp(`${sibling}:\\s*flags\\[`));
              });
            }
          }
        }
      }

      // Pagination
      if (hasPagination) {
        it('has pagination flags', () => {
          expect(hasFlag(cmd.content, 'limit')).toBe(true);
          expect(hasFlag(cmd.content, 'cursor')).toBe(true);
          expect(hasFlag(cmd.content, 'all')).toBe(true);
        });

        it('has auto-pagination', () => {
          expect(cmd.content).toContain('flags.all');
          expect(cmd.content).toContain('nextCursor');
          expect(cmd.content).toContain('seenCursors');
        });
      }

      // DELETE → --force
      if (endpoint.method === 'DELETE') {
        it('has --force + confirmation', () => {
          expect(hasFlag(cmd.content, 'force')).toBe(true);
          expect(cmd.content).toContain('Вы уверены?');
        });
      }

      // Boolean flags → allowNo
      const boolFlags = [...cmd.content.matchAll(/'([^']+)':\s*Flags\.boolean\(\{([^}]*)\}/gs)];
      for (const [, name, body] of boolFlags) {
        if (name === 'force' || name === 'all') continue;
        it(`--${name} has allowNo`, () => {
          expect(body).toContain('allowNo: true');
        });
      }

      // Array query params → hint
      for (const param of queryParams) {
        if (hasPagination && (param.name === 'limit' || param.name === 'cursor')) continue;
        if (param['x-param-names']) continue;
        if (param.schema.type === 'array' || param.schema.items) {
          it(`array ${param.name} has comma hint`, () => {
            expect(cmd.content).toContain('через запятую');
          });
        }
      }

      // Multipart wire names
      if (endpoint.requestBody?.content['multipart/form-data']) {
        it('uses FormData', () => {
          expect(cmd.content).toContain('FormData');
        });

        const mpSchema = endpoint.requestBody.content['multipart/form-data'].schema;
        const resolved = resolveAllOf(mpSchema);
        if (resolved.properties) {
          for (const propName of Object.keys(resolved.properties)) {
            const wireName = MULTIPART_WIRE_NAMES[propName];
            if (wireName) {
              it(`multipart "${propName}" → wire "${wireName}"`, () => {
                expect(cmd.content).toContain(`'${wireName}'`);
              });
            }
          }
        }
      }

      // All flags are kebab-case
      const flagNames = [...cmd.content.matchAll(/'([^']+)':\s*Flags\.\w+\(/g)].map((m) => m[1]);
      for (const name of flagNames) {
        it(`flag "${name}" is kebab-case`, () => {
          expect(name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
        });
      }
    });
  }
});
