import { expect } from 'chai'
import { loadDirectoryContents, loadFileContent, replaceStringAtLocation, startConversation, transformJsonToVariables } from '../src/utils'
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

describe('loadDirectoryContents', () => {
	it('should load all matching files from a directory and ignore non-matching files', () => {
		const readdirSyncStub = sinon.stub(fs, 'readdirSync')
		const readFileSyncStub = sinon.stub(fs, 'readFileSync')
		const statSyncStub = sinon.stub(fs, 'statSync')

		// mock directory contents
		readdirSyncStub.withArgs('/test-dir').returns(['file1.txt', 'file2.md', 'file3.js', 'file6.exe', 'subdir'])
		readdirSyncStub.withArgs('/test-dir/subdir').returns(['file4.txt', 'file5.js'])

		// mock file stats
		statSyncStub.callsFake(filePath => {
			if (filePath === '/test-dir/subdir') {
				return { isDirectory: () => true }
			} else {
				return { isDirectory: () => false }
			}
		})

		// mock file contents
		readFileSyncStub.callsFake(filePath => {
			if (filePath === '/test-dir/file1.txt') {
				return 'Content of file1.txt'
			} else if (filePath === '/test-dir/file2.md') {
				return 'Content of file2.md'
			} else if (filePath === '/test-dir/file3.js') {
				return 'Content of file3.js'
			} else if (filePath === '/test-dir/file6.exe') {
				return 'Content of file6.exe'
			} else if (filePath === '/test-dir/subdir/file4.txt') {
				return 'Content of file4.txt'
			} else if (filePath === '/test-dir/subdir/file5.js') {
				return 'Content of file5.js'
			} else {
				return ''
			}
		})

		const extensions = ['.txt', '.md']

		const result = loadDirectoryContents('/test-dir', extensions)

		expect(result).to.deep.equal({
			'/test-dir/file1.txt': 'Content of file1.txt',
			'/test-dir/file2.md': 'Content of file2.md',
			'/test-dir/subdir/file4.txt': 'Content of file4.txt',
		})

		// ensure red herring was not loaded
		expect(result).to.not.have.property('/test-dir/file6.exe')

		readdirSyncStub.restore()
		readFileSyncStub.restore()
		statSyncStub.restore()
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
				type: ValueType.string,
				value: '42',
				params: [],
			},
		}
		const result = transformJsonToVariables(json)
		expect(result).to.deep.equal(expected)
	})
})

describe('startConversation', () => {
	it('should use a developer role if model starts with "o1" or "o3"', () => {
		const conversation1 = startConversation('systemPromptText', 'developerPromptText', 'o1-model')
		expect(conversation1).to.deep.equal([
			{
				role: 'developer',
				content: [
					{
						type: 'text',
						text: 'developerPromptText',
					},
				],
			},
		])

		const conversation2 = startConversation('systemPromptText', 'developerPromptText', 'o3-model')
		expect(conversation2).to.deep.equal([
			{
				role: 'developer',
				content: [
					{
						type: 'text',
						text: 'developerPromptText',
					},
				],
			},
		])
	})

	it('should use a system role if model does not start with "o1" or "o3"', () => {
		const conversation = startConversation('systemPromptText', 'developerPromptText', 'gpt-4')
		expect(conversation).to.deep.equal([
			{
				role: 'system',
				content: 'systemPromptText',
			},
		])
	})
})
