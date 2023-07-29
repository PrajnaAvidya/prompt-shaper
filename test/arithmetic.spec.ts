import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { ParserVariables, ValueType } from '../src/types'
import { loadFileContent } from '../src/utils'

// TODO this doesn't work yet bc arithmetic needs to be upgraded
describe.skip('arithmetic', () => {
	it('should correctly add two numbers', () => {
		const template = loadFileContent('./test/templates/arithmetic/add.ps.txt')
		const variables: ParserVariables = {
			num1: { name: 'num1', type: ValueType.number, value: 5, params: [] },
			num2: { name: 'num2', type: ValueType.number, value: 7, params: [] },
		}

		const result = parseTemplate(template, variables)

		expect(result).to.equal('5 + 7 = 12')
	})

	it('should correctly subtract two numbers', () => {
		const template = loadFileContent('./test/templates/arithmetic/subtract.ps.txt')
		const variables: ParserVariables = {
			num1: { name: 'num1', type: ValueType.number, value: 10, params: [] },
			num2: { name: 'num2', type: ValueType.number, value: 6, params: [] },
		}

		const result = parseTemplate(template, variables)

		expect(result).to.equal('10 - 6 = 4')
	})

	it('should correctly multiply two numbers', () => {
		const template = loadFileContent('./test/templates/arithmetic/multiply.ps.txt')
		const variables: ParserVariables = {
			num1: { name: 'num1', type: ValueType.number, value: 3, params: [] },
			num2: { name: 'num2', type: ValueType.number, value: 4, params: [] },
		}

		const result = parseTemplate(template, variables)

		expect(result).to.equal('3 * 4 = 12')
	})

	it('should correctly divide two numbers', () => {
		const template = loadFileContent('./test/templates/arithmetic/divide.ps.txt')
		const variables: ParserVariables = {
			num1: { name: 'num1', type: ValueType.number, value: 20, params: [] },
			num2: { name: 'num2', type: ValueType.number, value: 5, params: [] },
		}

		const result = parseTemplate(template, variables)

		expect(result).to.equal('20 / 5 = 4')
	})

	it('should throw an error when dividing by zero', () => {
		const template = loadFileContent('./test/templates/arithmetic/divide.ps.txt')
		const variables: ParserVariables = {
			num1: { name: 'num1', type: ValueType.number, value: 20, params: [] },
			num2: { name: 'num2', type: ValueType.number, value: 0, params: [] },
		}

		expect(() => parseTemplate(template, variables)).to.throw('Division by zero')
	})
})
