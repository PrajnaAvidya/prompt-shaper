import { expect } from 'chai'
import { interactiveCommands } from '../src/cli'
import { GenericMessage } from '../src/providers/base'
import * as factoryModule from '../src/providers/factory'
import sinon from 'sinon'

describe('Interactive commands', function () {
	describe('/help command', function () {
		it('should exist and have correct description', () => {
			const helpCommand = interactiveCommands.find(cmd => cmd.name === 'help')
			expect(helpCommand).to.exist
			expect(helpCommand!.description).to.equal('Show this help message')
		})
	})

	describe('/exit command', function () {
		it('should exist and have correct description', () => {
			const exitCommand = interactiveCommands.find(cmd => cmd.name === 'exit')
			expect(exitCommand).to.exist
			expect(exitCommand!.description).to.equal('Exit interactive mode')
		})
	})

	describe('/rewind command', function () {
		it('should exist and have correct description', () => {
			const rewindCommand = interactiveCommands.find(cmd => cmd.name === 'rewind')
			expect(rewindCommand).to.exist
			expect(rewindCommand!.description).to.equal('Remove last user-assistant exchange')
		})

		it('should rewind last user-assistant exchange', () => {
			const rewindCommand = interactiveCommands.find(cmd => cmd.name === 'rewind')!

			const mockConversation: GenericMessage[] = [
				{ role: 'system', content: 'You are helpful.' },
				{ role: 'user', content: 'Hello' },
				{ role: 'assistant', content: 'Hi!' },
				{ role: 'user', content: 'How are you?' },
				{ role: 'assistant', content: 'Good!' },
			]
			const mockOptions = { model: 'gpt-4' } as any // eslint-disable-line @typescript-eslint/no-explicit-any

			const result = rewindCommand.handler(mockConversation, mockOptions, [])
			expect(result).to.be.true
			expect(mockConversation.length).to.equal(3) // system + first exchange
			expect(mockConversation[2].content).to.equal('Hi!')
		})

		it('should handle case when no exchange to rewind', () => {
			const rewindCommand = interactiveCommands.find(cmd => cmd.name === 'rewind')!

			const mockConversation: GenericMessage[] = [{ role: 'system', content: 'You are helpful.' }]
			const mockOptions = { model: 'gpt-4' } as any // eslint-disable-line @typescript-eslint/no-explicit-any

			const result = rewindCommand.handler(mockConversation, mockOptions, [])
			expect(result).to.be.true
			expect(mockConversation.length).to.equal(1) // unchanged
		})
	})

	describe('/clear command', function () {
		it('should exist and have correct description', () => {
			const clearCommand = interactiveCommands.find(cmd => cmd.name === 'clear')
			expect(clearCommand).to.exist
			expect(clearCommand!.description).to.equal('Clear conversation history and start fresh')
		})

		it('should clear conversation and preserve system message', () => {
			const clearCommand = interactiveCommands.find(cmd => cmd.name === 'clear')!

			const mockConversation: GenericMessage[] = [
				{ role: 'system', content: 'You are a helpful assistant.' },
				{ role: 'user', content: 'Hello' },
				{ role: 'assistant', content: 'Hi there!' },
				{ role: 'user', content: 'How are you?' },
				{ role: 'assistant', content: 'I am doing well!' },
			]
			const mockOptions = { model: 'gpt-4' } as any // eslint-disable-line @typescript-eslint/no-explicit-any

			const result = clearCommand.handler(mockConversation, mockOptions, [])
			expect(result).to.be.true

			// Should only have the system message left
			expect(mockConversation.length).to.equal(1)
			expect(mockConversation[0].role).to.equal('system')
			expect(mockConversation[0].content).to.equal('You are a helpful assistant.')
		})

		it('should clear conversation completely when no system message exists', () => {
			const clearCommand = interactiveCommands.find(cmd => cmd.name === 'clear')!

			const mockConversation: GenericMessage[] = [
				{ role: 'user', content: 'Hello' },
				{ role: 'assistant', content: 'Hi there!' },
			]
			const mockOptions = { model: 'gpt-4' } as any // eslint-disable-line @typescript-eslint/no-explicit-any

			const result = clearCommand.handler(mockConversation, mockOptions, [])
			expect(result).to.be.true

			// Should be completely empty
			expect(mockConversation.length).to.equal(0)
		})
	})

	describe('/model command', function () {
		it('should exist and have correct description', () => {
			const modelCommand = interactiveCommands.find(cmd => cmd.name === 'model')
			expect(modelCommand).to.exist
			expect(modelCommand!.description).to.equal('Switch to different model or show current model')
		})

		it('should show current model when no arguments provided', () => {
			const modelCommand = interactiveCommands.find(cmd => cmd.name === 'model')!

			const mockConversation: GenericMessage[] = []
			const mockOptions = { model: 'gpt-4' } as any // eslint-disable-line @typescript-eslint/no-explicit-any

			const result = modelCommand.handler(mockConversation, mockOptions, [])
			expect(result).to.be.true
		})

		it('should switch to new model when model name provided', () => {
			const modelCommand = interactiveCommands.find(cmd => cmd.name === 'model')!

			const mockConversation: GenericMessage[] = []
			const mockOptions = { model: 'gpt-4' } as any // eslint-disable-line @typescript-eslint/no-explicit-any

			const result = modelCommand.handler(mockConversation, mockOptions, ['claude-3-5-sonnet-20241022'])
			expect(result).to.be.true
			expect(mockOptions.model).to.equal('claude-3-5-sonnet-20241022')
		})

		it('should work with different provider models', () => {
			const modelCommand = interactiveCommands.find(cmd => cmd.name === 'model')!

			const mockConversation: GenericMessage[] = []
			const mockOptions = { model: 'gpt-4' } as any // eslint-disable-line @typescript-eslint/no-explicit-any

			// Test switching to Gemini model
			modelCommand.handler(mockConversation, mockOptions, ['gemini-pro'])
			expect(mockOptions.model).to.equal('gemini-pro')

			// Test switching to Anthropic model
			modelCommand.handler(mockConversation, mockOptions, ['claude-3-5-haiku-20241022'])
			expect(mockOptions.model).to.equal('claude-3-5-haiku-20241022')
		})

		it('should reject invalid model names', () => {
			const modelCommand = interactiveCommands.find(cmd => cmd.name === 'model')!

			const mockConversation: GenericMessage[] = []
			const mockOptions = { model: 'gpt-4' } as any // eslint-disable-line @typescript-eslint/no-explicit-any
			const originalModel = mockOptions.model

			const result = modelCommand.handler(mockConversation, mockOptions, ['invalid-model-name'])
			expect(result).to.be.true
			// Model should not have changed
			expect(mockOptions.model).to.equal(originalModel)
		})

		it('should clear provider cache when switching models', () => {
			const modelCommand = interactiveCommands.find(cmd => cmd.name === 'model')!
			const clearCacheSpy = sinon.spy(factoryModule, 'clearProviderCache')

			const mockConversation: GenericMessage[] = []
			const mockOptions = { model: 'gpt-4' } as any // eslint-disable-line @typescript-eslint/no-explicit-any

			const result = modelCommand.handler(mockConversation, mockOptions, ['claude-3-5-sonnet-20241022'])
			expect(result).to.be.true
			expect(clearCacheSpy.calledOnce).to.be.true

			clearCacheSpy.restore()
		})
	})
})
