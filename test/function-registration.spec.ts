import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { registerFunction, unregisterFunction, functions } from '../src/functions'
import { ParserContext, ParserParam } from '../src/types'

describe('function registration', () => {
	// Clean up after each test
	afterEach(() => {
		// Remove any test functions we might have added
		const testFunctions = ['testFunction', 'anotherTest', 'existingFunction']
		testFunctions.forEach(name => {
			if (functions[name]) {
				delete functions[name]
			}
		})
	})

	describe('registerFunction', () => {
		it('should successfully register a new function', () => {
			const testFunc = (_context: ParserContext, param: ParserParam): string => {
				return `Test result: ${param.value}`
			}

			registerFunction('testFunction', testFunc)
			expect(functions['testFunction']).to.equal(testFunc)
		})

		it('should throw error when registering function with existing name', () => {
			const firstFunc = () => 'first'
			const secondFunc = () => 'second'

			registerFunction('existingFunction', firstFunc)

			expect(() => {
				registerFunction('existingFunction', secondFunc)
			}).to.throw('Function existingFunction is already registered.')
		})

		it('should allow registered function to be called in templates', async () => {
			const testFunc = (_context: ParserContext, param: ParserParam): string => {
				return `Hello ${param.value}!`
			}

			registerFunction('greet', testFunc)

			const template = '{{greet("World")}}'
			const result = await parseTemplate(template)
			expect(result).to.equal('Hello World!')

			// Clean up
			unregisterFunction('greet')
		})

		it('should handle async functions', async () => {
			const asyncFunc = async (_context: ParserContext, param: ParserParam): Promise<string> => {
				return new Promise(resolve => {
					setTimeout(() => resolve(`Async: ${param.value}`), 10)
				})
			}

			registerFunction('asyncTest', asyncFunc)

			const template = '{{asyncTest("test")}}'
			const result = await parseTemplate(template)
			expect(result).to.equal('Async: test')

			// Clean up
			unregisterFunction('asyncTest')
		})
	})

	describe('unregisterFunction', () => {
		it('should successfully unregister an existing function', () => {
			const testFunc = () => 'test'
			registerFunction('tempFunction', testFunc)

			expect(functions['tempFunction']).to.exist
			unregisterFunction('tempFunction')
			expect(functions['tempFunction']).to.be.undefined
		})

		it('should handle unregistering non-existent function gracefully', () => {
			expect(() => {
				unregisterFunction('nonExistentFunction')
			}).to.not.throw()
		})

		it('should prevent unregistered function from being called', async () => {
			const testFunc = () => 'test'
			registerFunction('tempFunction', testFunc)
			unregisterFunction('tempFunction')

			const template = '{{tempFunction()}}'
			const result = await parseTemplate(template)
			
			// Unregistered function call should remain as-is (undefined slot)
			expect(result).to.equal('{{tempFunction()}}')
		})
	})

	describe('function parameter handling', () => {
		it('should handle functions with multiple parameters', async () => {
			const multiParamFunc = (_context: ParserContext, ...params: ParserParam[]): string => {
				return params.map(p => p.value).join(' ')
			}

			registerFunction('concat', multiParamFunc)

			const template = '{{concat("Hello", "World", "Test")}}'
			const result = await parseTemplate(template)
			expect(result).to.equal('Hello World Test')

			unregisterFunction('concat')
		})

		it('should handle functions with no parameters', async () => {
			const noParamFunc = (): string => {
				return 'No params needed'
			}

			registerFunction('noParams', noParamFunc)

			const template = '{{noParams()}}'
			const result = await parseTemplate(template)
			expect(result).to.equal('No params needed')

			unregisterFunction('noParams')
		})

		it('should handle functions that access context', async () => {
			const contextFunc = (context: ParserContext): string => {
				return `Variables: ${Object.keys(context.variables).length}, Attachments: ${context.attachments.length}`
			}

			registerFunction('contextInfo', contextFunc)

			const template = '{test="value"}{{contextInfo()}}'
			const result = await parseTemplate(template)
			expect(result).to.equal('Variables: 1, Attachments: 0')

			unregisterFunction('contextInfo')
		})
	})
})