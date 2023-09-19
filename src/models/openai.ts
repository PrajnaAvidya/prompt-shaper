import OpenAI from 'openai'
import { Generate } from '../types'
import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions'

const openai = new OpenAI();

export const gpt4: Generate = async(prompt: string): Promise<string> => {
	const messages: ChatCompletionMessageParam[] = [
		{
			// TODO configurable
			role: 'system',
			content: 'You are a helpful assistant',
		},
		{
			role: 'user',
			content: prompt,
		},
	]

	console.log("Sending request to OpenAI...")

	let response = ''

	try {
		const stream = await openai.chat.completions.create({
			messages,
			model: 'gpt-4',
			stream: true,
		});
		for await (const part of stream) {
			const content = part.choices[0]?.delta?.content || ''
			response += content
			process.stdout.write(content);
		}

		return response
	} catch (e) {
		console.log(e)
		return ""
	}
}
