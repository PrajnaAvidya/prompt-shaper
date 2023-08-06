import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { ParserVariables, ValueType } from '../src/types'
import { loadFileContent } from '../src/utils'

describe.skip('arithmetic (old)', () => {
	it('should correctly add two numbers', () => {
		const template = loadFileContent('./test/templates/arithmetic/add.ps.txt')
		const variables: ParserVariables = {
			num: { name: 'num', type: ValueType.number, value: 5, params: [] },
		}

		const result = parseTemplate(template, variables)

		expect(result).to.equal('The sum of 5 and 7 is 12')
	})

	it('should correctly subtract two numbers', () => {
		const template = loadFileContent('./test/templates/arithmetic/subtract.ps.txt')
		const variables: ParserVariables = {
			num: { name: 'num', type: ValueType.number, value: 10, params: [] },
		}

		const result = parseTemplate(template, variables)

		expect(result).to.equal('The difference between 10 and 6 is 4')
	})

	it('should correctly multiply two numbers', () => {
		const template = loadFileContent('./test/templates/arithmetic/multiply.ps.txt')
		const variables: ParserVariables = {
			num: { name: 'num', type: ValueType.number, value: 3, params: [] },
		}

		const result = parseTemplate(template, variables)

		expect(result).to.equal('The product of 3 and 4 is 12')
	})

	it('should correctly divide two numbers', () => {
		const template = loadFileContent('./test/templates/arithmetic/divide.ps.txt')
		const variables: ParserVariables = {
			num: { name: 'num', type: ValueType.number, value: 20, params: [] },
		}

		const result = parseTemplate(template, variables)

		expect(result).to.equal('The quotient of 20 divided by 5 is 4')
	})

	it('should throw an error when dividing by zero', () => {
		const template = loadFileContent('./test/templates/arithmetic/divide-by-zero.ps.txt')
		const variables: ParserVariables = {
			num: { name: 'num', type: ValueType.number, value: 20, params: [] },
		}

		expect(() => parseTemplate(template, variables)).to.throw('Division by zero')
	})
})

describe('arithmetic', () => {
	it('should correctly add two numbers', () => {
		const template = loadFileContent('./test/templates/arithmetic/add.ps.txt')
		const variables: ParserVariables = {
			num1: { name: 'num1', type: ValueType.number, value: 5, params: [] },
			num2: { name: 'num2', type: ValueType.number, value: 6, params: [] },
			num3: { name: 'num3', type: ValueType.number, value: 7, params: [] },
			num4: { name: 'num4', type: ValueType.number, value: 8, params: [] },
		}

		const result = parseTemplate(template, variables, {showDebugMessages: true, returnParserMatches: false})
		console.log(result)

		// expect(result).to.equal('The sum of 5 and 7 is 12')
	})
})
