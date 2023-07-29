import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { ParserVariables, ValueType } from '../src/types'
import { loadFileContent } from '../src/utils'

describe('escaped characters', () => {
	it('should correctly handle escaped escaped-chars', () => {
		const template = loadFileContent('./test/templates/escaped-chars/brackets.ps.txt')
		const variables: ParserVariables = {
			name: { name: 'name', type: ValueType.string, value: 'World', params: [] }
		}

		const result = parseTemplate(template, variables)

		expect(result).to.equal('Hello, {{name}}')
	})

	it('should correctly handle escaped double quotes', () => {
		const template = loadFileContent('./test/templates/escaped-chars/double-quotes.ps.txt')
		const variables: ParserVariables = {
			quote: { name: 'quote', type: ValueType.string, value: 'It\'s a beautiful day', params: [] }
		}

		const result = parseTemplate(template, variables)

		expect(result).to.equal('He said, "It\'s a beautiful day"')
	})
})