import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { verifyWebhookSignature, getTokenProfile } from './GenericFunctions';

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
			{
				displayName: 'Webhook Setup',
				name: 'webhookSetup',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Automatic',
						value: 'automatic',
						description: 'The node registers and clears the webhook URL in bot settings via PUT /bots/:botId. Requires a personal token with the bots:write scope and editor access to the target bot. Not yet supported for bot tokens (backend limitation).',
					},
					{
						name: 'Manual',
						value: 'manual',
						description: 'Copy the Production URL from this node and paste it into bot settings in Pachca yourself. Works with any token type, including bot tokens.',
					},
				],
				default: 'manual',
				description: 'How the webhook URL gets registered in Pachca bot settings',
			},
			{
				displayName: 'Bot ID',
				name: 'botId',
				type: 'number',
				default: 0,
				description: 'ID of the bot whose webhook URL should be registered. Required in Automatic mode — n8n cannot infer this from a personal token. Find it in Pachca bot settings.',
				displayOptions: {
					show: {
						webhookSetup: ['automatic'],
					},
				},
			},
			{
				displayName:
					'Automatic mode is currently supported only for <b>personal tokens</b> with the <code>bots:write</code> scope and editor access to the target bot. Bot tokens cannot yet update their own webhook URL — this is in active development on the Pachca backend side. Use Manual mode or the <b>Pachca → Bot → Update</b> node as a workaround for bot tokens.',
				name: 'automaticSetupNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						webhookSetup: ['automatic'],
					},
				},
			},
			{
				displayName:
					'Copy the <b>Production URL</b> above and paste it into bot settings in Pachca (Outgoing Webhook tab → Webhook URL). Then activate the workflow. In manual mode n8n does not touch the bot webhook slot.',
				name: 'manualSetupNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						webhookSetup: ['manual'],
					},
				},
			},
		],
		usableAsTool: true,
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const setupMode = (this.getNodeParameter('webhookSetup', 'manual') as string) || 'manual';
				if (setupMode === 'manual') {
					// Manual mode: n8n does not manage the bot webhook slot at all.
					// The user copies the Production URL into bot settings themselves.
					return true;
				}
				const webhookData = this.getWorkflowStaticData('node');
				const webhookUrl = this.getNodeWebhookUrl('default');
				const stored = webhookData.webhookUrl as string | undefined;

				// Already registered this exact URL → nothing to do
				if (stored && stored === webhookUrl) {
					return true;
				}

				// Protection: if we already registered a production URL and the caller now
				// asks for a test URL, this is "Listen for test event" on an active workflow.
				// Pachca bots have a single outgoing_url slot, so auto-register would silently
				// overwrite production. Hard-fail with a clear message.
				if (
					stored &&
					webhookUrl?.includes('/webhook-test/') &&
					!stored.includes('/webhook-test/')
				) {
					throw new NodeOperationError(
						this.getNode(),
						'Cannot listen for test events while the workflow is active — Pachca bots support only one webhook URL per bot, and a test run would overwrite the production webhook.',
						{
							description:
								'Deactivate the workflow before testing, or use a separate bot dedicated to testing.',
						},
					);
				}

				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const setupMode = (this.getNodeParameter('webhookSetup', 'manual') as string) || 'manual';
				if (setupMode === 'manual') {
					this.logger.info(
						'Pachca Trigger: manual webhook setup mode — n8n will not register the URL. Make sure the Production URL is pasted into Pachca bot settings (Outgoing Webhook tab → Webhook URL).',
					);
					return true;
				}

				const credentials = await this.getCredentials('pachcaApi');

				// Best-effort token type detection via GET /profile. Bot tokens currently
				// cannot update their own webhook URL (backend limitation, in development),
				// so we surface a clear error early when we can prove it is a bot token.
				// If /profile is unavailable (missing scope, network, 5xx), we fall back
				// to the personal-token path — PUT /bots/{id} will still reject bot tokens
				// with 403 and the caller gets a helpful error from the block below.
				let isBotToken = false;
				try {
					const profile = await getTokenProfile(this, credentials);
					isBotToken = profile.bot;
				} catch (error) {
					const message = error instanceof Error ? error.message : String(error);
					this.logger.warn(
						`Pachca Trigger: could not determine token type via GET /profile (${message}). Proceeding as personal token — PUT /bots/{id} will return 403 if this is actually a bot token.`,
					);
				}
				if (isBotToken) {
					throw new NodeOperationError(
						this.getNode(),
						'Automatic webhook registration is not yet supported for bot tokens. Pachca API currently does not allow a bot to update its own webhook URL — this is in active development on the backend side.',
						{
							description:
								'Workaround: switch Webhook Setup to Manual and paste the Production URL into Pachca bot settings (Outgoing Webhook tab → Webhook URL). Alternatively, use a personal token (with the bots:write scope and editor access to the target bot).',
						},
					);
				}

				// Personal token path — user must specify Bot ID explicitly; n8n cannot
				// infer which bot the user wants to manage from a personal token alone.
				const botId = Number(this.getNodeParameter('botId', 0));
				if (!botId || botId <= 0) {
					throw new NodeOperationError(
						this.getNode(),
						'Bot ID is required for automatic webhook registration with a personal token.',
						{
							description:
								'Enter the Bot ID of the bot whose webhook URL should be registered. The personal token must have the bots:write scope and editor access to this bot in Pachca settings.',
						},
					);
				}

				const webhookUrl = this.getNodeWebhookUrl('default');
				try {
					await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', {
						method: 'PUT',
						url: `${credentials.baseUrl}/bots/${botId}`,
						body: { bot: { webhook: { outgoing_url: webhookUrl } } },
					});
				} catch (error) {
					const err = error as { httpCode?: number | string; statusCode?: number | string };
					const status = Number(err.httpCode ?? err.statusCode);
					if (status === 403) {
						throw new NodeOperationError(
							this.getNode(),
							'Pachca rejected automatic webhook registration (403 Forbidden).',
							{
								description:
									'The personal token needs both the bots:write scope AND editor access to this bot in Pachca settings. Check the bot access list in Pachca, or switch to Manual mode.',
							},
						);
					}
					throw error;
				}
				const webhookData = this.getWorkflowStaticData('node');
				webhookData.webhookUrl = webhookUrl;
				webhookData.botId = botId;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const registeredBotId = webhookData.botId as number | undefined;
				if (!registeredBotId) {
					// Nothing was registered by us (manual mode or never activated) — no cleanup
					return true;
				}
				const credentials = await this.getCredentials('pachcaApi');
				try {
					await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', {
						method: 'PUT',
						url: `${credentials.baseUrl}/bots/${registeredBotId}`,
						body: { bot: { webhook: { outgoing_url: '' } } },
					});
				} catch {
					// Ignore cleanup errors — webhook may already be gone, or scope revoked.
				}
				delete webhookData.webhookUrl;
				delete webhookData.botId;
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
			if (ageMs < -60_000 || ageMs > 5 * 60 * 1000) {
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
