import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { loadFileContent } from '../src/utils'

describe('single-line-variables', () => {
	it('should correctly parse single-line string variables', async () => {
		const template = loadFileContent('./test/templates/single-line-variables/string.ps.md')

		const result = await parseTemplate(template)

		expect(result).to.equal('Hello World')
	})
})
