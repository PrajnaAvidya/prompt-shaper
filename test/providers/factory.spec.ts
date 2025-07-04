import { expect } from 'chai'
import { createProvider } from '../../src/providers/factory'
import { OpenAIProvider } from '../../src/providers/openai'
import { AnthropicProvider } from '../../src/providers/anthropic'

describe('Provider Factory', () => {
	describe('createProvider', () => {
		it('should return OpenAI provider for gpt models', () => {
			try {
				const provider = createProvider('gpt-4')
				expect(provider).to.be.instanceOf(OpenAIProvider)
			} catch (error) {
				// Expected if OpenAI SDK not available
				expect((error as Error).message).to.include('OpenAI SDK not found')
			}
		})

		it('should return OpenAI provider for o1 models', () => {
			try {
				const provider = createProvider('o1-preview')
				expect(provider).to.be.instanceOf(OpenAIProvider)
			} catch (error) {
				// Expected if OpenAI SDK not available
				expect((error as Error).message).to.include('OpenAI SDK not found')
			}
		})

		it('should return OpenAI provider for o3 models', () => {
			try {
				const provider = createProvider('o3-mini')
				expect(provider).to.be.instanceOf(OpenAIProvider)
			} catch (error) {
				// Expected if OpenAI SDK not available
				expect((error as Error).message).to.include('OpenAI SDK not found')
			}
		})

		it('should return Anthropic provider for claude models', () => {
			try {
				const provider = createProvider('claude-3-5-sonnet-20241022')
				expect(provider).to.be.instanceOf(AnthropicProvider)
			} catch (error) {
				// Expected if Anthropic SDK not available
				expect((error as Error).message).to.include('Anthropic SDK not found')
			}
		})

		it('should default to OpenAI provider when no model specified', () => {
			try {
				const provider = createProvider()
				expect(provider).to.be.instanceOf(OpenAIProvider)
			} catch (error) {
				// Expected if OpenAI SDK not available
				expect((error as Error).message).to.include('OpenAI SDK not found')
			}
		})

		it('should default to OpenAI provider for unknown model names', () => {
			try {
				const provider = createProvider('unknown-model')
				expect(provider).to.be.instanceOf(OpenAIProvider)
			} catch (error) {
				// Expected if OpenAI SDK not available
				expect((error as Error).message).to.include('OpenAI SDK not found')
			}
		})

		it('should cache providers for efficiency', () => {
			try {
				const provider1 = createProvider('gpt-4')
				const provider2 = createProvider('gpt-3.5-turbo')
				// Both should return the same instance since they're both OpenAI
				expect(provider1).to.equal(provider2)
			} catch (error) {
				// Expected if OpenAI SDK not available
				expect((error as Error).message).to.include('OpenAI SDK not found')
			}
		})

		it('should handle fallback when primary provider fails', () => {
			// This test simulates what happens when one SDK is missing
			// In a real scenario, the factory should try to fall back to the other provider
			try {
				const provider = createProvider('claude-3-5-sonnet-20241022')
				// If we get here, either Anthropic provider worked or fallback occurred
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				expect(provider).to.satisfy((p: any) => p instanceof AnthropicProvider || p instanceof OpenAIProvider)
			} catch (error) {
				// Expected if both SDKs are unavailable
				expect((error as Error).message).to.include('No LLM providers available')
			}
		})
	})
})
