import * as fs from 'fs';
import * as path from 'path';
import { clearCache } from './parser';

const OPENAPI_PATH = path.join(process.cwd(), '..', '..', 'packages', 'spec', 'openapi.yaml');

export function watchOpenAPIFile(onUpdate: () => void) {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  console.log('🔍 Watching OpenAPI file for changes:', OPENAPI_PATH);

  const watcher = fs.watch(OPENAPI_PATH, (eventType) => {
    if (eventType === 'change') {
      console.log('🔄 OpenAPI file changed, clearing cache...');
      clearCache();
      onUpdate();
    }
  });

  return () => {
    watcher.close();
  };
}
