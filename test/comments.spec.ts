import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { ParserVariables, ValueType } from '../src/types'
import { loadFileContent } from '../src/utils'

describe('comments', () => {
	it('should remove single line comments', () => {
		const template = loadFileContent('./test/templates/comments/single-line.ps.md')
		const variables: ParserVariables = {
			name: { name: 'name', type: ValueType.string, value: 'World', params: [] },
		}

		const result = parseTemplate(template, variables)

		expect(result).to.equal('Hello, World!')
	})

	it('should remove inline comments', () => {
		const template = loadFileContent('./test/templates/comments/inline.ps.md')
		const variables: ParserVariables = {
			name: { name: 'name', type: ValueType.string, value: 'World', params: [] },
		}

		const result = parseTemplate(template, variables)

		expect(result).to.equal('Hello, World!')
	})

	it('should remove multiline comments', () => {
		const template = loadFileContent('./test/templates/comments/multiline.ps.md')
		const variables: ParserVariables = {
			name: { name: 'name', type: ValueType.string, value: 'World', params: [] },
		}

		const result = parseTemplate(template, variables)

		expect(result).to.equal('Hello, World!')
	})
})
