import { LLMProvider, GenericMessage, ProviderOptions } from './base'

// Dynamic import for optional dependency
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Anthropic: any = null
try {
	Anthropic = require('@anthropic-ai/sdk')
} catch (e) {
	// Anthropic SDK not installed
}

export class AnthropicProvider implements LLMProvider {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private client: any

	constructor() {
		if (!Anthropic) {
			throw new Error('Anthropic SDK not found. Install with: yarn add @anthropic-ai/sdk')
		}

		this.client = new Anthropic({
			apiKey: process.env[this.getApiKeyEnvVar()] || 'sk-placeholder',
		})
	}

	async generate(messages: GenericMessage[], options: ProviderOptions): Promise<string> {
		let response: string = ''

		try {
			// Convert generic messages to anthropic format
			const anthropicMessages = this.convertMessages(messages)

			const stream = await this.client.messages.create({
				model: options.model,
				max_tokens: 4096,
				messages: anthropicMessages.messages,
				system: anthropicMessages.system,
				stream: true,
			})

			for await (const event of stream) {
				if (event.type === 'content_block_delta' && event.delta?.text) {
					const content = event.delta.text
					response += content
					process.stdout.write(content)
				}
			}

			return response
		} catch (e) {
			console.error(e)
			return response
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private convertMessages(messages: GenericMessage[]): { messages: any[]; system?: string } {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const anthropicMessages: any[] = []
		let systemPrompt: string | undefined

		for (const msg of messages) {
			if (msg.role === 'system' || msg.role === 'developer') {
				// Anthropic uses system parameter separately
				systemPrompt = typeof msg.content === 'string' ? msg.content : msg.content[0]?.text || ''
			} else if (msg.role === 'user' || msg.role === 'assistant') {
				const content = Array.isArray(msg.content)
					? msg.content.map(c => {
							if (c.type === 'text') {
								return { type: 'text', text: c.text || '' }
							} else {
								// Convert image_url to Anthropic format
								return {
									type: 'image',
									source: {
										type: 'base64',
										media_type: 'image/jpeg', // Default, may need detection
										data: c.image_url?.url?.replace(/^data:image\/[^;]+;base64,/, '') || '',
									},
								}
							}
					  })
					: [{ type: 'text', text: msg.content }]

				anthropicMessages.push({
					role: msg.role,
					content,
				})
			}
		}

		return {
			messages: anthropicMessages,
			system: systemPrompt,
		}
	}

	supportsFeature(feature: 'reasoning_effort' | 'json_mode'): boolean {
		switch (feature) {
			case 'reasoning_effort':
				return false // Anthropic doesn't have reasoning effort parameter
			case 'json_mode':
				return false // Anthropic doesn't have structured output like OpenAI (yet)
			default:
				return false
		}
	}

	isValidModel(model: string): boolean {
		// Claude model names: claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022, etc.
		return model.startsWith('claude-')
	}

	getApiKeyEnvVar(): string {
		return 'ANTHROPIC_API_KEY'
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	startConversation(systemPrompt: string, model: string): GenericMessage[] {
		// Anthropic always uses system role for system prompts
		return [
			{
				role: 'system',
				content: systemPrompt,
			},
		]
	}
}
