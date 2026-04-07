// ============================================================================
// ReactionsDescription.ts — FROZEN V1 description (from n8n-nodes-pachca@1.0.27)
// DO NOT EDIT — this file is frozen for backward compatibility
// ============================================================================

import type { INodeProperties } from 'n8n-workflow';

export const reactionsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Add a reaction',
				value: 'addReaction',
				action: 'Add a reaction',
				description: 'Add reaction to message',
			},
			{
				name: 'Remove a reaction',
				value: 'deleteReaction',
				action: 'Remove a reaction',
				description: 'Remove reaction from message',
			},
			{
				name: 'Get message reactions',
				value: 'getReactions',
				action: 'Get message reactions',
				description: 'Get list of reactions on message',
			},
		],
		default: 'addReaction',
		displayOptions: {
			show: {
				resource: ['reactions'],
			},
		},
	},
];

export const reactionsFields: INodeProperties[] = [
	{
		displayName: 'Message ID',
		name: 'reactionsMessageId',
		type: 'number',
		default: '',
		description: 'Message ID',
		displayOptions: {
			show: {
				resource: ['reactions'],
				operation: ['addReaction', 'deleteReaction', 'getReactions'],
			},
		},
	},
	{
		displayName: 'Reaction Code',
		name: 'reactionsReactionCode',
		type: 'string',
		default: '👍',
		description: 'Reaction emoji (e.g. 👍, 🔥, ⭐)',
		displayOptions: {
			show: {
				resource: ['reactions'],
				operation: ['addReaction', 'deleteReaction'],
			},
		},
	},
	{
		displayName: 'Additional Options',
		name: 'reactionsOptions',
		type: 'collection',
		options: [
			{
				displayName: 'Limit',
				name: 'reactionsPer',
				type: 'number',
				default: 50,
				description: 'Items per request (API limit, 1–50). See https://dev.pachca.com/api/reactions/list',
			},
			{
				displayName: 'Cursor',
				name: 'reactionsCursor',
				type: 'string',
				default: '',
				description: 'Pagination cursor from meta.paginate.next_page (optional)',
			},
		],
		default: {},
		placeholder: 'Add option',
		displayOptions: {
			show: {
				resource: ['reactions'],
				operation: ['getReactions'],
			},
		},
	},
];
