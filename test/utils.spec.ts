import { expect } from 'chai'
import { loadFileContent, replaceStringAtLocation, transformJsonToVariables } from '../src/utils'
import { join } from 'path'
import sinon from 'sinon'
import { ParserVariables, ValueType } from '../src/types'

const fs = require('fs')

describe('loadFileContent', () => {
	it('loads file content and uses cached', () => {
		const readFileSyncStub = sinon.stub(fs, 'readFileSync')

		const filePath = join(__dirname, 'test.txt')
		const fileContent = 'This is a test file'
		readFileSyncStub.returns(fileContent)

		const content1 = loadFileContent(filePath)
		// load again to make sure cache is being hit
		const content2 = loadFileContent(filePath)

		expect(content1).to.equal(content2)
		expect(readFileSyncStub.calledOnce).to.be.true
		expect(content1).to.equal(fileContent)
		expect(readFileSyncStub.calledWith(filePath, 'utf8')).to.be.true

		readFileSyncStub.restore()
	})
})

describe('replaceStringAtLocation', () => {
	it('replaces string at location', () => {
		const str = 'Hello, World!'
		const replacement = 'everyone'
		const start = 7
		const end = 12

		const result = replaceStringAtLocation(str, replacement, start, end)

		expect(result).to.equal('Hello, everyone!')
	})
})

describe('transformJsonToVariables', () => {
	it('should transform a JSON object to a ParserVariables object', () => {
		const json = { var1: 'hello', var2: 42 }
		const expected: ParserVariables = {
			var1: {
				name: 'var1',
				type: ValueType.string,
				value: 'hello',
				params: [],
			},
			var2: {
				name: 'var2',
				type: ValueType.number,
				value: 42,
				params: [],
			},
		}
		const result = transformJsonToVariables(json)
		expect(result).to.deep.equal(expected)
	})
})
