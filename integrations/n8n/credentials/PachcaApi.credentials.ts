import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PachcaApi implements ICredentialType {
	name = 'pachcaApi';
	displayName = 'Pachca API';
	icon = { light: 'file:pachca.svg', dark: 'file:pachca.dark.svg' } as const;
	documentationUrl = 'https://dev.pachca.com/api/authorization';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.pachca.com/api/shared/v1',
			description: 'Base URL of the Pachca API. Change only for on-premise installations or API proxies.',
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
		{
			displayName: 'Bot ID',
			name: 'botId',
			type: 'number',
			default: 0,
			description: 'Bot ID for automatic webhook registration (found in bot settings). Leave empty to auto-detect from token. Only needed for Pachca Trigger node.',
			hint: 'Only required when using a bot token with the Pachca Trigger node',
		},
		{
			displayName: 'Webhook Signing Secret',
			name: 'signingSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Used to verify incoming webhook requests from Pachca. Found in bot settings under the Webhook section.',
			hint: 'Only required when using the Pachca Trigger node',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/oauth/token/info',
			method: 'GET',
		},
	};
}
