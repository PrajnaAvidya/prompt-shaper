import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { ParserContext, ParserVariables, ValueType } from '../src/types'
import { exec } from 'child_process'

describe('Bug Tests', () => {
	describe('Issue #50: parseTemplate removes comments from raw files', () => {
		it('should preserve comments in raw mode via CLI', done => {
			const testContent = `// This is a JavaScript comment
/* This is a multi-line
   comment that should be preserved */
const code = "// this is not a comment";
// Another comment`

			exec(`ts-node src/cli.ts -r -is "${testContent}"`, (error, stdout) => {
				if (error) {
					throw new Error(error.message)
				}
				// In raw mode, comments should be preserved
				expect(stdout).to.include('// This is a JavaScript comment')
				expect(stdout).to.include('/* This is a multi-line')
				expect(stdout).to.include('// Another comment')
				done()
			})
		})

		it('should remove comments when NOT in raw mode', async () => {
			const template = `// This is a comment
Hello, {{name}}!
/* Multi-line
   comment */`
			const variables: ParserVariables = {
				name: { name: 'name', type: ValueType.string, value: 'World', params: [] },
			}
			const parserContext: ParserContext = {
				variables,
				options: {},
				attachments: [],
			}

			const result = await parseTemplate(template, parserContext)

			// Comments should be removed in normal mode
			expect(result).to.equal('Hello, World!')
			expect(result).to.not.include('//')
			expect(result).to.not.include('/*')
		})
	})

	describe("Issue #20: don't parse tags inside markdown blocks", () => {
		it('should not parse tags inside markdown code blocks', async () => {
			const template = `Here's an example:
\`\`\`markdown
{variable = "test"}
{{variable}}
\`\`\`
This should work: {{realVar}}`

			const variables: ParserVariables = {
				realVar: { name: 'realVar', type: ValueType.string, value: 'parsed', params: [] },
			}
			const parserContext: ParserContext = {
				variables,
				options: {},
				attachments: [],
			}

			const result = await parseTemplate(template, parserContext)

			// Tags inside code blocks should not be parsed
			expect(result).to.include('{variable = "test"}')
			expect(result).to.include('{{variable}}')
			// But tags outside should be parsed
			expect(result).to.include('This should work: parsed')
		})

		it('should not parse tags inside inline code', async () => {
			const template = 'Use `{{variable}}` to reference a variable. But this {{realVar}} should work.'

			const variables: ParserVariables = {
				realVar: { name: 'realVar', type: ValueType.string, value: 'parsed', params: [] },
			}
			const parserContext: ParserContext = {
				variables,
				options: {},
				attachments: [],
			}

			const result = await parseTemplate(template, parserContext)

			// Tags inside inline code should not be parsed
			expect(result).to.include('`{{variable}}`')
			// But tags outside should be parsed
			expect(result).to.include('But this parsed should work.')
		})
	})

	describe('Issue #2: multiline variables syntax errors', () => {
		it('should handle multiline variables with special characters', async () => {
			const template = `{myVar}
This has "quotes" and {braces} and {{double braces}}
And even \`backticks\` and $variables
{/myVar}
Result: {{myVar}}`

			const parserContext: ParserContext = {
				variables: {},
				options: {},
				attachments: [],
			}

			const result = await parseTemplate(template, parserContext)

			// Should handle special characters in multiline variables
			expect(result).to.include('This has "quotes"')
			expect(result).to.include('{braces}')
			expect(result).to.include('{{double braces}}')
			expect(result).to.include('`backticks`')
			expect(result).to.include('$variables')
		})

		it('should handle nested multiline variables', async () => {
			const template = `{outer}
Outer content with {{inner}}
{/outer}
{inner = "nested value"}
Result: {{outer}}`

			const parserContext: ParserContext = {
				variables: {},
				options: {},
				attachments: [],
			}

			const result = await parseTemplate(template, parserContext)

			// Should handle nested variable references
			expect(result).to.include('Outer content with nested value')
		})
	})

	describe('Issue #51: numeric variable handling', () => {
		it('should handle numeric parameters properly', async () => {
			const template = '{add(5, 10)}'

			const parserContext: ParserContext = {
				variables: {},
				options: {},
				attachments: [],
			}

			const result = await parseTemplate(template, parserContext)

			// Should compute the addition
			expect(result).to.equal('15')
		})

		it('should handle numeric variables', async () => {
			const template = `{num = 42}
{str = "hello"}
Number: {{num}}
String: {{str}}`

			const parserContext: ParserContext = {
				variables: {},
				options: {},
				attachments: [],
			}

			const result = await parseTemplate(template, parserContext)

			// Should handle both numeric and string variables
			expect(result).to.include('Number: 42')
			expect(result).to.include('String: hello')
		})
	})
})
