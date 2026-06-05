// ============================================================================
// PachcaV1.node.ts — FROZEN V1 node class (from n8n-nodes-pachca@1.0.27)
// DO NOT EDIT — this file is frozen for backward compatibility
// ============================================================================

import type {
	INodeType,
	INodeTypeBaseDescription,
	INodeTypeDescription,
	IExecuteFunctions,
	INodeExecutionData,
	ILoadOptionsFunctions,
	INodeListSearchResult,
	INodePropertyOptions,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { router } from '../SharedRouter';

import { messageOperations, messageFields } from './MessageDescription';
import { threadOperations, threadFields } from './ThreadDescription';
import { reactionsOperations, reactionsFields } from './ReactionsDescription';
import { chatOperations, chatFields } from './ChatDescription';
import { userOperations, userFields } from './UserDescription';
import { groupTagOperations, groupTagFields } from './GroupTagDescription';
import { statusOperations, statusFields } from './StatusDescription';
import { customFieldsOperations, customFieldsFields } from './CustomFieldsDescription';
import { taskOperations, taskFields } from './TaskDescription';
import { botOperations, botFields } from './BotDescription';
import { fileOperations, fileFields } from './FileDescription';
import { formOperations, formFields } from './FormDescription';

function formatUserName(u: { first_name: string; last_name: string; nickname: string }): string {
	const fullName = [u.first_name, u.last_name]
		.filter((v) => v != null && v !== '' && v !== 'null')
		.join(' ');
	const display = fullName || u.nickname || 'User';
	return u.nickname ? `${display} (@${u.nickname})` : display;
}

export class PachcaV1 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			version: 1,
			defaults: { name: 'Pachca' },
			inputs: [NodeConnectionTypes.Main],
			outputs: [NodeConnectionTypes.Main],
			credentials: [{ name: 'pachcaApi', required: true }],
			properties: [
				{
					displayName:
						'<strong>New node version available:</strong> get the latest version with added features from the nodes panel.',
					name: 'oldVersionNotice',
					type: 'notice',
					default: '',
				},
				{
					displayName: 'Resource',
					name: 'resource',
					type: 'options',
					noDataExpression: true,
					options: [
						{ name: 'Message', value: 'message' },
						{ name: 'Thread', value: 'thread' },
						{ name: 'Reactions', value: 'reactions' },
						{ name: 'Chat', value: 'chat' },
						{ name: 'User', value: 'user' },
						{ name: 'Group Tag', value: 'groupTag' },
						{ name: 'Status', value: 'status' },
						{ name: 'Custom Fields', value: 'customFields' },
						{ name: 'Task', value: 'task' },
						{ name: 'Bot', value: 'bot' },
						{ name: 'File', value: 'file' },
						{ name: 'Form', value: 'form' },
					],
					default: 'message',
				},
				...messageOperations,
				...messageFields,
				...threadOperations,
				...threadFields,
				...reactionsOperations,
				...reactionsFields,
				...chatOperations,
				...chatFields,
				...userOperations,
				...userFields,
				...groupTagOperations,
				...groupTagFields,
				...statusOperations,
				...statusFields,
				...customFieldsOperations,
				...customFieldsFields,
				...taskOperations,
				...taskFields,
				...botOperations,
				...botFields,
				...fileOperations,
				...fileFields,
				...formOperations,
				...formFields,
			],
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return router.call(this);
	}

	methods = {
		listSearch: {
			async searchChats(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
				const credentials = await this.getCredentials('pachcaApi');
				const url = filter
					? `${credentials.baseUrl}/search/chats?query=${encodeURIComponent(filter)}`
					: `${credentials.baseUrl}/chats?per=50`;
				const response = await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', {
					method: 'GET',
					url,
				});
				const items = response.data ?? [];
				return {
					results: items.map((c: { id: number; name: string }) => ({
						name: c.name,
						value: c.id,
					})),
				};
			},
			async searchUsers(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
				const credentials = await this.getCredentials('pachcaApi');
				if (!filter) return { results: [] };
				const url = `${credentials.baseUrl}/search/users?query=${encodeURIComponent(filter)}`;
				const response = await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', {
					method: 'GET',
					url,
				});
				const items = response.data ?? [];
				return {
					results: items.map((u: { id: number; first_name: string; last_name: string; nickname: string }) => ({
						name: formatUserName(u),
						value: u.id,
					})),
				};
			},
			async searchEntities(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
				let entityType = 'discussion';
				try {
					entityType = (this.getNodeParameter('entityType') as string) || 'discussion';
				} catch {
					try {
						entityType = (this.getCurrentNodeParameter('entityType') as string) || 'discussion';
					} catch { /* parameter may not exist yet */ }
				}
				const credentials = await this.getCredentials('pachcaApi');
				if (entityType === 'user') {
					if (!filter) return { results: [] };
					const url = `${credentials.baseUrl}/search/users?query=${encodeURIComponent(filter)}`;
					const response = await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', { method: 'GET', url });
					const items = response.data ?? [];
					return {
						results: items.map((u: { id: number; first_name: string; last_name: string; nickname: string }) => ({
							name: formatUserName(u),
							value: u.id,
						})),
					};
				}
				if (entityType === 'thread') {
					return { results: [] };
				}
				const url = filter
					? `${credentials.baseUrl}/search/chats?query=${encodeURIComponent(filter)}`
					: `${credentials.baseUrl}/chats?per=50`;
				const response = await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', { method: 'GET', url });
				const items = response.data ?? [];
				return {
					results: items.map((c: { id: number; name: string }) => ({
						name: c.name,
						value: c.id,
					})),
				};
			},
		},
		loadOptions: {
			async getCustomProperties(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('pachcaApi');
				const resource = this.getNodeParameter('resource') as string;
				const entityType = resource === 'task' ? 'Task' : 'User';
				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', {
						method: 'GET',
						url: `${credentials.baseUrl}/custom_properties?entity_type=${entityType}`,
					});
					const items = response.data ?? [];
					return items.map((p: { id: number; name: string }) => ({
						name: p.name,
						value: p.id,
					}));
				} catch {
					return [];
				}
			},
		},
	};
}
