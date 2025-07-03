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

		it('should handle multiple code blocks with different languages', async () => {
			const template = `Multiple examples:

\`\`\`javascript
{jsVar = "test"}
console.log({{jsVar}});
\`\`\`

\`\`\`python
{pyVar = "example"}
print({{pyVar}})
\`\`\`

And this works: {{realVar}}`

			const variables: ParserVariables = {
				realVar: { name: 'realVar', type: ValueType.string, value: 'parsed', params: [] },
			}
			const parserContext: ParserContext = {
				variables,
				options: {},
				attachments: [],
			}

			const result = await parseTemplate(template, parserContext)

			// All code block content should be preserved
			expect(result).to.include('{jsVar = "test"}')
			expect(result).to.include('console.log({{jsVar}});')
			expect(result).to.include('{pyVar = "example"}')
			expect(result).to.include('print({{pyVar}})')
			// But external variables should still work
			expect(result).to.include('And this works: parsed')
		})

		it('should handle mixed inline and fenced code blocks', async () => {
			const template = `Here's mixed code:

Use \`{inline="variable"}\` for inline.

\`\`\`
{block}
This is in a block with {{slots}}
{/block}
\`\`\`

More inline: \`{{anotherSlot}}\`

Result: {{testVar}}`

			const variables: ParserVariables = {
				testVar: { name: 'testVar', type: ValueType.string, value: 'success', params: [] },
			}
			const parserContext: ParserContext = {
				variables,
				options: {},
				attachments: [],
			}

			const result = await parseTemplate(template, parserContext)

			// All code content should be preserved
			expect(result).to.include('`{inline="variable"}`')
			expect(result).to.include('{block}')
			expect(result).to.include('This is in a block with {{slots}}')
			expect(result).to.include('{/block}')
			expect(result).to.include('`{{anotherSlot}}`')
			// External variable should work
			expect(result).to.include('Result: success')
		})

		it('should handle nested backticks correctly', async () => {
			const template = `Code with nested backticks:

\`\`\`bash
echo "\`{{variable}}\` is a template"
\`\`\`

Result: {{testVar}}`

			const variables: ParserVariables = {
				testVar: { name: 'testVar', type: ValueType.string, value: 'working', params: [] },
			}
			const parserContext: ParserContext = {
				variables,
				options: {},
				attachments: [],
			}

			const result = await parseTemplate(template, parserContext)

			// Code block with nested backticks should be preserved
			expect(result).to.include('echo "`{{variable}}` is a template"')
			// External variable should work
			expect(result).to.include('Result: working')
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

		it('should handle multiline variables with invalid slot syntax', async () => {
			const template = `{badSlots}
Content with {{invalid variable name}} and {{123numbers}}
{/badSlots}
Result: {{badSlots}}`

			const parserContext: ParserContext = {
				variables: {},
				options: {},
				attachments: [],
			}

			const result = await parseTemplate(template, parserContext)

			// Should treat problematic content as raw text
			expect(result).to.include('{{invalid variable name}}')
			expect(result).to.include('{{123numbers}}')
		})

		it('should handle multiline variables with mixed valid and invalid syntax', async () => {
			const template = `{mixed}
Valid: {{validVar}}
Invalid: {{invalid var}}
More invalid: {unclosed
{/mixed}
{validVar = "works"}
Result: {{mixed}}`

			const parserContext: ParserContext = {
				variables: {},
				options: {},
				attachments: [],
			}

			const result = await parseTemplate(template, parserContext)

			// Should treat entire content as raw due to invalid syntax
			expect(result).to.include('Valid: {{validVar}}')
			expect(result).to.include('Invalid: {{invalid var}}')
			expect(result).to.include('More invalid: {unclosed')
		})

		it('should preserve valid multiline variables with slots', async () => {
			const template = `{greeting}
Hello, {{name}}!
Welcome to {{place}}.
{/greeting}
{name = "World"}
{place = "PromptShaper"}
Result: {{greeting}}`

			const parserContext: ParserContext = {
				variables: {},
				options: {},
				attachments: [],
			}

			const result = await parseTemplate(template, parserContext)

			// Should parse valid slots within multiline variables
			expect(result).to.include('Hello, World!')
			expect(result).to.include('Welcome to PromptShaper.')
		})
	})
})
