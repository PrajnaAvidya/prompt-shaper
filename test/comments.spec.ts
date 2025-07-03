import { expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { ParserContext, ParserVariables, ValueType } from '../src/types'
import { loadFileContent } from '../src/utils'
import { spawn } from 'child_process'

describe('comments', () => {
	it('should remove single line comments', async () => {
		const template = loadFileContent('./test/templates/comments/single-line.ps.md')
		const variables: ParserVariables = {
			name: { name: 'name', type: ValueType.string, value: 'World', params: [] },
		}
		const parserContext: ParserContext = {
			variables,
			options: {},
			attachments: [],
		}

		const result = await parseTemplate(template, parserContext)

		expect(result).to.equal('Hello, World!')
	})

	it('should remove inline comments', async () => {
		const template = loadFileContent('./test/templates/comments/inline.ps.md')
		const variables: ParserVariables = {
			name: { name: 'name', type: ValueType.string, value: 'World', params: [] },
		}
		const parserContext: ParserContext = {
			variables,
			options: {},
			attachments: [],
		}

		const result = await parseTemplate(template, parserContext)

		expect(result).to.equal('Hello, World!')
	})

	it('should remove multiline comments', async () => {
		const template = loadFileContent('./test/templates/comments/multiline.ps.md')
		const variables: ParserVariables = {
			name: { name: 'name', type: ValueType.string, value: 'World', params: [] },
		}
		const parserContext: ParserContext = {
			variables,
			options: {},
			attachments: [],
		}

		const result = await parseTemplate(template, parserContext)

		expect(result).to.equal('Hello, World!')
	})

	// issue #50 tests
	it('should preserve comments in raw mode via CLI', done => {
		const testContent = `// This is a JavaScript comment
/* This is a multi-line
   comment that should be preserved */
const code = 1;
// Another comment`

		const child = spawn('npx', ['ts-node', 'src/cli.ts', '-r', '-is', testContent], {
			env: { ...process.env, PROMPT_SHAPER_TESTS: 'true' }
		})

		let stdout = ''
		child.stdout.on('data', data => {
			stdout += data.toString()
		})

		child.on('close', code => {
			if (code !== 0) {
				throw new Error(`CLI exited with code ${code}`)
			}
			// in raw mode, comments should be preserved
			expect(stdout).to.include('// This is a JavaScript comment')
			expect(stdout).to.include('/* This is a multi-line')
			expect(stdout).to.include('// Another comment')
			done()
		})
	})

	it('should remove comments when NOT in raw mode', async () => {
		const template = `// This is a comment
Hello, {{name}}!
/* Multi-line
   comment */`
		const variables: ParserVariables = {
			name: { name: 'name', type: ValueType.string, value: 'World', params: [] },
		}
		const parserContext: ParserContext = {
			variables,
			options: {},
			attachments: [],
		}

		const result = await parseTemplate(template, parserContext)

		// comments should be removed in normal mode
		expect(result).to.equal('Hello, World!')
		expect(result).to.not.include('//')
		expect(result).to.not.include('/*')
	})
})
