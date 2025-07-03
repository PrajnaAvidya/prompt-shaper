import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { ParserContext } from '../src/types'
import sinon from 'sinon'
import { loadDirectoryContents } from '../src/utils'

describe('loadDir function', () => {
	let loadDirectoryContentsStub: sinon.SinonStub

	beforeEach(() => {
		loadDirectoryContentsStub = sinon.stub()
		sinon.replace(require('../src/utils'), 'loadDirectoryContents', loadDirectoryContentsStub)
	})

	afterEach(() => {
		sinon.restore()
	})

	it('should load directory contents with default extensions', async () => {
		loadDirectoryContentsStub.returns({
			'test/file1.js': 'console.log("file1");',
			'test/file2.ts': 'console.log("file2");'
		})

		const template = '{{loadDir("test/directory")}}'
		const context: ParserContext = {
			variables: {},
			options: { fileExtensions: 'js,ts' },
			attachments: []
		}

		const result = await parseTemplate(template, context)

		expect(loadDirectoryContentsStub.calledOnce).to.be.true
		expect(loadDirectoryContentsStub.calledWith('test/directory', ['.js', '.ts'])).to.be.true
		
		expect(result).to.include('File: test/file1.js')
		expect(result).to.include('```js\nconsole.log("file1");')
		expect(result).to.include('File: test/file2.ts')
		expect(result).to.include('```ts\nconsole.log("file2");')
	})

	it('should handle directory parameter without leading dot in extensions', async () => {
		loadDirectoryContentsStub.returns({
			'src/main.py': 'print("hello")'
		})

		const template = '{{loadDir("src")}}'
		const context: ParserContext = {
			variables: {},
			options: { fileExtensions: 'py,txt' }, // no leading dots
			attachments: []
		}

		await parseTemplate(template, context)

		expect(loadDirectoryContentsStub.calledWith('src', ['.py', '.txt'])).to.be.true
	})

	it('should handle extensions that already have leading dots', async () => {
		loadDirectoryContentsStub.returns({
			'docs/readme.md': '# Title'
		})

		const template = '{{loadDir("docs")}}'
		const context: ParserContext = {
			variables: {},
			options: { fileExtensions: '.md,.txt' }, // with leading dots
			attachments: []
		}

		await parseTemplate(template, context)

		expect(loadDirectoryContentsStub.calledWith('docs', ['.md', '.txt'])).to.be.true
	})

	it('should handle mixed extension formats', async () => {
		loadDirectoryContentsStub.returns({})

		const template = '{{loadDir("mixed")}}'
		const context: ParserContext = {
			variables: {},
			options: { fileExtensions: '.js,py,.ts,md' }, // mixed formats
			attachments: []
		}

		await parseTemplate(template, context)

		expect(loadDirectoryContentsStub.calledWith('mixed', ['.js', '.py', '.ts', '.md'])).to.be.true
	})

	it('should handle empty fileExtensions option', async () => {
		loadDirectoryContentsStub.returns({})

		const template = '{{loadDir("empty")}}'
		const context: ParserContext = {
			variables: {},
			options: { fileExtensions: '' },
			attachments: []
		}

		await parseTemplate(template, context)

		expect(loadDirectoryContentsStub.calledWith('empty', [''])).to.be.true
	})

	it('should handle missing fileExtensions option', async () => {
		loadDirectoryContentsStub.returns({})

		const template = '{{loadDir("missing")}}'
		const context: ParserContext = {
			variables: {},
			options: {}, // no fileExtensions
			attachments: []
		}

		await parseTemplate(template, context)

		expect(loadDirectoryContentsStub.calledWith('missing', [''])).to.be.true
	})

	it('should handle whitespace in extensions', async () => {
		loadDirectoryContentsStub.returns({})

		const template = '{{loadDir("whitespace")}}'
		const context: ParserContext = {
			variables: {},
			options: { fileExtensions: ' js , ts , py ' }, // with whitespace
			attachments: []
		}

		await parseTemplate(template, context)

		expect(loadDirectoryContentsStub.calledWith('whitespace', ['.js', '.ts', '.py'])).to.be.true
	})

	it('should format output correctly for multiple files', async () => {
		loadDirectoryContentsStub.returns({
			'src/index.js': 'console.log("index");',
			'src/utils.ts': 'export const util = () => {};',
			'docs/README.md': '# Project'
		})

		const template = '{{loadDir("src")}}'
		const context: ParserContext = {
			variables: {},
			options: { fileExtensions: 'js,ts,md' },
			attachments: []
		}

		const result = await parseTemplate(template, context)

		// Check that all files are included with proper formatting
		expect(result).to.include('File: src/index.js\n```js\nconsole.log("index");\n```')
		expect(result).to.include('File: src/utils.ts\n```ts\nexport const util = () => {};\n```')
		expect(result).to.include('File: docs/README.md\n```md\n# Project\n```')
	})

	it('should handle empty directory result', async () => {
		loadDirectoryContentsStub.returns({})

		const template = '{{loadDir("empty")}}'
		const context: ParserContext = {
			variables: {},
			options: { fileExtensions: 'js,ts' },
			attachments: []
		}

		const result = await parseTemplate(template, context)

		expect(result).to.equal('')
	})

	it('should throw error for invalid directory path parameter', async () => {
		const template = '{{loadDir()}}'
		
		try {
			await parseTemplate(template)
			throw new Error('Expected function to throw, but it did not')
		} catch (error) {
			expect((error as Error).message).to.include('Invalid directory path')
		}
	})

	it('should throw error for non-string directory path', async () => {
		// This would require modifying the template parser to allow non-string params
		// For now, we test the validation logic indirectly
		const template = '{{loadDir("")}}'
		
		try {
			await parseTemplate(template)
			throw new Error('Expected function to throw, but it did not')
		} catch (error) {
			expect((error as Error).message).to.include('Invalid directory path')
		}
	})

	it('should handle files without extensions correctly', async () => {
		loadDirectoryContentsStub.returns({
			'scripts/build': '#!/bin/bash\necho "building"',
			'config/settings': 'key=value'
		})

		const template = '{{loadDir("scripts")}}'
		const context: ParserContext = {
			variables: {},
			options: { fileExtensions: 'sh,conf' },
			attachments: []
		}

		const result = await parseTemplate(template)

		// Files without extensions should still be formatted properly
		expect(result).to.include('File: scripts/build\n```\n#!/bin/bash\necho "building"\n```')
		expect(result).to.include('File: config/settings\n```\nkey=value\n```')
	})
})