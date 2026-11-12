import { config } from '@n8n/node-cli/eslint';

// `eslint .` runs the rules bundled with @n8n/node-cli, and `generate-n8n` runs it
// with --fix on generated files. The authoritative check is `bun run lint:scan`
// (scripts/lint-scan.mjs): n8n's community package scanner config, which ignores
// this file and covers V1 too. The overrides below only keep autofix from
// changing saved-workflow semantics and silence rules the scanner contradicts.
export default [
	...config,
	{ ignores: ['scripts/', 'tests/', 'dist/', 'e2e/', 'nodes/Pachca/V1/'] },
	{
		rules: {
			// The generator gives an optional options field a '' option, so its '' default
			// is valid. The autofix would instead force the first option as default and
			// silently change what an untouched saved node sends.
			'n8n-nodes-base/node-param-default-wrong-for-options': 'off',
		},
	},
	{
		files: ['nodes/Pachca/V2/FormDescription.ts'],
		rules: {
			// The generator already orders the block fields with 'Block Type' first. The
			// autofix for this rule strips displayOptions and breaks the visual builder.
			'n8n-nodes-base/node-param-fixed-collection-type-unsorted-items': 'off',
		},
	},
	{
		files: ['nodes/Pachca/PachcaTrigger.node.ts'],
		rules: {
			// The plugin bundled with @n8n/node-cli 0.23 wants usableAsTool on every node,
			// the scanner's newer plugin forbids it on triggers: a trigger cannot be an AI tool.
			'@n8n/community-nodes/node-usable-as-tool': 'off',
		},
	},
	{
		files: ['credentials/**/*.ts'],
		rules: {
			// tokenType is a dropdown (options), not a secret — false positive on "token" in name
			'@n8n/community-nodes/credential-password-field': 'off',
		},
	},
];
