import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { ParserVariables, ValueType } from '../src/types'
import { loadFileContent } from '../src/utils'

describe('slots', () => {
	it('should correctly render a slot with raw string', () => {
		const template = loadFileContent('./test/templates/slots/raw-string.ps.md')

		const result = parseTemplate(template)

		expect(result).to.equal('This is a raw string: Hello')
	})

	it('should correctly render a slot with raw number', () => {
		const template = loadFileContent('./test/templates/slots/raw-number.ps.md')

		const result = parseTemplate(template)

		expect(result).to.equal('This is a raw number: 42')
	})

	it('should correctly render a slot with string variable', () => {
		const template = loadFileContent('./test/templates/slots/string-variable.ps.md')
		const variables: ParserVariables = {
			name: { name: 'name', type: ValueType.string, value: 'World', params: [] },
		}

		const result = parseTemplate(template, variables)

		expect(result).to.equal('Hello, World!')
	})

	it('should correctly render a slot with number variable', () => {
		const template = loadFileContent('./test/templates/slots/number-variable.ps.md')
		const variables: ParserVariables = {
			age: { name: 'age', type: ValueType.number, value: 25, params: [] },
		}

		const result = parseTemplate(template, variables)

		expect(result).to.equal('I am 25 years old.')
	})

	it('should correctly render a slot with function variable', () => {
		const template = loadFileContent('./test/templates/slots/function.ps.md')
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
		const template = loadFileContent('./test/templates/slots/undefined.ps.md')

		const result = parseTemplate(template)

		expect(result).to.equal('Hello, {{undefinedVariable}}')
	})

	it('should throw an error with malformed slot', () => {
		const template = loadFileContent('./test/templates/slots/malformed.ps.md')

		expect(() => parseTemplate(template)).to.throw(`Syntax error at line 1 column 2: '{'`)
	})

	it('should render raw text when the @ symbol is used', () => {
		const template = loadFileContent('./test/templates/slots/raw-text.ps.md')
		const variables: ParserVariables = {
			rawText: {
				name: 'rawText',
				type: ValueType.string,
				value: '{{hello}}',
				params: [],
			},
		}

		const result = parseTemplate(template, variables)

		expect(result).to.equal('{{hello}}')
	})
})
