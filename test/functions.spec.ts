import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { loadFileContent } from '../src/utils'

describe('functions', () => {
	it('should correctly evaluate add function', () => {
		const template = loadFileContent('./test/templates/functions/add.ps.txt')
		const result = parseTemplate(template)

		expect(result).to.equal('The sum of 2 and 3 is 5')
	})

	it('should correctly evaluate subtract function', () => {
		const template = loadFileContent('./test/templates/functions/subtract.ps.txt')
		const result = parseTemplate(template)

		expect(result).to.equal('The difference between 5 and 2 is 3')
	})

	it('should correctly evaluate multiply function', () => {
		const template = loadFileContent('./test/templates/functions/multiply.ps.txt')
		const result = parseTemplate(template)

		expect(result).to.equal('The product of 3 and 4 is 12')
	})

	it('should correctly evaluate divide function', () => {
		const template = loadFileContent('./test/templates/functions/divide.ps.txt')
		const result = parseTemplate(template)

		expect(result).to.equal('The quotient of 10 and 2 is 5')
	})

	it('should correctly evaluate load function', () => {
		const template = loadFileContent('./test/templates/functions/load.ps.txt')
		const result = parseTemplate(template)

		const expectedOutput = loadFileContent('./test/templates/functions/load-content.ps.txt')
		expect(result).to.equal(expectedOutput)
	})
})