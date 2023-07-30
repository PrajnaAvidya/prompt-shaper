import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { ParserVariables, ValueType } from '../src/types'
import { loadFileContent } from '../src/utils'

describe('slots', () => {
	it('should correctly render a slot with string variable', () => {
		const template = loadFileContent('./test/templates/slots/string.ps.txt')
		const variables: ParserVariables = {
			name: { name: 'name', type: ValueType.string, value: 'World', params: [] },
		}

		const result = parseTemplate(template, variables)

		expect(result).to.equal('Hello, World!')
	})

	it('should correctly render a slot with number variable', () => {
		const template = loadFileContent('./test/templates/slots/number.ps.txt')
		const variables: ParserVariables = {
			age: { name: 'age', type: ValueType.number, value: 25, params: [] },
		}

		const result = parseTemplate(template, variables)

		expect(result).to.equal('I am 25 years old.')
	})

	it('should correctly render a slot with function variable', () => {
		const template = loadFileContent('./test/templates/slots/function.ps.txt')
		const variables: ParserVariables = {
			sum: {
				name: 'sum',
				type: ValueType.function,
				value: 'add',
				params: [
					{ type: ValueType.number, value: 1 },
					{ type: ValueType.number, value: 2 },
				],
			},
		}

		const result = parseTemplate(template, variables)

		expect(result).to.equal('The sum of 1 and 2 is 3.')
	})

	it('should not render slots that have no variable', () => {
		const template = loadFileContent('./test/templates/slots/undefined.ps.txt')

		const result = parseTemplate(template)

		expect(result).to.equal('Hello, {{undefinedVariable}}')
	})

	it('should throw an error with malformed slot', () => {
		const template = loadFileContent('./test/templates/slots/malformed.ps.txt')

		expect(() => parseTemplate(template)).to.throw(
			`Expected "(", ")", "*", "+", "-", "/", "\\"", "}}", [0-9], [a-zA-Z_0-9], or [a-zA-Z_] but "}" found.`,
		)
	})

	it('should render raw text when the @ symbol is used', () => {
		const template = loadFileContent('./test/templates/slots/raw-text.ps.txt')

		const result = parseTemplate(template)

		expect(result).to.equal('{{hello}}')
	})
})
