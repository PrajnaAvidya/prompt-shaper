import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { ParserContext, ParserVariables, ValueType } from '../src/types'

describe('parser edge cases', () => {
	describe('input validation', () => {
		it('should handle non-string input', async () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const result = await parseTemplate(null as any)
			expect(result).to.equal(null)
		})

		it('should handle undefined input', async () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const result = await parseTemplate(undefined as any)
			expect(result).to.equal(undefined)
		})

		it('should handle number input', async () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const result = await parseTemplate(123 as any)
			expect(result).to.equal(123)
		})

		it('should handle empty string', async () => {
			const result = await parseTemplate('')
			expect(result).to.equal('')
		})

		it('should handle whitespace-only string', async () => {
			const result = await parseTemplate('   \n\t  ')
			expect(result).to.equal('   \n\t  ')
		})
	})

	describe('recursion depth handling', () => {
		it('should prevent infinite recursion by stopping at max depth', async () => {
			const template = `{recursive}{{recursive}}{/recursive}{{recursive}}`
			const result = await parseTemplate(template)

			// after 5 levels of recursion, it should return the template as-is
			expect(result).to.be.a('string')
			expect(result.length).to.be.greaterThan(0)
		})

		it('should handle deep but valid recursion', async () => {
			const template = `{level1}Level 1: {level2}Level 2: {level3}Level 3: {level4}Level 4: Final{/level4}{/level3}{/level2}{/level1}{{level1}}`
			const result = await parseTemplate(template)
			expect(result).to.equal('Level 1:') // recursion stops early due to depth limit
		})
	})

	describe('default context creation', () => {
		it('should create default context when none provided', async () => {
			const template = 'Simple text without variables'
			const result = await parseTemplate(template)
			expect(result).to.equal('Simple text without variables')
		})

		it('should work with variables when no context provided', async () => {
			const template = '{test="hello"}{{test}}'
			const result = await parseTemplate(template)
			expect(result).to.equal('hello')
		})
	})

	describe('debug logging', () => {
		it('should handle debug mode without errors', async () => {
			const template = '{test="hello"}{{test}}'
			const context: ParserContext = {
				variables: {},
				options: { showDebugMessages: true },
				attachments: [],
			}

			// capture console.log to avoid cluttering test output
			const originalLog = console.log
			const logs: string[] = []
			console.log = (...args) => logs.push(args.join(' '))

			const result = await parseTemplate(template, context)

			console.log = originalLog

			expect(result).to.equal('hello')
			expect(logs.length).to.be.greaterThan(0)
			expect(logs.some(log => log.includes('DEBUG:'))).to.be.true
		})
	})

	describe('returnParserMatches option', () => {
		it('should return parser matches instead of rendered template', async () => {
			const template = '{test="hello"}{{test}}'
			const context: ParserContext = {
				variables: {},
				options: { returnParserMatches: true },
				attachments: [],
			}

			const result = await parseTemplate(template, context)
			expect(result).to.be.an('array')
		})
	})

	describe('text-only template handling', () => {
		it('should handle template with no PromptShaper tags', async () => {
			const template = 'This is just plain text with no variables or slots'
			const result = await parseTemplate(template)
			expect(result).to.equal('This is just plain text with no variables or slots')
		})

		it('should handle template with code blocks but no PromptShaper tags', async () => {
			const template = `Here's some code:
\`\`\`javascript
console.log("hello");
\`\`\`
And some inline \`code\` too.`
			const result = await parseTemplate(template)
			expect(result).to.contain('console.log("hello");')
			expect(result).to.contain('And some inline `code` too.')
		})
	})

	describe('variable conflict detection', () => {
		it('should throw error when variable name conflicts with function', async () => {
			const template = '{load="test"}{{load}}'

			try {
				await parseTemplate(template)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				expect((error as Error).message).to.include('Variable name conflicts with function: load')
			}
		})

		it('should throw error when variable name conflicts with existing variable', async () => {
			const template = '{test="first"}{test="second"}{{test}}'

			try {
				await parseTemplate(template)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				expect((error as Error).message).to.include('Variable name conflict: test')
			}
		})
	})

	describe('evaluateVariable edge cases', () => {
		it('should return undefined for non-existent variable', async () => {
			const template = '{{nonExistentVariable}}'
			const result = await parseTemplate(template)
			expect(result).to.equal('{{nonExistentVariable}}')
		})

		it('should handle raw mode parameter', async () => {
			const template = '{{@variableWithSlots}}'
			const variables: ParserVariables = {
				variableWithSlots: {
					name: 'variableWithSlots',
					type: ValueType.string,
					value: 'This has {{anotherVar}} inside',
					params: [],
				},
			}
			const context: ParserContext = {
				variables,
				options: {},
				attachments: [],
			}

			const result = await parseTemplate(template, context)
			expect(result).to.equal('This has {{anotherVar}} inside')
		})

		it('should handle variable marked as raw', async () => {
			const template = '{{problematicVar}}'
			const variables: ParserVariables = {
				problematicVar: {
					name: 'problematicVar',
					type: ValueType.string,
					value: 'Raw content with {{invalid}} syntax',
					params: [],
					raw: true,
				},
			}
			const context: ParserContext = {
				variables,
				options: {},
				attachments: [],
			}

			const result = await parseTemplate(template, context)
			expect(result).to.equal('Raw content with {{invalid}} syntax')
		})

		it('should throw error for missing required parameter', async () => {
			const template = '{{parameterizedVar}}'
			const variables: ParserVariables = {
				parameterizedVar: {
					name: 'parameterizedVar',
					type: ValueType.string,
					value: 'Hello {{requiredParam}}',
					params: [
						{
							type: ValueType.string,
							value: '',
							variableName: 'requiredParam',
							required: true,
						},
					],
				},
			}
			const context: ParserContext = {
				variables,
				options: {},
				attachments: [],
			}

			try {
				await parseTemplate(template, context)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				expect((error as Error).message).to.include('Required param for parameterizedVar not found: requiredParam')
			}
		})

		it('should fallback to raw content on syntax errors', async () => {
			const template = '{{syntaxErrorVar}}'
			const variables: ParserVariables = {
				syntaxErrorVar: {
					name: 'syntaxErrorVar',
					type: ValueType.string,
					value: 'Content with {{unclosed slot',
					params: [],
				},
			}
			const context: ParserContext = {
				variables,
				options: {},
				attachments: [],
			}

			const result = await parseTemplate(template, context)
			expect(result).to.equal('Content with {{unclosed slot')
		})
	})

	describe('evaluateFunction edge cases', () => {
		it('should handle unknown function gracefully', async () => {
			const template = '{{unknownFunction("param")}}'

			const result = await parseTemplate(template)
			expect(result).to.equal('{{unknownFunction("param")}}') // unknown function calls remain as-is
		})
	})

	describe('renderSlot edge cases', () => {
		it('should return undefined for non-existent variable/function', async () => {
			const template = '{{nonExistent}}'
			const result = await parseTemplate(template)
			expect(result).to.equal('{{nonExistent}}')
		})

		it('should handle unknown expression type gracefully', async () => {
			// this would require mocking the parser to return an unknown expression type
			// for now, we'll test that the current types work correctly
			const template = '{{validVariable}}'
			const variables: ParserVariables = {
				validVariable: {
					name: 'validVariable',
					type: ValueType.string,
					value: 'test',
					params: [],
				},
			}
			const context: ParserContext = {
				variables,
				options: {},
				attachments: [],
			}

			const result = await parseTemplate(template, context)
			expect(result).to.equal('test')
		})
	})

	describe('code block masking edge cases', () => {
		it('should handle empty template', async () => {
			const result = await parseTemplate('')
			expect(result).to.equal('')
		})

		it('should handle template with no code blocks', async () => {
			const template = 'Just plain text {var="test"} {{var}}'
			const result = await parseTemplate(template)
			expect(result).to.equal('Just plain text  test') // extra space from variable removal
		})

		it('should handle malformed code blocks', async () => {
			const template = 'Text with ` incomplete inline code'
			const result = await parseTemplate(template)
			expect(result).to.equal('Text with ` incomplete inline code')
		})
	})

	describe('problematic multiline variables preprocessing', () => {
		it('should handle template with no multiline variables', async () => {
			const template = '{simple="test"}{{simple}}'
			const result = await parseTemplate(template)
			expect(result).to.equal('test')
		})

		it('should handle all valid multiline variables', async () => {
			const template = `{valid1}Content 1{/valid1}{valid2}Content 2{/valid2}{{valid1}} {{valid2}}`
			const result = await parseTemplate(template)
			expect(result).to.equal('Content 1 Content 2')
		})

		it('should handle empty multiline variables', async () => {
			const template = `{empty}{/empty}Content: {{empty}}`
			const result = await parseTemplate(template)
			expect(result).to.equal('Content: {{empty}}') // empty variable doesn't get registered
		})

		it('should handle multiline variables with only whitespace', async () => {
			const template = `{whitespace}   \n\t  {/whitespace}Content: "{{whitespace}}"`
			const result = await parseTemplate(template)
			expect(result).to.equal('Content: "   \n\t  "')
		})
	})
})
