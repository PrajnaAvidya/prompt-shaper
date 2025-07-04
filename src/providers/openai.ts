import OpenAI from 'openai'
import { ChatCompletionMessageParam, ChatCompletionReasoningEffort } from 'openai/resources/chat/completions/completions'
import { LLMProvider, GenericMessage, ProviderOptions } from './base'

export class OpenAIProvider implements LLMProvider {
	private client: OpenAI

	constructor() {
		this.client = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY || 'abc123',
		})
	}

	async generate(messages: GenericMessage[], options: ProviderOptions): Promise<string> {
		let response: string = ''

		try {
			// convert generic messages to openai format
			const openaiMessages: ChatCompletionMessageParam[] = messages.map(msg => msg as any)

			const stream = await this.client.chat.completions.create({
				messages: openaiMessages,
				model: options.model,
				stream: true,
				reasoning_effort:
					this.supportsFeature('reasoning_effort') && options.reasoningEffort
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

	supportsFeature(feature: 'reasoning_effort' | 'json_mode' | 'developer_role'): boolean {
		switch (feature) {
			case 'reasoning_effort':
				return true // openai supports reasoning effort for o1/o3 models
			case 'json_mode':
				return true // openai supports json response format
			case 'developer_role':
				return true // openai supports developer role for o1/o3 models
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
}
