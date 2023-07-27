import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { ParserVariables, ValueType } from '../src/types'
import { loadFileContent } from '../src/utils'

describe('single-line single-line-variables', () => {
	it('should correctly parse single-line string single-line-variables', () => {
		const template = loadFileContent('./test/templates/single-line-variables/string.ps.txt')
		const variables: ParserVariables = {
			name: { name: 'name', type: ValueType.string, value: 'World', params: [] }
		}

		const result = parseTemplate(template, variables)

		expect(result).to.equal('Hello, World!')
	})

	it('should correctly parse single-line numeric single-line-variables', () => {
		const template = loadFileContent('./test/templates/single-line-variables/number.ps.txt')
		const variables: ParserVariables = {
			age: { name: 'age', type: ValueType.number, value: 25, params: [] }
		}

		const result = parseTemplate(template, variables)

		expect(result).to.equal('I am 25 years old.')
	})

	it('should correctly parse single-line function single-line-variables', () => {
		const template = loadFileContent('./test/templates/single-line-variables/function.ps.txt')
		const variables: ParserVariables = {
			sum: { name: 'sum', type: ValueType.function, value: 'add', params: [{ type: ValueType.number, value: 1 }, { type: ValueType.number, value: 2 }] }
		}

		const result = parseTemplate(template, variables)

		expect(result).to.equal('The sum of 1 and 2 is 3.')
	})

	it('should not parse single-line-variables that are not defined', () => {
		const template = loadFileContent('./test/templates/single-line-variables/undefined.ps.txt')

		const result = parseTemplate(template, {})

		expect(result).to.equal('Hello, {{undefinedVariable}}')
	})
})
