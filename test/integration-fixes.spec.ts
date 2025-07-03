import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { ParserContext, ParserVariables, ValueType } from '../src/types'

describe('Integration Tests for Fixed Issues', () => {
	describe('Combined Issue #2 and #20 scenarios', () => {
		it('should handle code blocks containing problematic multiline variable syntax', async () => {
			const template = `Here's broken code example:

\`\`\`javascript
{problematic}
This has {{invalid var}} inside
{/problematic}
console.log({{problematic}});
\`\`\`

This works: {{realVar}}`

			const variables: ParserVariables = {
				realVar: { name: 'realVar', type: ValueType.string, value: 'success', params: [] },
			}
			const parserContext: ParserContext = {
				variables,
				options: {},
				attachments: [],
			}

			const result = await parseTemplate(template, parserContext)

			// Code block should be completely preserved
			expect(result).to.include('{problematic}')
			expect(result).to.include('This has {{invalid var}} inside')
			expect(result).to.include('{/problematic}')
			expect(result).to.include('console.log({{problematic}});')
			// External variable should work
			expect(result).to.include('This works: success')
		})

		it('should handle mixed valid and problematic multiline vars with code blocks', async () => {
			const template = `{validVar}
Hello {{name}}
{/validVar}

\`\`\`markdown
{invalidVar}
Bad syntax: {{invalid var name}}
{/invalidVar}
\`\`\`

{problematicVar}
This also has {braces} and {{bad spaces}}
{/problematicVar}

Results:
- Valid: {{validVar}}
- Problematic: {{problematicVar}}`

			const variables: ParserVariables = {
				name: { name: 'name', type: ValueType.string, value: 'World', params: [] },
			}
			const parserContext: ParserContext = {
				variables,
				options: {},
				attachments: [],
			}

			const result = await parseTemplate(template, parserContext)

			// Valid multiline should be parsed
			expect(result).to.include('- Valid: Hello World')
			// Code block should be preserved
			expect(result).to.include('{invalidVar}')
			expect(result).to.include('Bad syntax: {{invalid var name}}')
			// Problematic multiline should be raw
			expect(result).to.include('This also has {braces} and {{bad spaces}}')
		})

		it('should handle nested structures with all edge cases', async () => {
			const template = `{outerValid}
Outer with {{innerVar}}

\`\`\`
{codeExample}
Inside code: {{not_parsed}}
{/codeExample}
\`\`\`

{nestedProblematic}
Has {{bad syntax}} inside
{/nestedProblematic}
Nested result: {{nestedProblematic}}
{/outerValid}

{innerVar = "nested"}
Final: {{outerValid}}`

			const parserContext: ParserContext = {
				variables: {},
				options: {},
				attachments: [],
			}

			const result = await parseTemplate(template, parserContext)

			// Should properly handle all nested cases
			expect(result).to.include('Outer with {{innerVar}}') // innerVar not parsed due to problematic content
			expect(result).to.include('{codeExample}')
			expect(result).to.include('Inside code: {{not_parsed}}')
			expect(result).to.include('Has {{bad syntax}} inside')
		})
	})

	describe('Edge cases for preprocessing', () => {
		it('should handle empty multiline variables', async () => {
			const template = `{empty}
{/empty}
Result: "{{empty}}"`

			const result = await parseTemplate(template)
			expect(result).to.include('Result: "\n"') // Empty multiline includes newlines
		})

		it('should handle multiline variables with only whitespace', async () => {
			const template = `{whitespace}
   
	
{/whitespace}
Result: "{{whitespace}}"`

			const result = await parseTemplate(template)
			expect(result).to.include('Result: "')
		})

		it('should handle complex nesting without regression', async () => {
			const template = `{level1}
Level 1 content
{level2}
Level 2 with {{var1}}
{level3}
Level 3 with {{var2}}
{/level3}
Back to level 2: {{level3}}
{/level2}
Back to level 1: {{level2}}
{/level1}

{var1 = "first"}
{var2 = "second"}
Final: {{level1}}`

			const result = await parseTemplate(template)

			// Should handle deep nesting correctly
			expect(result).to.include('Level 2 with first')
			expect(result).to.include('Level 3 with second')
			expect(result).to.include('Back to level 2: Level 3 with second')
			expect(result).to.include('Back to level 1: Level 2 with first')
		})
	})
})
