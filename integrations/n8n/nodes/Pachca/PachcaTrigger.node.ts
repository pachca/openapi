import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { verifyWebhookSignature, getTokenProfile, isInsufficientScopeError, sanitizeBaseUrl } from './GenericFunctions';

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
	'video_call_finished': { type: 'video_call', event: 'finished' },
	'video_call_recording_ready': { type: 'video_call', event: 'recording_ready' },
	'video_call_started': { type: 'video_call', event: 'started' },
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
					{ name: 'Video Call Finished', value: 'video_call_finished' },
					{ name: 'Video Call Recording Ready', value: 'video_call_recording_ready' },
					{ name: 'Video Call Started', value: 'video_call_started' },
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
						description: 'The node registers and clears this webhook URL in Pachca automatically. A bot token self-registers via PUT /bot/webhook (no Bot ID needed) and needs the profile:read and bot_self:webhook:write scopes. A personal token uses PUT /bots/:botId and needs the bots:write scope, editor access to the bot, and the Bot ID below.',
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
				description: 'ID of the bot whose webhook URL should be registered. Required only with a personal token — a bot token self-registers and ignores this field. Find it in Pachca bot settings.',
				displayOptions: {
					show: {
						webhookSetup: ['automatic'],
					},
				},
			},
			{
				displayName:
					'Automatic mode registers and clears this node\'s webhook URL in Pachca on activate/deactivate. With a <b>bot token</b> it self-registers — no Bot ID needed: the token needs the <code>profile:read</code> and <code>bot_self:webhook:write</code> scopes. With a <b>personal token</b> it needs the <code>bots:write</code> scope, editor access to the target bot, and the <b>Bot ID</b> below. The node sets only the URL: tick the events in bot settings in Pachca (Outgoing webhook tab), and for New Message choose <b>Any messages</b> or list commands.',
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
					'Copy the <b>Production URL</b> above and paste it into bot settings in Pachca (Outgoing webhook tab → Webhook URL). On the same tab tick the events this node listens for, and for New Message choose <b>Any messages</b> or list commands. Then activate the workflow. In manual mode n8n does not touch the bot webhook slot.',
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
						'Pachca Trigger: manual webhook setup mode — n8n will not register the URL. Make sure the Production URL is pasted into Pachca bot settings (Outgoing webhook tab → Webhook URL).',
					);
					return true;
				}

				const credentials = await this.getCredentials('pachcaApi');
				const base = sanitizeBaseUrl(credentials.baseUrl as string);
				const webhookUrl = this.getNodeWebhookUrl('default');
				const webhookData = this.getWorkflowStaticData('node');

				// Detect token type via GET /profile. A bot token self-registers its own
				// webhook (PUT /bot/webhook, no Bot ID); a personal token registers a chosen
				// bot by id (PUT /bots/:id). GET /profile needs the profile:read scope, and the
				// scopes of a bot token are chosen per token, so either token type may lack it.
				// With a Bot ID set the node goes on as a personal token; without one it stops
				// with the reason, since the Bot ID error would point the wrong way.
				const botId = Number(this.getNodeParameter('botId', 0));
				let isBotToken = false;
				let profileScopeMissing = false;
				try {
					const profile = await getTokenProfile(this, credentials);
					isBotToken = profile.bot;
				} catch (error) {
					profileScopeMissing = isInsufficientScopeError(error);
					if (!botId || botId <= 0) {
						if (profileScopeMissing) {
							throw new NodeOperationError(
								this.getNode(),
								'The token lacks the profile:read scope, so the node cannot tell a bot token from a personal one.',
								{
									description:
										'Automatic mode reads GET /profile to choose how to register the webhook URL. With a bot token, add the profile:read scope to this token in bot settings in Pachca (API tab) and activate the workflow again — the scopes of a bot token are chosen per token. With a personal token, fill in the Bot ID field of this node. Or switch Webhook Setup to Manual.',
								},
							);
						}
						throw error;
					}
					const message = error instanceof Error ? error.message : String(error);
					this.logger.warn(
						`Pachca Trigger: could not determine token type via GET /profile (${message}). Proceeding as personal token with Bot ID ${botId}.`,
					);
				}

				if (isBotToken) {
					// Bot token self-registers its own webhook — no Bot ID required.
					try {
						await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', {
							method: 'PUT',
							url: `${base}/bot/webhook`,
							body: { webhook: { outgoing_url: webhookUrl } },
						});
					} catch (error) {
						const err = error as { httpCode?: number | string; statusCode?: number | string };
						if (Number(err.httpCode ?? err.statusCode) === 403) {
							throw new NodeOperationError(
								this.getNode(),
								'Pachca rejected bot webhook self-registration (403 Forbidden).',
								{
									description:
										'The bot token needs the bot_self:webhook:write scope. Enable it for the bot in Pachca (bot settings → API tab), or switch to Manual mode.',
								},
							);
						}
						throw error;
					}
					webhookData.webhookUrl = webhookUrl;
					webhookData.mode = 'bot';
					return true;
				}

				// Personal token path — user must specify Bot ID explicitly; n8n cannot
				// infer which bot the user wants to manage from a personal token alone.
				if (!botId || botId <= 0) {
					throw new NodeOperationError(
						this.getNode(),
						'Bot ID is required for automatic webhook registration with a personal token.',
						{
							description:
								'Enter the Bot ID of the bot whose webhook URL should be registered. The personal token must have the bots:write scope and editor access to this bot. A bot token self-registers without a Bot ID.',
						},
					);
				}

				try {
					await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', {
						method: 'PUT',
						url: `${base}/bots/${botId}`,
						body: { webhook: { outgoing_url: webhookUrl } },
					});
				} catch (error) {
					const err = error as { httpCode?: number | string; statusCode?: number | string };
					if (Number(err.httpCode ?? err.statusCode) === 403) {
						throw new NodeOperationError(
							this.getNode(),
							'Pachca rejected automatic webhook registration (403 Forbidden).',
							{
								description:
									'The personal token needs both the bots:write scope AND editor access to this bot in Pachca settings. Check the bot access list in Pachca, or switch to Manual mode.' +
									(profileScopeMissing
										? ' If this is a bot token, add the profile:read scope to it in bot settings in Pachca (API tab) and clear Bot ID — the node then registers the bot\'s own webhook URL.'
										: ''),
							},
						);
					}
					throw error;
				}
				webhookData.webhookUrl = webhookUrl;
				webhookData.botId = botId;
				webhookData.mode = 'personal';
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				// Back-compat: registrations made before the `mode` field stored only botId (personal path).
				const mode = (webhookData.mode as string | undefined) ?? (webhookData.botId ? 'personal' : undefined);
				if (!mode) {
					// Nothing was registered by us (manual mode or never activated) — no cleanup
					return true;
				}
				const credentials = await this.getCredentials('pachcaApi');
				const base = sanitizeBaseUrl(credentials.baseUrl as string);
				try {
					if (mode === 'bot') {
						// Bot token clears its own webhook — empty outgoing_url disables it.
						await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', {
							method: 'PUT',
							url: `${base}/bot/webhook`,
							body: { webhook: { outgoing_url: '' } },
						});
					} else {
						const registeredBotId = webhookData.botId as number | undefined;
						if (registeredBotId) {
							await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', {
								method: 'PUT',
								url: `${base}/bots/${registeredBotId}`,
								body: { webhook: { outgoing_url: '' } },
							});
						}
					}
				} catch {
					// Ignore cleanup errors — webhook may already be gone, or scope revoked.
				}
				delete webhookData.webhookUrl;
				delete webhookData.botId;
				delete webhookData.mode;
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

		// Replay protection — reject events older than 5 minutes.
		// A missing/zero timestamp used to skip the window entirely. When a signing
		// secret is configured the field is required (the spec always sends it), so
		// treat its absence as a rejection rather than a free pass. Without a secret
		// there is no authentication anyway, so an absent field stays tolerated.
		const webhookTs = Number(body.webhook_timestamp);
		const hasWebhookTs = Number.isFinite(webhookTs) && webhookTs > 0;
		if (signingSecret && !hasWebhookTs) {
			return { webhookResponse: 'Rejected' };
		}
		if (hasWebhookTs) {
			const ageMs = Date.now() - webhookTs * 1000;
			if (ageMs < -60_000 || ageMs > 5 * 60 * 1000) {
				return { webhookResponse: 'Rejected' };
			}
		}

		// Event filtering using type+event from payload
		if (event !== '*') {
			const filter = EVENT_FILTER[event];
			if (!filter) {
				// Unknown event value (should not happen with noDataExpression: true) — reject
				return { webhookResponse: 'Event filtered' };
			}
			const bodyType = body.type as string | undefined;
			const bodyEvent = body.event as string | undefined;
			if (bodyType !== filter.type || bodyEvent !== filter.event) {
				return { webhookResponse: 'Event filtered' };
			}
		}

		return {
			workflowData: [this.helpers.returnJsonArray(body)],
		};
	}
}
