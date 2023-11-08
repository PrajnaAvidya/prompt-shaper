import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { loadFileContent } from '../src/utils'

describe('multi-line variables', () => {
	it('should correctly parse multi-line string variables', () => {
		const template = loadFileContent('./test/templates/multi-line-variables/string.ps.md')

		const result = parseTemplate(template)

		expect(result).to.equal('Hello,\nWorld!')
	})

	it('should correctly parse multi-line variables with slots', () => {
		const template = loadFileContent('./test/templates/multi-line-variables/with-slots.ps.md')

		const result = parseTemplate(template)

		expect(result).to.equal('Hello, World')
	})

	it('should correctly parse multi-line variables with parameters', () => {
		const template = loadFileContent('./test/templates/multi-line-variables/with-params.ps.md')

		const result = parseTemplate(template)

		expect(result).to.equal('Hello, World')
	})

	it('should correctly parse multi-line variables with default parameter', () => {
		const template = loadFileContent('./test/templates/multi-line-variables/with-default-param.ps.md')

		const result = parseTemplate(template)

		expect(result).to.equal('Hello World')
	})

	it('should throw an error when missing required parameter', () => {
		const template = loadFileContent('./test/templates/multi-line-variables/missing-required-param.ps.md')

		expect(() => parseTemplate(template)).to.throw('Required param for requiredParams not found: b')
	})
})
