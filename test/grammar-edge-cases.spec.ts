import { expect, assert } from 'chai'
import { parseTemplate } from '../src/parser'
import { ParserContext, ParserVariables, ValueType } from '../src/types'

describe('PEG grammar edge cases', () => {
	describe('malformed variable syntax', () => {
		it('should handle unclosed single-line variable', async () => {
			const template = '{unclosed = "test"'
			
			try {
				await parseTemplate(template)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				assert(error instanceof Error)
				expect((error as Error).message).to.include('Syntax error')
			}
		})

		it('should handle mismatched multiline variable tags', async () => {
			const template = '{start}content{/end}'
			
			try {
				await parseTemplate(template)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				assert(error instanceof Error)
				expect((error as Error).message).to.include('Mismatched variable tags: {start} ... {/end}')
			}
		})

		it('should handle unclosed multiline variable', async () => {
			const template = '{unclosed}content without closing tag'
			
			try {
				await parseTemplate(template)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				assert(error instanceof Error)
				expect((error as Error).message).to.include('Syntax error')
			}
		})

		it('should handle empty variable names', async () => {
			const template = '{=""}'
			
			try {
				await parseTemplate(template)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				assert(error instanceof Error)
				expect((error as Error).message).to.include('Syntax error')
			}
		})

		it('should handle invalid variable names starting with numbers', async () => {
			const template = '{123invalid="test"}'
			
			try {
				await parseTemplate(template)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				assert(error instanceof Error)
				expect((error as Error).message).to.include('Syntax error')
			}
		})

		it('should handle invalid variable names with special characters', async () => {
			const template = '{invalid-name="test"}'
			
			try {
				await parseTemplate(template)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				assert(error instanceof Error)
				expect((error as Error).message).to.include('Syntax error')
			}
		})

		it('should handle nested variable definitions', async () => {
			const template = '{outer={inner="test"}content{/outer}}'
			
			try {
				await parseTemplate(template)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				assert(error instanceof Error)
				expect((error as Error).message).to.include('Syntax error')
			}
		})
	})

	describe('malformed slot syntax', () => {
		it('should handle unclosed slots', async () => {
			const template = 'Text with {{unclosed slot'
			
			try {
				await parseTemplate(template)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				assert(error instanceof Error)
				expect((error as Error).message).to.include('Syntax error')
			}
		})

		it('should handle malformed slot with single brace', async () => {
			const template = 'Text with {single brace}'
			
			try {
				await parseTemplate(template)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				assert(error instanceof Error)
				expect((error as Error).message).to.include('Syntax error')
			}
		})

		it('should handle empty slots', async () => {
			const template = 'Text with {{}} empty slot'
			
			try {
				await parseTemplate(template)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				assert(error instanceof Error)
				expect((error as Error).message).to.include('Syntax error')
			}
		})

		it('should handle slots with invalid expressions', async () => {
			const template = 'Text with {{123invalidExpression}}'
			
			try {
				await parseTemplate(template)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				assert(error instanceof Error)
				expect((error as Error).message).to.include('Syntax error')
			}
		})

		it('should handle slots with malformed function calls', async () => {
			const template = 'Text with {{func(unclosed}}'
			
			try {
				await parseTemplate(template)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				assert(error instanceof Error)
				expect((error as Error).message).to.include('Syntax error')
			}
		})
	})

	describe('malformed function calls', () => {
		it('should handle function calls with no parameters but no parentheses', async () => {
			const template = '{{functionName}}'
			
			// This should be treated as a variable reference, not function call
			const result = await parseTemplate(template)
			expect(result).to.equal('{{functionName}}') // undefined variable
		})

		it('should handle function calls with malformed parameters', async () => {
			const template = '{{func("unclosed string)}}'
			
			try {
				await parseTemplate(template)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				assert(error instanceof Error)
				expect((error as Error).message).to.include('Syntax error')
			}
		})

		it('should handle function calls with unescaped quotes in parameters', async () => {
			const template = '{{func("string with " quote")}}'
			
			try {
				await parseTemplate(template)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				assert(error instanceof Error)
				expect((error as Error).message).to.include('Syntax error')
			}
		})

		it('should handle function calls with nested quotes', async () => {
			const template = '{{func("outer \\"inner\\" quote")}}'
			
			// Should remain as-is since func is not a known function
			const result = await parseTemplate(template)
			expect(result).to.equal('{{func("outer \\"inner\\" quote")}}')
		})

		it('should handle function calls with missing commas between parameters', async () => {
			const template = '{{func("param1" "param2")}}'
			
			try {
				await parseTemplate(template)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				assert(error instanceof Error)
				expect((error as Error).message).to.include('Syntax error')
			}
		})

		it('should handle function calls with trailing commas', async () => {
			const template = '{{func("param1", "param2",)}}'
			
			try {
				await parseTemplate(template)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				assert(error instanceof Error)
				expect((error as Error).message).to.include('Syntax error')
			}
		})
	})

	describe('string parsing edge cases', () => {
		it('should handle escaped characters in strings', async () => {
			const template = '{test="String with \\"quotes\\" and \\{braces\\}"}{{test}}'
			const result = await parseTemplate(template)
			expect(result).to.equal('String with \\"quotes\\" and \\{braces\\}')
		})

		it('should handle empty strings', async () => {
			const template = '{empty=""}{{empty}}'
			const result = await parseTemplate(template)
			expect(result).to.equal('')
		})

		it('should handle unclosed strings', async () => {
			const template = '{test="unclosed string}'
			
			try {
				await parseTemplate(template)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				assert(error instanceof Error)
				expect((error as Error).message).to.include('Syntax error')
			}
		})

		it('should handle strings with various escape sequences', async () => {
			const template = '{test="Line 1\\nLine 2\\tTabbed"}'
			const result = await parseTemplate(template)
			expect(result).to.equal('Line 1\\nLine 2\\tTabbed')
		})

		it('should handle strings with backslashes at end', async () => {
			const template = '{test="Path with backslash\\\\"}'
			const result = await parseTemplate(template)
			expect(result).to.equal('Path with backslash\\\\')
		})
	})

	describe('parameter parsing edge cases', () => {
		it('should handle parameters with missing names', async () => {
			const template = '{func(="default")}content{/func}'
			
			try {
				await parseTemplate(template)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				assert(error instanceof Error)
				expect((error as Error).message).to.include('Syntax error')
			}
		})

		it('should handle parameters with invalid names', async () => {
			const template = '{func(123param="value")}content{/func}'
			
			try {
				await parseTemplate(template)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				assert(error instanceof Error)
				expect((error as Error).message).to.include('Syntax error')
			}
		})

		it('should handle mixed parameter styles', async () => {
			const template = '{func(required, optional="default")}{{required}} {{optional}}{/func}'
			const variables: ParserVariables = {}
			const context: ParserContext = {
				variables,
				options: {},
				attachments: []
			}
			
			try {
				await parseTemplate(template, context)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				assert(error instanceof Error)
				expect((error as Error).message).to.include('Required param for func not found: required')
			}
		})
	})

	describe('comment edge cases', () => {
		it('should handle comments inside strings', async () => {
			const template = '{test="String with // comment inside"}{{test}}'
			const result = await parseTemplate(template)
			expect(result).to.equal('String with // comment inside')
		})

		it('should handle malformed comment syntax', async () => {
			const template = 'Text with / incomplete comment'
			const result = await parseTemplate(template)
			expect(result).to.equal('Text with / incomplete comment')
		})

		it('should handle nested comment-like patterns', async () => {
			const template = '/* outer /* inner */ comment */'
			const result = await parseTemplate(template)
			// Should remove the first complete comment
			expect(result.trim()).to.equal('comment */')
		})

		it('should handle comments at end of file without newline', async () => {
			const template = 'Content // comment at end'
			const result = await parseTemplate(template)
			expect(result).to.equal('Content')
		})
	})

	describe('whitespace handling', () => {
		it('should handle mixed whitespace in variable definitions', async () => {
			const template = '{ \t test \t = \t "value" \t }{{ test }}'
			const result = await parseTemplate(template)
			expect(result).to.equal('value')
		})

		it('should handle mixed whitespace in function calls', async () => {
			const template = '{{ \t load( \t "test.txt" \t ) \t }}'
			
			try {
				await parseTemplate(template)
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				assert(error instanceof Error)
				// Should fail with file not found, not syntax error
				expect((error as Error).message).to.not.include('Syntax error')
			}
		})

		it('should handle tabs vs spaces consistently', async () => {
			const template1 = '{    test    =    "value"    }{{test}}'
			const template2 = '{\t\ttest\t\t=\t\t"value"\t\t}{{test}}'
			
			const result1 = await parseTemplate(template1)
			const result2 = await parseTemplate(template2)
			
			expect(result1).to.equal(result2)
			expect(result1).to.equal('value')
		})
	})
})