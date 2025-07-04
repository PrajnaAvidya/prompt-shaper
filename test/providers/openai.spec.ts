import { expect } from 'chai'
import { OpenAIProvider } from '../../src/providers/openai'

describe('OpenAIProvider', () => {
	let provider: OpenAIProvider

	beforeEach(() => {
		provider = new OpenAIProvider()
	})

	describe('startConversation', () => {
		it('should use a developer role if model starts with "o1" or "o3"', () => {
			const conversation1 = provider.startConversation('systemPromptText', 'o1-model')
			expect(conversation1).to.deep.equal([
				{
					role: 'developer',
					content: [
						{
							type: 'text',
							text: 'systemPromptText',
						},
					],
				},
			])

			const conversation2 = provider.startConversation('systemPromptText', 'o3-model')
			expect(conversation2).to.deep.equal([
				{
					role: 'developer',
					content: [
						{
							type: 'text',
							text: 'systemPromptText',
						},
					],
				},
			])
		})

		it('should use a system role if model does not start with "o1" or "o3"', () => {
			const conversation = provider.startConversation('systemPromptText', 'gpt-4')
			expect(conversation).to.deep.equal([
				{
					role: 'system',
					content: 'systemPromptText',
				},
			])
		})
	})

	describe('supportsFeature', () => {
		it('should support reasoning_effort', () => {
			expect(provider.supportsFeature('reasoning_effort')).to.be.true
		})

		it('should support json_mode', () => {
			expect(provider.supportsFeature('json_mode')).to.be.true
		})
	})

	describe('isValidModel', () => {
		it('should validate gpt models', () => {
			expect(provider.isValidModel('gpt-4')).to.be.true
			expect(provider.isValidModel('gpt-3.5-turbo')).to.be.true
		})

		it('should validate o1 models', () => {
			expect(provider.isValidModel('o1-preview')).to.be.true
			expect(provider.isValidModel('o1-mini')).to.be.true
		})

		it('should validate o3 models', () => {
			expect(provider.isValidModel('o3-mini')).to.be.true
		})

		it('should reject invalid models', () => {
			expect(provider.isValidModel('claude-3')).to.be.false
			expect(provider.isValidModel('gemini-pro')).to.be.false
		})
	})

	describe('getApiKeyEnvVar', () => {
		it('should return correct environment variable name', () => {
			expect(provider.getApiKeyEnvVar()).to.equal('OPENAI_API_KEY')
		})
	})
})
