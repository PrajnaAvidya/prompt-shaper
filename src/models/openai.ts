import OpenAI from 'openai'
import { ChatCompletionMessageParam, ChatCompletionReasoningEffort } from 'openai/resources/chat/completions/completions'
import { Generate, ResponseFormat, ReasoningEffort } from '../types'
import { GenericMessage } from '../providers/base'

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY || 'abc123',
})

export const gpt: Generate = async (
	messages: GenericMessage[],
	model: string,
	responseFormat: ResponseFormat,
	reasoningEffort: ReasoningEffort,
): Promise<string> => {
	let response: string = ''

	try {
		// convert generic messages to openai format
		const openaiMessages: ChatCompletionMessageParam[] = messages.map(msg => msg as any)

		const stream = await openai.chat.completions.create({
			messages: openaiMessages,
			model,
			stream: true,
			reasoning_effort: model.startsWith('o1') || model.startsWith('o3') ? (reasoningEffort as ChatCompletionReasoningEffort) : undefined,
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
