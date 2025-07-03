import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { ParserContext, ParserVariables, ValueType } from '../src/types'

describe("markdown code blocks - issue #20", () => {
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

		// tags inside code blocks should not be parsed
		expect(result).to.include('{variable = "test"}')
		expect(result).to.include('{{variable}}')
		// but tags outside should be parsed
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

		// tags inside inline code should not be parsed
		expect(result).to.include('`{{variable}}`')
		// but tags outside should be parsed
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

		// all code block content should be preserved
		expect(result).to.include('{jsVar = "test"}')
		expect(result).to.include('console.log({{jsVar}});')
		expect(result).to.include('{pyVar = "example"}')
		expect(result).to.include('print({{pyVar}})')
		// but external variables should still work
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

		// all code content should be preserved
		expect(result).to.include('`{inline="variable"}`')
		expect(result).to.include('{block}')
		expect(result).to.include('This is in a block with {{slots}}')
		expect(result).to.include('{/block}')
		expect(result).to.include('`{{anotherSlot}}`')
		// external variable should work
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

		// code block with nested backticks should be preserved
		expect(result).to.include('echo "`{{variable}}` is a template"')
		// external variable should work
		expect(result).to.include('Result: working')
	})
})