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
function formatUserName(u: { first_name: string; last_name: string; nickname: string }): string {
	const fullName = [u.first_name, u.last_name]
		.filter((v) => v != null && v !== '' && v !== 'null')
		.join(' ');
	const display = fullName || u.nickname || 'User';
	return u.nickname ? `${display} (@${u.nickname})` : display;
}

import { securityOperations, securityFields } from './SecurityDescription';
import { botOperations, botFields } from './BotDescription';
import { chatOperations, chatFields } from './ChatDescription';
import { memberOperations, memberFields } from './MemberDescription';
import { groupTagOperations, groupTagFields } from './GroupTagDescription';
import { messageOperations, messageFields } from './MessageDescription';
import { linkPreviewOperations, linkPreviewFields } from './LinkPreviewDescription';
import { reactionOperations, reactionFields } from './ReactionDescription';
import { readMemberOperations, readMemberFields } from './ReadMemberDescription';
import { threadOperations, threadFields } from './ThreadDescription';
import { profileOperations, profileFields } from './ProfileDescription';
import { searchOperations, searchFields } from './SearchDescription';
import { taskOperations, taskFields } from './TaskDescription';
import { userOperations, userFields } from './UserDescription';
import { formOperations, formFields } from './FormDescription';
import { exportOperations, exportFields } from './ExportDescription';
import { customPropertyOperations, customPropertyFields } from './CustomPropertyDescription';
import { fileOperations, fileFields } from './FileDescription';

export class PachcaV2 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			version: 2,
			defaults: { name: 'Pachca' },
			usableAsTool: true,
			inputs: [NodeConnectionTypes.Main],
			outputs: [NodeConnectionTypes.Main],
			credentials: [{ name: 'pachcaApi', required: true }],
			properties: [
				{
					displayName: 'Resource',
					name: 'resource',
					type: 'options',
					noDataExpression: true,
					options: [
					{ name: 'Bot', value: 'bot' },
					{ name: 'Chat', value: 'chat' },
					{ name: 'Chat Export', value: 'export' },
					{ name: 'Chat Member', value: 'member' },
					{ name: 'Custom Property', value: 'customProperty' },
					{ name: 'File', value: 'file' },
					{ name: 'Form', value: 'form' },
					{ name: 'Group Tag', value: 'groupTag' },
					{ name: 'Link Preview', value: 'linkPreview' },
					{ name: 'Message', value: 'message' },
					{ name: 'Profile', value: 'profile' },
					{ name: 'Reaction', value: 'reaction' },
					{ name: 'Read Member', value: 'readMember' },
					{ name: 'Search', value: 'search' },
					{ name: 'Security', value: 'security' },
					{ name: 'Task', value: 'task' },
					{ name: 'Thread', value: 'thread' },
					{ name: 'User', value: 'user' },
					],
					default: 'message',
				},
				...securityOperations,
				...securityFields,
				...botOperations,
				...botFields,
				...chatOperations,
				...chatFields,
				...memberOperations,
				...memberFields,
				...groupTagOperations,
				...groupTagFields,
				...messageOperations,
				...messageFields,
				...linkPreviewOperations,
				...linkPreviewFields,
				...reactionOperations,
				...reactionFields,
				...readMemberOperations,
				...readMemberFields,
				...threadOperations,
				...threadFields,
				...profileOperations,
				...profileFields,
				...searchOperations,
				...searchFields,
				...taskOperations,
				...taskFields,
				...userOperations,
				...userFields,
				...formOperations,
				...formFields,
				...exportOperations,
				...exportFields,
				...customPropertyOperations,
				...customPropertyFields,
				...fileOperations,
				...fileFields,
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
