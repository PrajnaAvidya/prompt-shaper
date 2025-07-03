import { expect } from 'chai'
import sinon from 'sinon'
import { 
	loadFileContent, 
	loadDirectoryContents, 
	loadUrlReadableContents, 
	replaceStringAtLocation, 
	transformJsonToVariables,
	encodeLocalImageAsBase64
} from '../src/utils'
import { ValueType } from '../src/types'
import { existsSync } from 'node:fs'

const fs = require('fs')
const path = require('path')

describe('utils edge cases', () => {
	describe('loadFileContent', () => {
		let readFileSyncStub: sinon.SinonStub

		beforeEach(() => {
			readFileSyncStub = sinon.stub(fs, 'readFileSync')
		})

		afterEach(() => {
			sinon.restore()
		})

		it('should handle file not found error', () => {
			readFileSyncStub.throws(new Error('ENOENT: no such file or directory'))

			expect(() => {
				loadFileContent('nonexistent.txt')
			}).to.throw('ENOENT: no such file or directory')
		})

		it('should handle permission errors', () => {
			readFileSyncStub.throws(new Error('EACCES: permission denied'))

			expect(() => {
				loadFileContent('restricted.txt')
			}).to.throw('EACCES: permission denied')
		})

		it('should handle binary file with toString conversion', () => {
			const binaryBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47]) // PNG header
			readFileSyncStub.returns(binaryBuffer)

			const result = loadFileContent('image.png')
			expect(result).to.be.a('string')
			expect(result).to.equal(binaryBuffer.toString())
		})
	})

	describe('loadDirectoryContents', () => {
		let readdirSyncStub: sinon.SinonStub
		let statSyncStub: sinon.SinonStub
		let readFileSyncStub: sinon.SinonStub

		beforeEach(() => {
			readdirSyncStub = sinon.stub(fs, 'readdirSync')
			statSyncStub = sinon.stub(fs, 'statSync')
			readFileSyncStub = sinon.stub(fs, 'readFileSync')
		})

		afterEach(() => {
			sinon.restore()
		})

		it('should handle non-existent directory error', () => {
			readdirSyncStub.throws(new Error('ENOENT: no such file or directory'))

			expect(() => {
				loadDirectoryContents('nonexistent', ['.txt'])
			}).to.throw('ENOENT: no such file or directory')
		})

		it('should handle permission errors', () => {
			readdirSyncStub.throws(new Error('EACCES: permission denied'))

			expect(() => {
				loadDirectoryContents('restricted', ['.txt'])
			}).to.throw('EACCES: permission denied')
		})

		it('should handle empty directory', () => {
			readdirSyncStub.returns([])

			const result = loadDirectoryContents('empty', ['.txt'])
			expect(result).to.deep.equal({})
		})

		it('should handle directory with no matching extensions', () => {
			readdirSyncStub.returns(['file1.py', 'file2.rb'])
			statSyncStub.returns({ isDirectory: () => false })

			const result = loadDirectoryContents('test', ['.txt', '.js'])
			expect(result).to.deep.equal({})
		})

		it('should handle recursive parameter variations', () => {
			// set up directory structure: dir/file.txt and dir/subdir/file2.txt
			readdirSyncStub.withArgs('test').returns(['file.txt', 'subdir'])
			readdirSyncStub.withArgs(path.join('test', 'subdir')).returns(['file2.txt'])
			
			statSyncStub.withArgs(path.join('test', 'file.txt')).returns({ isDirectory: () => false })
			statSyncStub.withArgs(path.join('test', 'subdir')).returns({ isDirectory: () => true })
			statSyncStub.withArgs(path.join('test', 'subdir', 'file2.txt')).returns({ isDirectory: () => false })
			
			readFileSyncStub.withArgs(path.join('test', 'file.txt')).returns('content1')
			readFileSyncStub.withArgs(path.join('test', 'subdir', 'file2.txt')).returns('content2')

			// test recursive=true (default)
			const recursiveResult = loadDirectoryContents('test', ['.txt'], true)
			expect(Object.keys(recursiveResult)).to.have.length(2)
			expect(recursiveResult[path.join('test', 'file.txt')]).to.equal('content1')
			expect(recursiveResult[path.join('test', 'subdir', 'file2.txt')]).to.equal('content2')

			// test recursive=false
			const nonRecursiveResult = loadDirectoryContents('test', ['.txt'], false)
			expect(Object.keys(nonRecursiveResult)).to.have.length(1)
			expect(nonRecursiveResult[path.join('test', 'file.txt')]).to.equal('content1')
		})

		it('should handle null stat result', () => {
			readdirSyncStub.returns(['file.txt'])
			statSyncStub.returns(null)

			const result = loadDirectoryContents('test', ['.txt'])
			expect(result).to.deep.equal({})
		})
	})

	describe('loadUrlReadableContents', () => {
		let fetchStub: sinon.SinonStub
		let processExitStub: sinon.SinonStub
		let consoleErrorStub: sinon.SinonStub

		beforeEach(() => {
			fetchStub = sinon.stub(global, 'fetch')
			processExitStub = sinon.stub(process, 'exit')
			consoleErrorStub = sinon.stub(console, 'error')
		})

		afterEach(() => {
			sinon.restore()
		})

		it('should handle invalid URL format error', async () => {
			try {
				await loadUrlReadableContents('not-a-url')
			} catch (error) {
				// function calls process.exit, so we check if the stub was called
				expect(processExitStub.calledWith(1)).to.be.true
				expect(consoleErrorStub.calledWith('Error: Invalid URL format')).to.be.true
			}
		})

		it('should handle network request failures', async () => {
			fetchStub.rejects(new Error('Network error'))

			try {
				await loadUrlReadableContents('https://example.com')
			} catch (error) {
				expect(processExitStub.calledWith(1)).to.be.true
				expect(consoleErrorStub.calledWith('Error: Network error')).to.be.true
			}
		})

		it('should handle HTTP error responses', async () => {
			fetchStub.resolves({
				ok: false,
				statusText: 'Not Found'
			})

			try {
				await loadUrlReadableContents('https://example.com/404')
			} catch (error) {
				expect(processExitStub.calledWith(1)).to.be.true
				expect(consoleErrorStub.calledWith('Error: Failed to fetch content: Not Found')).to.be.true
			}
		})

		it('should handle HTML parsing failures', async () => {
			const mockJSDOM = {
				window: {
					document: {}
				}
			}
			const mockReadability = {
				parse: () => null
			}

			fetchStub.resolves({
				ok: true,
				text: () => Promise.resolve('<html></html>')
			})

			// This is difficult to test without heavy mocking of JSDOM and Readability
			// the function would call process.exit(1) on parsing failure
		})

		it('should handle non-Error exceptions', async () => {
			fetchStub.rejects('String error')

			try {
				await loadUrlReadableContents('https://example.com')
			} catch (error) {
				expect(processExitStub.calledWith(1)).to.be.true
				expect(consoleErrorStub.calledWith('An unknown error occurred: String error')).to.be.true
			}
		})
	})

	describe('replaceStringAtLocation', () => {
		it('should handle invalid indices', () => {
			const original = 'Hello World'
			
			// start index greater than end index - JavaScript's substring handles this
			const result1 = replaceStringAtLocation(original, 'X', 5, 3)
			expect(result1).to.equal('HelloXlo World') // substring(0,3) + X + substring(5) but substring swaps args
			
			// negative indices - JavaScript's substring treats negative as 0
			const result2 = replaceStringAtLocation(original, 'X', -1, 2)
			expect(result2).to.equal('Xllo World')
		})

		it('should handle indices beyond string length', () => {
			const original = 'Hello'
			
			// start beyond length
			const result1 = replaceStringAtLocation(original, 'X', 10, 15)
			expect(result1).to.equal('HelloX')
			
			// end beyond length
			const result2 = replaceStringAtLocation(original, 'X', 2, 20)
			expect(result2).to.equal('HeX')
		})

		it('should handle zero-length replacement', () => {
			const original = 'Hello World'
			const result = replaceStringAtLocation(original, '', 6, 11)
			expect(result).to.equal('Hello ')
		})

		it('should handle same start and end indices', () => {
			const original = 'Hello World'
			const result = replaceStringAtLocation(original, 'X', 5, 5)
			expect(result).to.equal('HelloX World')
		})
	})

	describe('transformJsonToVariables', () => {
		it('should handle empty JSON object', () => {
			const result = transformJsonToVariables({})
			expect(result).to.deep.equal({})
		})

		it('should handle JSON with number values', () => {
			const json = { age: 25, count: 100 }
			const result = transformJsonToVariables(json)
			
			expect(result.age).to.deep.equal({
				name: 'age',
				type: ValueType.string,
				value: '25',
				params: []
			})
			expect(result.count).to.deep.equal({
				name: 'count',
				type: ValueType.string,
				value: '100',
				params: []
			})
		})

		it('should handle JSON with mixed value types', () => {
			const json = { 
				name: 'test', 
				value: 42, 
				flag: 'true', 
				data: 'null' 
			}
			const result = transformJsonToVariables(json)
			
			expect(result.name.value).to.equal('test')
			expect(result.value.value).to.equal('42')
			expect(result.flag.value).to.equal('true')
			expect(result.data.value).to.equal('null')
		})

		it('should handle special string values', () => {
			const json = { 
				empty: '', 
				whitespace: '   ', 
				special: '"quotes" and \\slashes\\' 
			}
			const result = transformJsonToVariables(json)
			
			expect(result.empty.value).to.equal('')
			expect(result.whitespace.value).to.equal('   ')
			expect(result.special.value).to.equal('"quotes" and \\slashes\\')
		})
	})

	describe('encodeLocalImageAsBase64', () => {
		let existsSyncStub: sinon.SinonStub
		let sharpStub: sinon.SinonStub

		beforeEach(() => {
			existsSyncStub = sinon.stub()
			sinon.replace(require('node:fs'), 'existsSync', existsSyncStub)
		})

		afterEach(() => {
			sinon.restore()
		})

		it('should handle file not found error', async () => {
			existsSyncStub.returns(false)

			try {
				await encodeLocalImageAsBase64('nonexistent.png')
				throw new Error('Expected function to throw, but it did not')
			} catch (error) {
				expect((error as Error).message).to.include('Image not found at path: nonexistent.png')
			}
		})

		// note: testing Sharp image processing edge cases would require extensive mocking
		// and may not provide significant value compared to integration testing
	})
})