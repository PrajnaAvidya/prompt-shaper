import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { ParserVariables, ValueType } from '../src/types'
import { loadFileContent } from '../src/utils'

describe('slots', () => {
	it('should correctly render a basic slot', () => {
		const template = loadFileContent('./test/templates/slots/basic.ps.txt')
		const variables: ParserVariables = { name: { name: 'name', type: ValueType.string, value: 'World', params: [] } }

		const result = parseTemplate(template, variables)

		expect(result).to.equal('Hello, World!')
	})

	it('should throw an error with malformed slot', () => {
		const template = loadFileContent('./test/templates/slots/malformed.ps.txt')

		expect(() => parseTemplate(template, {})).to.throw(
			`Expected "(", ")", "*", "+", "-", "/", "\\"", "}}", [0-9], [a-zA-Z_0-9], or [a-zA-Z_] but "}" found.`,
		)
	})
})
