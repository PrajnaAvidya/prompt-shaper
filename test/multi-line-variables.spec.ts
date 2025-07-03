import { assert, expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { ParserContext, ParserVariables, ValueType } from '../src/types'
import { loadFileContent } from '../src/utils'

describe('multi-line variables', async () => {
	it('should correctly parse multi-line string variables', async () => {
		const template = loadFileContent('./test/templates/multi-line-variables/string.ps.md')

		const result = await parseTemplate(template)

		expect(result).to.equal('Hello,\nWorld!')
	})

	it('should correctly parse multi-line variables with slots', async () => {
		const template = loadFileContent('./test/templates/multi-line-variables/with-slots.ps.md')

		const result = await parseTemplate(template)

		expect(result).to.equal('Hello, World')
	})

	it('should correctly parse multi-line variables with parameters', async () => {
		const template = loadFileContent('./test/templates/multi-line-variables/with-params.ps.md')

		const result = await parseTemplate(template)

		expect(result).to.equal('Hello, World')
	})

	it('should correctly parse multi-line variables with default parameter', async () => {
		const template = loadFileContent('./test/templates/multi-line-variables/with-default-param.ps.md')

		const result = await parseTemplate(template)

		expect(result).to.equal('Hello World')
	})

	it('should throw an error when missing required parameter', async () => {
		const template = loadFileContent('./test/templates/multi-line-variables/missing-required-param.ps.md')

		try {
			await parseTemplate(template)
			throw new Error('Expected function to throw, but it did not')
		} catch (err: Error | unknown) {
			assert(err instanceof Error)
			expect(err.message).to.equal('Required param for requiredParams not found: b')
		}
	})

	// issue #2 tests - multiline variables syntax errors
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

		// should handle special characters in multiline variables
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

		// should handle nested variable references
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

		// should treat problematic content as raw text
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

		// should treat entire content as raw due to invalid syntax
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

		// should parse valid slots within multiline variables
		expect(result).to.include('Hello, World!')
		expect(result).to.include('Welcome to PromptShaper.')
	})
})
