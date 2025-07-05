import { LLMProvider, GenericMessage } from './base'
import { OpenAIProvider } from './openai'
import { AnthropicProvider } from './anthropic'
import { GeminiProvider } from './gemini'

// provider cache for efficiency
const providerCache = new Map<string, LLMProvider>()

export function clearProviderCache(debug: boolean = false): void {
	if (debug) {
		console.log(`[DEBUG] Clearing provider cache. Current cache size: ${providerCache.size}`)
	}
	providerCache.clear()
}

// detect which provider to use based on model name
export function detectProviderType(model: string): 'openai' | 'anthropic' | 'gemini' {
	if (model.startsWith('claude-')) {
		return 'anthropic'
	} else if (model.startsWith('gemini-')) {
		return 'gemini'
	} else if (model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('o3')) {
		return 'openai'
	}

	// Default to OpenAI for backward compatibility
	return 'openai'
}

export function createProvider(model?: string, debug: boolean = false): LLMProvider {
	const providerType = model ? detectProviderType(model) : 'openai'

	// Return cached provider if available
	if (providerCache.has(providerType)) {
		return providerCache.get(providerType)!
	}

	if (debug) {
		console.log(`[DEBUG] Creating provider for model: ${model}, detected type: ${providerType}`)
	}

	// Create new provider
	let provider: LLMProvider

	try {
		switch (providerType) {
			case 'anthropic':
				provider = new AnthropicProvider()
				break
			case 'gemini':
				provider = new GeminiProvider()
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

		// Try fallback providers in order
		const fallbackTypes = (['openai', 'anthropic', 'gemini'] as const).filter(type => type !== providerType)

		for (const fallbackType of fallbackTypes) {
			if (providerCache.has(fallbackType)) {
				console.warn(`Falling back to ${fallbackType} provider`)
				return providerCache.get(fallbackType)!
			}

			// Try to create fallback provider
			try {
				let fallbackProvider: LLMProvider
				switch (fallbackType) {
					case 'anthropic':
						fallbackProvider = new AnthropicProvider()
						break
					case 'gemini':
						fallbackProvider = new GeminiProvider()
						break
					case 'openai':
					default:
						fallbackProvider = new OpenAIProvider()
						break
				}
				providerCache.set(fallbackType, fallbackProvider)
				console.warn(`Falling back to ${fallbackType} provider`)
				return fallbackProvider
			} catch (fallbackError) {
				// Continue to next fallback option
				continue
			}
		}

		throw new Error(`No LLM providers available. Install one of: @anthropic-ai/sdk, @google/genai, or openai: ${errorMessage}`)
	}
}

// wrapper function to maintain compatibility with existing gpt function
export async function generateWithProvider(
	messages: GenericMessage[],
	model: string,
	responseFormat: 'text' | 'json_object',
	reasoningEffort: 'low' | 'medium' | 'high',
	debug: boolean = false,
): Promise<string> {
	const provider = createProvider(model, debug)
	return provider.generate(messages, {
		model,
		responseFormat,
		reasoningEffort,
		debug,
	})
}

// wrapper function for starting conversations with system prompts
export function startConversationWithProvider(systemPrompt: string, model: string, debug: boolean = false): GenericMessage[] {
	const provider = createProvider(model, debug)
	return provider.startConversation(systemPrompt, model)
}
