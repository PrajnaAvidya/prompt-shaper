import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { ParserVariables, ValueType } from '../src/types'
import { loadFileContent } from '../src/utils'

describe('multi-line variables', () => {
	it('should correctly parse multi-line string variables', () => {
		const template = loadFileContent('./test/templates/multi-line-variables/string.ps.txt')

		const result = parseTemplate(template, {})

		expect(result).to.equal('Hello,\nWorld!')
	})

	it('should correctly parse multi-line variables with slots', () => {
		const template = loadFileContent('./test/templates/multi-line-variables/with-slots.ps.txt')

		const result = parseTemplate(template, {})

		expect(result).to.equal('Hello, World')
	})

	it('should correctly parse multi-line variables with parameters', () => {
		const template = loadFileContent('./test/templates/multi-line-variables/with-params.ps.txt')

		const result = parseTemplate(template, {})

		expect(result).to.equal('Hello, World')
	})
})
