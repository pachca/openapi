import type {
	INodeType,
	INodeTypeBaseDescription,
	INodeTypeDescription,
	IExecuteFunctions,
	INodeExecutionData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { router } from '../SharedRouter';
import { searchChats, searchUsers, searchEntities, getCustomProperties } from '../GenericFunctions';

import { securityOperations, securityFields } from './SecurityDescription';
import { botOperations, botFields } from './BotDescription';
import { chatOperations, chatFields } from './ChatDescription';
import { memberOperations, memberFields } from './MemberDescription';
import { customPropertyOperations, customPropertyFields } from './CustomPropertyDescription';
import { fileOperations, fileFields } from './FileDescription';
import { groupTagOperations, groupTagFields } from './GroupTagDescription';
import { messageOperations, messageFields } from './MessageDescription';
import { reactionOperations, reactionFields } from './ReactionDescription';
import { readMemberOperations, readMemberFields } from './ReadMemberDescription';
import { threadOperations, threadFields } from './ThreadDescription';
import { oauthOperations, oauthFields } from './OauthDescription';
import { profileOperations, profileFields } from './ProfileDescription';
import { searchOperations, searchFields } from './SearchDescription';
import { taskOperations, taskFields } from './TaskDescription';
import { userOperations, userFields } from './UserDescription';
import { formOperations, formFields } from './FormDescription';

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
					{ name: 'Chat Member', value: 'member' },
					{ name: 'Custom Property', value: 'customProperty' },
					{ name: 'File', value: 'file' },
					{ name: 'Form', value: 'form' },
					{ name: 'Group Tag', value: 'groupTag' },
					{ name: 'Message', value: 'message' },
					{ name: 'OAuth', value: 'oauth' },
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
				...customPropertyOperations,
				...customPropertyFields,
				...fileOperations,
				...fileFields,
				...groupTagOperations,
				...groupTagFields,
				...messageOperations,
				...messageFields,
				...reactionOperations,
				...reactionFields,
				...readMemberOperations,
				...readMemberFields,
				...threadOperations,
				...threadFields,
				...oauthOperations,
				...oauthFields,
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
			],
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return router.call(this);
	}

	methods = {
		listSearch: { searchChats, searchUsers, searchEntities },
		loadOptions: { getCustomProperties },
	};
}
