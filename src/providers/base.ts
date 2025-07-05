// base provider interface for llm providers

export interface GenericMessage {
	role: 'user' | 'assistant' | 'system' | 'developer'
	content: string | GenericContent[]
}

export interface GenericContent {
	type: 'text' | 'image_url'
	text?: string
	image_url?: { url: string }
}

export interface ProviderOptions {
	model: string
	responseFormat: 'text' | 'json_object'
	reasoningEffort?: 'low' | 'medium' | 'high'
	debug?: boolean
}

export interface LLMProvider {
	// generate completion from messages
	generate(messages: GenericMessage[], options: ProviderOptions): Promise<string>

	// check if provider supports a specific feature
	supportsFeature(feature: 'reasoning_effort' | 'json_mode'): boolean

	// validate model name for this provider
	isValidModel(model: string): boolean

	// get required environment variable name for api key
	getApiKeyEnvVar(): string

	// start conversation with system prompt (provider-specific role handling)
	startConversation(systemPrompt: string, model: string): GenericMessage[]
}
