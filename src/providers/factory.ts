import { LLMProvider, GenericMessage } from './base'
import { OpenAIProvider } from './openai'
import { AnthropicProvider } from './anthropic'

// provider cache for efficiency
const providerCache = new Map<string, LLMProvider>()

// detect which provider to use based on model name
function detectProviderType(model: string): 'openai' | 'anthropic' {
	if (model.startsWith('claude-')) {
		return 'anthropic'
	} else if (model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('o3')) {
		return 'openai'
	}

	// Default to OpenAI for backward compatibility
	return 'openai'
}

export function createProvider(model?: string): LLMProvider {
	const providerType = model ? detectProviderType(model) : 'openai'

	// Return cached provider if available
	if (providerCache.has(providerType)) {
		return providerCache.get(providerType)!
	}

	// Create new provider
	let provider: LLMProvider

	try {
		switch (providerType) {
			case 'anthropic':
				provider = new AnthropicProvider()
				break
			case 'openai':
			default:
				provider = new OpenAIProvider()
				break
		}

		// Cache the provider
		providerCache.set(providerType, provider)
		return provider
	} catch (error) {
		// If provider creation fails (e.g., missing SDK), fall back to available provider
		const errorMessage = error instanceof Error ? error.message : String(error)
		console.warn(`Failed to create ${providerType} provider: ${errorMessage}`)

		// Try the other provider as fallback
		const fallbackType = providerType === 'openai' ? 'anthropic' : 'openai'

		if (providerCache.has(fallbackType)) {
			console.warn(`Falling back to ${fallbackType} provider`)
			return providerCache.get(fallbackType)!
		}

		// Try to create fallback provider
		try {
			const fallbackProvider = fallbackType === 'anthropic' ? new AnthropicProvider() : new OpenAIProvider()
			providerCache.set(fallbackType, fallbackProvider)
			console.warn(`Falling back to ${fallbackType} provider`)
			return fallbackProvider
		} catch (fallbackError) {
			throw new Error(`No LLM providers available. Install either @anthropic-ai/sdk or openai: ${errorMessage}`)
		}
	}
}

// wrapper function to maintain compatibility with existing gpt function
export async function generateWithProvider(
	messages: GenericMessage[],
	model: string,
	responseFormat: 'text' | 'json_object',
	reasoningEffort: 'low' | 'medium' | 'high',
): Promise<string> {
	const provider = createProvider(model)
	return provider.generate(messages, {
		model,
		responseFormat,
		reasoningEffort,
	})
}

// wrapper function for starting conversations with system prompts
export function startConversationWithProvider(systemPrompt: string, model: string): GenericMessage[] {
	const provider = createProvider(model)
	return provider.startConversation(systemPrompt, model)
}
