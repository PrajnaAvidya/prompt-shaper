import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { ParserVariables, ValueType } from '../src/types'
import { loadFileContent } from '../src/utils'

describe('escaped characters', () => {
	it('should correctly handle escaped braces', async () => {
		const template = loadFileContent('./test/templates/escaped-chars/braces.ps.md')
		const variables: ParserVariables = {
			name: { name: 'name', type: ValueType.string, value: 'World', params: [] },
		}

		const result = await parseTemplate(template, variables)

		expect(result).to.equal('Hello, {{name}}')
	})

	it('should correctly handle escaped double quotes', async () => {
		const template = loadFileContent('./test/templates/escaped-chars/double-quotes.ps.md')
		const variables: ParserVariables = {
			quote: { name: 'quote', type: ValueType.string, value: "It's a beautiful day", params: [] },
		}

		const result = await parseTemplate(template, variables)

		expect(result).to.equal('He said, "It\'s a beautiful day"')
	})
})
