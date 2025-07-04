import OpenAI from 'openai'
import {
	ChatCompletionMessageParam,
	ChatCompletionReasoningEffort,
	ChatCompletionUserMessageParam,
	ChatCompletionSystemMessageParam,
	ChatCompletionAssistantMessageParam,
	ChatCompletionDeveloperMessageParam,
} from 'openai/resources/chat/completions/completions'
import { LLMProvider, GenericMessage, ProviderOptions } from './base'

export class OpenAIProvider implements LLMProvider {
	private client: OpenAI

	constructor() {
		this.client = new OpenAI({
			apiKey: process.env[this.getApiKeyEnvVar()] || 'abc123',
		})
	}

	async generate(messages: GenericMessage[], options: ProviderOptions): Promise<string> {
		let response: string = ''

		try {
			// convert generic messages to openai format
			const openaiMessages: ChatCompletionMessageParam[] = messages.map(msg => {
				if (msg.role === 'developer') {
					const content = Array.isArray(msg.content) ? msg.content.map(c => ({ type: 'text' as const, text: c.text || '' })) : msg.content
					return {
						role: 'developer',
						content,
					} as ChatCompletionDeveloperMessageParam
				} else if (msg.role === 'system') {
					return {
						role: 'system',
						content: typeof msg.content === 'string' ? msg.content : msg.content[0]?.text || '',
					} as ChatCompletionSystemMessageParam
				} else if (msg.role === 'user') {
					const content = Array.isArray(msg.content)
						? msg.content.map(c => {
								if (c.type === 'text') {
									return { type: 'text' as const, text: c.text || '' }
								} else {
									return { type: 'image_url' as const, image_url: c.image_url || { url: '' } }
								}
						  })
						: msg.content
					return {
						role: 'user',
						content,
					} as ChatCompletionUserMessageParam
				} else {
					return {
						role: 'assistant',
						content: typeof msg.content === 'string' ? msg.content : msg.content[0]?.text || '',
					} as ChatCompletionAssistantMessageParam
				}
			})

			const stream = await this.client.chat.completions.create({
				messages: openaiMessages,
				model: options.model,
				stream: true,
				reasoning_effort:
					this.supportsFeature('reasoning_effort') && options.reasoningEffort && (options.model.startsWith('o1') || options.model.startsWith('o3'))
						? (options.reasoningEffort as ChatCompletionReasoningEffort)
						: undefined,
				response_format: { type: options.responseFormat },
			})

			for await (const part of stream) {
				const content = part.choices[0]?.delta?.content || ''
				response += content
				process.stdout.write(content)
			}

			return response
		} catch (e) {
			console.error(e)
			return response
		}
	}

	supportsFeature(feature: 'reasoning_effort' | 'json_mode'): boolean {
		switch (feature) {
			case 'reasoning_effort':
				return true // openai supports reasoning effort for o1/o3 models
			case 'json_mode':
				return true // openai supports json response format
			default:
				return false
		}
	}

	isValidModel(model: string): boolean {
		// basic validation - models that start with gpt, o1, o3
		return model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('o3')
	}

	getApiKeyEnvVar(): string {
		return 'OPENAI_API_KEY'
	}

	startConversation(systemPrompt: string, model: string): GenericMessage[] {
		const conversation: GenericMessage[] = []
		if (model.startsWith('o1') || model.startsWith('o3')) {
			// o1/o3 models require developer role instead of system role
			conversation.push({
				role: 'developer',
				content: [
					{
						type: 'text',
						text: systemPrompt,
					},
				],
			})
		} else {
			// standard models use system role
			conversation.push({
				role: 'system',
				content: systemPrompt,
			})
		}

		return conversation
	}
}
