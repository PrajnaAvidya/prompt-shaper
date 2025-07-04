import { LLMProvider, GenericMessage } from './base'
import { OpenAIProvider } from './openai'

// singleton provider instance for efficiency
let providerInstance: LLMProvider | null = null

// simple factory for now - will be expanded later for other providers
export function createProvider(): LLMProvider {
	// for now, default to openai
	// future: detect provider based on model name
	if (!providerInstance) {
		providerInstance = new OpenAIProvider()
	}
	return providerInstance
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

// wrapper function for starting conversations with system prompts
export function startConversationWithProvider(systemPrompt: string, model: string): GenericMessage[] {
	const provider = createProvider()
	return provider.startConversation(systemPrompt, model)
}
