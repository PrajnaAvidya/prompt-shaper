import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { loadFileContent } from '../src/utils'

describe('single-line-variables', () => {
	it('should correctly parse single-line string variables', () => {
		const template = loadFileContent('./test/templates/single-line-variables/string.ps.txt')

		const result = parseTemplate(template)

		expect(result).to.equal('Hello World')
	})

	it('should correctly parse single-line number variables', () => {
		const template = loadFileContent('./test/templates/single-line-variables/number.ps.txt')

		const result = parseTemplate(template)

		expect(result).to.equal('42')
	})
})
