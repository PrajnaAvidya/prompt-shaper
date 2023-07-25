import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { ParserVariables, ValueType } from '../src/types'

// TODO make some templates to load

describe('slots', () => {
	it('should correctly render a basic slot', () => {
		const template = 'Hello, {{name}}!'
		const variables: ParserVariables = { name: { name: 'name', type: ValueType.string, value: 'John', params: [] } }

		const result = parseTemplate(template, variables)

		expect(result).to.equal('Hello, John!')
	})

	it('should correctly render a slot with parameters')

	it('should read slot parameters as correct types', () => {
		const template = 'Hello, {{name}}!'
		const variables: ParserVariables = { name: { name: 'name', type: ValueType.string, value: 'John', params: [] } }

		const result = parseTemplate(template, variables, { returnParserMatches: true })

		console.log(result)
	})

	it('should throw an error with malformed slot')

	it('should throw an error with invalid param')

	it('should throw an error with malformed params')
})
