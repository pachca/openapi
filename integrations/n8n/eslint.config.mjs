import { config } from '@n8n/node-cli/eslint';

export default [
	...config,
	{ ignores: ['scripts/', 'tests/', 'dist/', 'e2e/', 'nodes/Pachca/V1/'] },
	{
		rules: {
			// Optional filter query params use empty default to mean "no filter"
			'n8n-nodes-base/node-param-default-wrong-for-options': 'off',
		},
	},
	{
		files: ['nodes/Pachca/V2/PachcaV2.node.ts'],
		rules: {
			// Icon is set in baseDescription (VersionedNodeType wrapper), not in version class
			'@n8n/community-nodes/icon-validation': 'off',
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
