import OpenAI from 'openai'
import { ChatCompletionMessageParam, ChatCompletionReasoningEffort } from 'openai/resources/chat/completions/completions'
import { Generate, ResponseFormat } from '../types'

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY || 'abc123',
})

export const gpt: Generate = async (
	messages: ChatCompletionMessageParam[],
	model: string,
	responseFormat: ResponseFormat,
	reasoningEffort: ChatCompletionReasoningEffort,
): Promise<string> => {
	let response: string = ''

	try {
		const stream = await openai.chat.completions.create({
			messages,
			model,
			stream: true,
			reasoning_effort: model.startsWith('o1') || model.startsWith('o3') ? reasoningEffort : undefined,
			response_format: { type: responseFormat },
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
