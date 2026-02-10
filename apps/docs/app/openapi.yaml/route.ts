import fs from 'fs';
import path from 'path';

export async function GET(): Promise<Response> {
  const openapiPath = path.join(process.cwd(), '..', '..', 'packages', 'spec', 'openapi.yaml');
  const content = fs.readFileSync(openapiPath, 'utf-8');

  return new Response(content, {
    headers: {
      'Content-Type': 'text/yaml; charset=utf-8',
      'Content-Disposition': 'inline; filename="openapi.yaml"',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
