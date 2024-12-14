import { assert, expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { loadFileContent } from '../src/utils'

describe('multi-line variables', async () => {
	it('should correctly parse multi-line string variables', async () => {
		const template = loadFileContent('./test/templates/multi-line-variables/string.ps.md')

		const result = await parseTemplate(template)

		expect(result).to.equal('Hello,\nWorld!')
	})

	it('should correctly parse multi-line variables with slots', async () => {
		const template = loadFileContent('./test/templates/multi-line-variables/with-slots.ps.md')

		const result = await parseTemplate(template)

		expect(result).to.equal('Hello, World')
	})

	it('should correctly parse multi-line variables with parameters', async () => {
		const template = loadFileContent('./test/templates/multi-line-variables/with-params.ps.md')

		const result = await parseTemplate(template)

		expect(result).to.equal('Hello, World')
	})

	it('should correctly parse multi-line variables with default parameter', async () => {
		const template = loadFileContent('./test/templates/multi-line-variables/with-default-param.ps.md')

		const result = await parseTemplate(template)

		expect(result).to.equal('Hello World')
	})

	it('should throw an error when missing required parameter', async () => {
		const template = loadFileContent('./test/templates/multi-line-variables/missing-required-param.ps.md')

		try {
			await parseTemplate(template)
			throw new Error('Expected function to throw, but it did not')
		} catch (err: Error | unknown) {
			assert(err instanceof Error)
			expect(err.message).to.equal('Required param for requiredParams not found: b')
		}
	})
})
