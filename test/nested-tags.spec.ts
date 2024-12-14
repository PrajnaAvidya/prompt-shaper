import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { loadFileContent } from '../src/utils'

describe('nested tags', () => {
	it('should correctly parse nested variables and slots', async () => {
		const template = loadFileContent('./test/templates/nested-tags/nested-variables.ps.md')

		const result = await parseTemplate(template)

		expect(result).to.equal('Outer\n\nInner')
	})
})
