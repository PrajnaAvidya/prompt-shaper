import { expect } from 'chai'
import { GeminiProvider } from '../../src/providers/gemini'

describe('GeminiProvider', () => {
	let provider: GeminiProvider

	describe('constructor', () => {
		it('should throw error when Google GenAI SDK is not available', () => {
			// This test may fail if Google GenAI SDK is actually installed
			// but demonstrates the expected behavior when optional dependency is missing
			try {
				provider = new GeminiProvider()
				// If we get here, SDK is available, so test the provider
				expect(provider).to.be.instanceOf(GeminiProvider)
			} catch (error) {
				expect((error as Error).message).to.include('Google GenAI SDK not found')
			}
		})
	})

	// Only run these tests if Google GenAI SDK is available
	describe('GeminiProvider functionality', function () {
		before(function () {
			try {
				provider = new GeminiProvider()
			} catch (error) {
				this.skip() // Skip tests if SDK not available
			}
		})

		describe('startConversation', () => {
			it('should use system role for system prompts', () => {
				const conversation = provider.startConversation('systemPromptText', 'gemini-2.0-flash-001')
				expect(conversation).to.deep.equal([
					{
						role: 'system',
						content: 'systemPromptText',
					},
				])
			})
		})

		describe('supportsFeature', () => {
			it('should not support reasoning_effort', () => {
				expect(provider.supportsFeature('reasoning_effort')).to.be.false
			})

			it('should support json_mode', () => {
				expect(provider.supportsFeature('json_mode')).to.be.true
			})
		})

		describe('isValidModel', () => {
			it('should validate gemini models', () => {
				expect(provider.isValidModel('gemini-2.0-flash-001')).to.be.true
				expect(provider.isValidModel('gemini-pro')).to.be.true
				expect(provider.isValidModel('gemini-1.5-pro')).to.be.true
			})

			it('should reject non-gemini models', () => {
				expect(provider.isValidModel('gpt-4')).to.be.false
				expect(provider.isValidModel('claude-3-5-sonnet-20241022')).to.be.false
				expect(provider.isValidModel('llama-2')).to.be.false
			})
		})

		describe('getApiKeyEnvVar', () => {
			it('should return correct environment variable name', () => {
				expect(provider.getApiKeyEnvVar()).to.equal('GEMINI_API_KEY')
			})
		})

		describe('convertMessages', () => {
			it('should convert generic messages to gemini format', () => {
				const genericMessages = [
					{ role: 'system' as const, content: 'You are a helpful assistant' },
					{ role: 'user' as const, content: 'Hello' },
					{ role: 'assistant' as const, content: 'Hi there!' },
				]

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const result = (provider as any).convertMessages(genericMessages, 'gemini-2.0-flash-001')

				expect(result.model).to.equal('gemini-2.0-flash-001')
				expect(result.contents).to.include('You are a helpful assistant')
				expect(result.contents).to.include('User: Hello')
				expect(result.contents).to.include('Assistant: Hi there!')
			})

			it('should handle system prompts correctly', () => {
				const genericMessages = [
					{ role: 'system' as const, content: 'You are a code reviewer' },
					{ role: 'user' as const, content: 'Review this code' },
				]

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const result = (provider as any).convertMessages(genericMessages, 'gemini-pro')

				expect(result.contents).to.include('You are a code reviewer')
				expect(result.contents).to.include('User: Review this code')
			})

			it('should handle multimodal content by extracting text', () => {
				const genericMessages = [
					{
						role: 'user' as const,
						content: [
							{ type: 'text' as const, text: 'What is in this image?' },
							{ type: 'image_url' as const, image_url: { url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ' } },
						],
					},
				]

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const result = (provider as any).convertMessages(genericMessages, 'gemini-pro')

				expect(result.contents).to.include('User: What is in this image?')
				// Note: Current implementation extracts text only, images handled differently
			})

			it('should handle developer role as system prompt', () => {
				const genericMessages = [
					{ role: 'developer' as const, content: 'You are a debugging assistant' },
					{ role: 'user' as const, content: 'Help me debug this code' },
				]

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const result = (provider as any).convertMessages(genericMessages, 'gemini-pro')

				expect(result.contents).to.include('You are a debugging assistant')
				expect(result.contents).to.include('User: Help me debug this code')
			})
		})
	})
})
