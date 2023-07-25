import { expect } from 'chai'
import { loadFileContent, replaceStringAtLocation } from '../src/utils'
import { join } from 'path'
import sinon from 'sinon'

const fs= require('fs')

describe('loadFileContent', () => {
	let readFileSyncStub: any

	beforeEach(() => {
		readFileSyncStub = sinon.stub(fs, 'readFileSync')
	})

	afterEach(() => {
		readFileSyncStub.restore()
	})

	it('loads file content and uses cached', () => {
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
