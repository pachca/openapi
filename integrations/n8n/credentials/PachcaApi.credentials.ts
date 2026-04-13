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
			displayName: 'Webhook Signing Secret',
			name: 'signingSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Used to verify incoming webhook requests from Pachca. Found in bot settings under the Webhook section.',
			hint: 'Only required when using the Pachca Trigger node',
		},
		{
			displayName: 'Webhook Allowed IPs',
			name: 'webhookAllowedIps',
			type: 'string',
			default: '',
			description: 'Comma-separated list of IP addresses allowed to send webhooks. Pachca sends from 37.200.70.177. Leave empty to allow all.',
			placeholder: '37.200.70.177',
			hint: 'Only used with the Pachca Trigger node',
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
