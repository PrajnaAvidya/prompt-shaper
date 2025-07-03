import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { ParserContext } from '../src/types'
import sinon from 'sinon'

describe('loadDir ignore patterns', () => {
	let loadDirectoryContentsStub: sinon.SinonStub

	beforeEach(() => {
		loadDirectoryContentsStub = sinon.stub()
		sinon.replace(require('../src/utils'), 'loadDirectoryContents', loadDirectoryContentsStub)
	})

	afterEach(() => {
		sinon.restore()
	})

	describe('parameter-based ignore patterns', () => {
		it('should ignore exact directory names', async () => {
			loadDirectoryContentsStub.returns({
				'src/main.js': 'console.log("main");',
			})

			const template = '{{loadDir(".", "node_modules,.git")}}'
			const context: ParserContext = {
				variables: {},
				options: { fileExtensions: 'js' },
				attachments: [],
			}

			await parseTemplate(template, context)

			expect(loadDirectoryContentsStub.calledWith('.', ['.js'], true, ['node_modules', '.git'])).to.be.true
		})

		it('should ignore glob patterns', async () => {
			loadDirectoryContentsStub.returns({})

			const template = '{{loadDir("src", "*.log,temp*,.DS_Store")}}'
			const context: ParserContext = {
				variables: {},
				options: { fileExtensions: 'js,ts' },
				attachments: [],
			}

			await parseTemplate(template, context)

			expect(loadDirectoryContentsStub.calledWith('src', ['.js', '.ts'], true, ['*.log', 'temp*', '.DS_Store'])).to.be.true
		})

		it('should handle empty ignore patterns', async () => {
			loadDirectoryContentsStub.returns({})

			const template = '{{loadDir("src", "")}}'
			const context: ParserContext = {
				variables: {},
				options: { fileExtensions: 'js' },
				attachments: [],
			}

			await parseTemplate(template, context)

			expect(loadDirectoryContentsStub.calledWith('src', ['.js'], true, [])).to.be.true
		})

		it('should handle whitespace in ignore patterns', async () => {
			loadDirectoryContentsStub.returns({})

			const template = '{{loadDir("src", " node_modules , .git , dist ")}}'
			const context: ParserContext = {
				variables: {},
				options: { fileExtensions: 'js' },
				attachments: [],
			}

			await parseTemplate(template, context)

			expect(loadDirectoryContentsStub.calledWith('src', ['.js'], true, ['node_modules', '.git', 'dist'])).to.be.true
		})

		it('should filter out empty patterns', async () => {
			loadDirectoryContentsStub.returns({})

			const template = '{{loadDir("src", "node_modules,,,.git,")}}'
			const context: ParserContext = {
				variables: {},
				options: { fileExtensions: 'js' },
				attachments: [],
			}

			await parseTemplate(template, context)

			expect(loadDirectoryContentsStub.calledWith('src', ['.js'], true, ['node_modules', '.git'])).to.be.true
		})
	})

	describe('context-based ignore patterns', () => {
		it('should use ignorePatterns from context options when no parameter provided', async () => {
			loadDirectoryContentsStub.returns({})

			const template = '{{loadDir("src")}}'
			const context: ParserContext = {
				variables: {},
				options: {
					fileExtensions: 'js',
					ignorePatterns: 'node_modules,.git,dist',
				},
				attachments: [],
			}

			await parseTemplate(template, context)

			expect(loadDirectoryContentsStub.calledWith('src', ['.js'], true, ['node_modules', '.git', 'dist'])).to.be.true
		})

		it('should prioritize parameter ignore patterns over context options', async () => {
			loadDirectoryContentsStub.returns({})

			const template = '{{loadDir("src", "custom_ignore")}}'
			const context: ParserContext = {
				variables: {},
				options: {
					fileExtensions: 'js',
					ignorePatterns: 'node_modules,.git', // should be ignored
				},
				attachments: [],
			}

			await parseTemplate(template, context)

			expect(loadDirectoryContentsStub.calledWith('src', ['.js'], true, ['custom_ignore'])).to.be.true
		})

		it('should handle empty context ignorePatterns', async () => {
			loadDirectoryContentsStub.returns({})

			const template = '{{loadDir("src")}}'
			const context: ParserContext = {
				variables: {},
				options: {
					fileExtensions: 'js',
					ignorePatterns: '',
				},
				attachments: [],
			}

			await parseTemplate(template, context)

			expect(loadDirectoryContentsStub.calledWith('src', ['.js'], true, [])).to.be.true
		})
	})

	describe('integration with existing functionality', () => {
		it('should work with all loadDir features together', async () => {
			loadDirectoryContentsStub.returns({
				'src/index.ts': 'export const main = () => {};',
				'src/utils.js': 'export const helper = () => {};',
			})

			const template = '{{loadDir("src", "node_modules,*.test.js")}}'
			const context: ParserContext = {
				variables: {},
				options: { fileExtensions: 'js,ts' },
				attachments: [],
			}

			const result = await parseTemplate(template, context)

			expect(loadDirectoryContentsStub.calledWith('src', ['.js', '.ts'], true, ['node_modules', '*.test.js'])).to.be.true
			expect(result).to.include('File: src/index.ts')
			expect(result).to.include('File: src/utils.js')
		})
	})

	describe('error handling', () => {
		it('should handle non-string ignore patterns parameter', async () => {
			// this tests the validation logic indirectly since the parser
			// would normally ensure string parameters
			loadDirectoryContentsStub.returns({})

			const template = '{{loadDir("src")}}'
			const context: ParserContext = {
				variables: {},
				options: {
					fileExtensions: 'js',
					ignorePatterns: 123 as unknown as string, // invalid type for testing
				},
				attachments: [],
			}

			await parseTemplate(template, context)

			// should fall back to empty ignore patterns
			expect(loadDirectoryContentsStub.calledWith('src', ['.js'], true, [])).to.be.true
		})
	})
})
