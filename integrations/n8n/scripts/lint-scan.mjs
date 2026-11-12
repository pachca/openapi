// Lints the node sources exactly as n8n's community package scanner does after
// publish: its own flat config from @n8n/scan-community-package, no
// eslint-disable comments, and none of the overrides in eslint.config.mjs. The
// scanner fails a package on any error, so this script does too, before merge
// (n8n.yml runs it on every pull request that touches the node).
//
// The scanner is installed with npm into a temp directory outside the repo, not
// into the bun workspace: bun's isolated install cannot load its `typescript`, an
// npm alias to @typescript/typescript6, and npm inside the workspace picks up its
// config. Bump SCANNER_VERSION together with fixes for any rules it adds.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import os from 'node:os';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCANNER_VERSION = '0.43.0';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = path.join(os.tmpdir(), 'pachca-n8n-scan', SCANNER_VERSION);
const scannerDir = path.join(cacheDir, 'node_modules', '@n8n', 'scan-community-package');

const installedVersion = existsSync(path.join(scannerDir, 'package.json'))
	? JSON.parse(readFileSync(path.join(scannerDir, 'package.json'), 'utf8')).version
	: null;
if (installedVersion !== SCANNER_VERSION) {
	mkdirSync(cacheDir, { recursive: true });
	console.log(`Installing @n8n/scan-community-package@${SCANNER_VERSION} into ${cacheDir}`);
	execFileSync(
		'npm',
		[
			'install',
			'--prefix',
			cacheDir,
			'--no-audit',
			'--no-fund',
			'--no-save',
			'--ignore-scripts',
			'--loglevel=error',
			`@n8n/scan-community-package@${SCANNER_VERSION}`,
		],
		{ stdio: 'inherit', cwd: cacheDir },
	);
}

const requireFromCache = createRequire(path.join(cacheDir, 'package.json'));
const { ESLint } = requireFromCache('eslint');
const glob = createRequire(path.join(scannerDir, 'package.json'))('fast-glob');
const { buildScanConfig, SOURCE_FILE_PATTERNS } = await import(
	pathToFileURL(path.join(scannerDir, 'dist', 'scanner.js')).href
);

const eslint = new ESLint({
	cwd: packageDir,
	allowInlineConfig: false,
	overrideConfigFile: true,
	overrideConfig: await buildScanConfig(),
});
const files = glob.sync(SOURCE_FILE_PATTERNS, {
	cwd: packageDir,
	absolute: true,
	ignore: ['node_modules/**', '**/package-lock.json'],
});
const results = await eslint.lintFiles(files);
const errors = results.reduce((sum, r) => sum + r.errorCount, 0);

if (errors > 0) {
	const formatter = await eslint.loadFormatter('stylish');
	console.error(await formatter.format(results.filter((r) => r.errorCount > 0)));
	console.error(`n8n community scan: ${errors} error(s). The n8n scanner rejects the package with any error.`);
	process.exit(1);
}
console.log(`n8n community scan (scanner ${SCANNER_VERSION}): 0 errors in ${files.length} files`);
