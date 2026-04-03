import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { verifyWebhookSignature, resolveBotId } from './GenericFunctions';

/** Maps n8n event value to webhook payload { type, event } for filtering */
const EVENT_FILTER: Record<string, { type: string; event: string }> = {
	'button_pressed': { type: 'button', event: 'click' },
	'chat_member_added': { type: 'chat_member', event: 'add' },
	'chat_member_removed': { type: 'chat_member', event: 'remove' },
	'form_submitted': { type: 'view', event: 'submit' },
	'link_shared': { type: 'message', event: 'link_shared' },
	'message_deleted': { type: 'message', event: 'delete' },
	'message_updated': { type: 'message', event: 'update' },
	'new_message': { type: 'message', event: 'new' },
	'new_reaction': { type: 'reaction', event: 'new' },
	'reaction_deleted': { type: 'reaction', event: 'delete' },
	'company_member_activate': { type: 'company_member', event: 'activate' },
	'company_member_confirm': { type: 'company_member', event: 'confirm' },
	'company_member_delete': { type: 'company_member', event: 'delete' },
	'company_member_invite': { type: 'company_member', event: 'invite' },
	'company_member_suspend': { type: 'company_member', event: 'suspend' },
	'company_member_update': { type: 'company_member', event: 'update' },
};

export class PachcaTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Pachca Trigger',
		name: 'pachcaTrigger',
		icon: { light: 'file:pachca.svg', dark: 'file:pachca.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts workflow when Pachca events occur',
		defaults: { name: 'Pachca Trigger' },
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'pachcaApi', required: true }],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
				rawBody: true,
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'All Events', value: '*' },
					{ name: 'Button Pressed', value: 'button_pressed' },
					{ name: 'Chat Member Added', value: 'chat_member_added' },
					{ name: 'Chat Member Removed', value: 'chat_member_removed' },
					{ name: 'Form Submitted', value: 'form_submitted' },
					{ name: 'Link Shared', value: 'link_shared' },
					{ name: 'Message Deleted', value: 'message_deleted' },
					{ name: 'Message Updated', value: 'message_updated' },
					{ name: 'New Message', value: 'new_message' },
					{ name: 'New Reaction', value: 'new_reaction' },
					{ name: 'Reaction Deleted', value: 'reaction_deleted' },
					{ name: 'User Activated', value: 'company_member_activate' },
					{ name: 'User Confirmed', value: 'company_member_confirm' },
					{ name: 'User Deleted', value: 'company_member_delete' },
					{ name: 'User Invited', value: 'company_member_invite' },
					{ name: 'User Suspended', value: 'company_member_suspend' },
					{ name: 'User Updated', value: 'company_member_update' },
				],
				default: 'new_message',
				description: 'The event to listen for',
			},
		],
		usableAsTool: true,
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('pachcaApi');
				let botId: number;
				try {
					botId = await resolveBotId(this, credentials);
				} catch {
					return false; // Network error → treat as not exists, will trigger create
				}
				if (!botId) return false;
				const webhookUrl = this.getNodeWebhookUrl('default');
				try {
					const response = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'pachcaApi',
						{
							method: 'GET',
							url: `${credentials.baseUrl}/bots/${botId}`,
						},
					)) as IDataObject;
					const data = response.data as IDataObject | undefined;
					const webhook = data?.webhook as IDataObject | undefined;
					return webhook?.outgoing_url === webhookUrl;
				} catch {
					return false;
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('pachcaApi');
				const botId = await resolveBotId(this, credentials);
				if (!botId) {
					this.logger.warn('Pachca Trigger: token is not a bot token. Webhook was NOT registered automatically. Configure webhook URL manually in Pachca bot settings.');
					return true;
				}
				const webhookUrl = this.getNodeWebhookUrl('default');
				await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', {
					method: 'PUT',
					url: `${credentials.baseUrl}/bots/${botId}`,
					body: { bot: { webhook: { outgoing_url: webhookUrl } } },
				});
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('pachcaApi');
				let botId: number;
				try {
					botId = await resolveBotId(this, credentials);
				} catch {
					return true; // Can't resolve bot → nothing to clean up
				}
				if (!botId) return true;
				try {
					await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', {
						method: 'PUT',
						url: `${credentials.baseUrl}/bots/${botId}`,
						body: { bot: { webhook: { outgoing_url: '' } } },
					});
				} catch {
					// Ignore errors on cleanup
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData() as IDataObject;
		const headerData = this.getHeaderData() as IDataObject;
		const credentials = await this.getCredentials('pachcaApi');
		const event = this.getNodeParameter('event') as string;

		// IP allowlist check
		const allowedIps = ((credentials.webhookAllowedIps as string) || '').split(',').map(s => s.trim()).filter(Boolean);
		if (allowedIps.length > 0) {
			const request = this.getRequestObject();
			const clientIp = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || request.socket?.remoteAddress || '';
			const normalizedIp = clientIp.replace(/^::ffff:/, '');
			if (!allowedIps.includes(normalizedIp)) {
				return { webhookResponse: 'Forbidden' };
			}
		}

		// Signing secret verification (use raw body bytes for accurate HMAC)
		const signingSecret = ((credentials.signingSecret as string) || '').trim();
		if (signingSecret) {
			const signature = headerData['pachca-signature'] as string;
			if (!signature) {
				return { webhookResponse: 'Rejected' };
			}
			const request = this.getRequestObject();
			const rawBody = request.rawBody
				? request.rawBody.toString()
				: JSON.stringify(body);
			if (
				!verifyWebhookSignature(
					rawBody,
					signature,
					signingSecret,
				)
			) {
				return { webhookResponse: 'Rejected' };
			}
		}

		// Replay protection — reject events older than 5 minutes
		const webhookTs = body.webhook_timestamp as number | undefined;
		if (webhookTs) {
			const ageMs = Date.now() - webhookTs * 1000;
			if (Math.abs(ageMs) > 5 * 60 * 1000) {
				return { webhookResponse: 'Rejected' };
			}
		}

		// Event filtering using type+event from payload
		if (event !== '*') {
			const filter = EVENT_FILTER[event];
			if (filter) {
				const bodyType = body.type as string | undefined;
				const bodyEvent = body.event as string | undefined;
				if (bodyType !== filter.type || bodyEvent !== filter.event) {
					return { webhookResponse: 'Event filtered' };
				}
			}
		}

		return {
			workflowData: [this.helpers.returnJsonArray(body)],
		};
	}
}
