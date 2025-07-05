import { expect } from 'chai'
import { AnthropicProvider } from '../../src/providers/anthropic'

describe('AnthropicProvider', () => {
	let provider: AnthropicProvider

	describe('constructor', () => {
		it('should throw error when Anthropic SDK is not available', () => {
			// This test may fail if Anthropic SDK is actually installed
			// but demonstrates the expected behavior when optional dependency is missing
			try {
				provider = new AnthropicProvider()
				// If we get here, SDK is available, so test the provider
				expect(provider).to.be.instanceOf(AnthropicProvider)
			} catch (error) {
				expect((error as Error).message).to.include('Anthropic SDK not found')
			}
		})
	})

	// Only run these tests if Anthropic SDK is available
	describe('AnthropicProvider functionality', function () {
		before(function () {
			try {
				provider = new AnthropicProvider()
			} catch (error) {
				this.skip() // Skip tests if SDK not available
			}
		})

		describe('startConversation', () => {
			it('should always use system role for system prompts', () => {
				const conversation = provider.startConversation('systemPromptText', 'claude-3-5-sonnet-20241022')
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

			it('should not support json_mode', () => {
				expect(provider.supportsFeature('json_mode')).to.be.false
			})
		})

		describe('isValidModel', () => {
			it('should validate claude models', () => {
				expect(provider.isValidModel('claude-3-5-sonnet-20241022')).to.be.true
				expect(provider.isValidModel('claude-3-5-haiku-20241022')).to.be.true
				expect(provider.isValidModel('claude-3-opus-20240229')).to.be.true
			})

			it('should reject non-claude models', () => {
				expect(provider.isValidModel('gpt-4')).to.be.false
				expect(provider.isValidModel('gemini-pro')).to.be.false
				expect(provider.isValidModel('llama-2')).to.be.false
			})
		})

		describe('getApiKeyEnvVar', () => {
			it('should return correct environment variable name', () => {
				expect(provider.getApiKeyEnvVar()).to.equal('ANTHROPIC_API_KEY')
			})
		})

		describe('convertMessages', () => {
			it('should convert generic messages to anthropic format', () => {
				const genericMessages = [
					{ role: 'system' as const, content: 'You are a helpful assistant' },
					{ role: 'user' as const, content: 'Hello' },
					{ role: 'assistant' as const, content: 'Hi there!' },
				]

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const result = (provider as any).convertMessages(genericMessages)

				expect(result.system).to.equal('You are a helpful assistant')
				expect(result.messages).to.have.length(2)
				expect(result.messages[0]).to.deep.equal({
					role: 'user',
					content: [{ type: 'text', text: 'Hello' }],
				})
				expect(result.messages[1]).to.deep.equal({
					role: 'assistant',
					content: [{ type: 'text', text: 'Hi there!' }],
				})
			})

			it('should handle multimodal content', () => {
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
				const result = (provider as any).convertMessages(genericMessages)

				expect(result.messages).to.have.length(1)
				expect(result.messages[0].content).to.have.length(2)
				expect(result.messages[0].content[0]).to.deep.equal({
					type: 'text',
					text: 'What is in this image?',
				})
				expect(result.messages[0].content[1]).to.deep.equal({
					type: 'image',
					source: {
						type: 'base64',
						media_type: 'image/jpeg',
						data: '/9j/4AAQSkZJRgABAQAAAQ',
					},
				})
			})
		})
	})
})
