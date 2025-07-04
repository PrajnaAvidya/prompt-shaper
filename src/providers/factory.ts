import { LLMProvider, GenericMessage } from './base'
import { OpenAIProvider } from './openai'

// simple factory for now - will be expanded later for other providers
export function createProvider(): LLMProvider {
	// for now, default to openai
	// future: detect provider based on model name
	return new OpenAIProvider()
}

// wrapper function to maintain compatibility with existing gpt function
export async function generateWithProvider(
	messages: GenericMessage[],
	model: string,
	responseFormat: 'text' | 'json_object',
	reasoningEffort: 'low' | 'medium' | 'high',
): Promise<string> {
	const provider = createProvider()
	return provider.generate(messages, {
		model,
		responseFormat,
		reasoningEffort,
	})
}
