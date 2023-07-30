import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { loadFileContent } from '../src/utils'

describe('nested tags', () => {
	it('should correctly parse nested variables and slots', () => {
		const template = loadFileContent('./test/templates/nested-tags/nested-variables.ps.txt')

		const result = parseTemplate(template)

		expect(result).to.equal('Outer\n\nInner')
	})
})
