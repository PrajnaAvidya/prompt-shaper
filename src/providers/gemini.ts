import { LLMProvider, GenericMessage, ProviderOptions } from './base'

// Dynamic import for optional dependency
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let GoogleGenAI: any = null
try {
	GoogleGenAI = require('@google/genai')
} catch (e) {
	// Google GenAI SDK not installed
}

export class GeminiProvider implements LLMProvider {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private client: any

	constructor() {
		if (!GoogleGenAI) {
			throw new Error('Google GenAI SDK not found. Install with: yarn add @google/genai')
		}

		this.client = new GoogleGenAI.GoogleGenAI({
			apiKey: process.env[this.getApiKeyEnvVar()] || 'placeholder-key',
		})
	}

	async generate(messages: GenericMessage[], options: ProviderOptions): Promise<string> {
		let response: string = ''

		try {
			// Convert generic messages to Gemini format
			const geminiRequest = this.convertMessages(messages, options.model)

			const streamResponse = await this.client.models.generateContentStream(geminiRequest)

			for await (const chunk of streamResponse) {
				if (chunk.text) {
					const content = chunk.text
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
	private convertMessages(messages: GenericMessage[], model: string): any {
		// Gemini uses a different format - combine all messages into contents
		let systemPrompt = ''
		const conversationParts: string[] = []

		for (const msg of messages) {
			if (msg.role === 'system' || msg.role === 'developer') {
				// System prompts are handled as part of the conversation in Gemini
				systemPrompt = typeof msg.content === 'string' ? msg.content : msg.content[0]?.text || ''
			} else if (msg.role === 'user') {
				const content = Array.isArray(msg.content) ? msg.content.map(c => c.text || '').join('') : msg.content
				conversationParts.push(`User: ${content}`)
			} else if (msg.role === 'assistant') {
				const content = Array.isArray(msg.content) ? msg.content.map(c => c.text || '').join('') : msg.content
				conversationParts.push(`Assistant: ${content}`)
			}
		}

		// Combine system prompt with conversation
		let finalPrompt = ''
		if (systemPrompt) {
			finalPrompt = systemPrompt + '\n\n'
		}
		finalPrompt += conversationParts.join('\n')

		return {
			model,
			contents: finalPrompt,
		}
	}

	supportsFeature(feature: 'reasoning_effort' | 'json_mode'): boolean {
		switch (feature) {
			case 'reasoning_effort':
				return false // Gemini doesn't have reasoning effort parameter
			case 'json_mode':
				return true // Gemini supports structured output
			default:
				return false
		}
	}

	isValidModel(model: string): boolean {
		// Gemini model names: gemini-2.0-flash-001, gemini-pro, etc.
		return model.startsWith('gemini-')
	}

	getApiKeyEnvVar(): string {
		return 'GEMINI_API_KEY'
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	startConversation(systemPrompt: string, model: string): GenericMessage[] {
		// Gemini uses system prompts as regular conversation context
		return [
			{
				role: 'system',
				content: systemPrompt,
			},
		]
	}
}
