import { assert, expect } from 'chai'
import { parseTemplate } from '../src/parser'
import { loadFileContent } from '../src/utils'
import sinon from 'sinon'

describe('functions', () => {
	it('should correctly evaluate load function', async () => {
		const template = loadFileContent('./test/templates/functions/load.ps.md')
		const result = await parseTemplate(template)

		const expectedOutput = `File: test/templates/functions/load-content.ps.md\n\`\`\`md\n${loadFileContent(
			'./test/templates/functions/load-content.ps.md',
		)}\n\`\`\``
		expect(result).to.equal(expectedOutput)
	})

	it('should throw error with invalid load param', async () => {
		const template = loadFileContent('./test/templates/functions/load-broken.ps.md')

		try {
			await parseTemplate(template)
			throw new Error('Expected function to throw, but it did not')
		} catch (err: Error | unknown) {
			assert(err instanceof Error)
			expect(err.message).to.equal('Invalid file path')
		}
	})

	it('should correctly evaluate loadUrl function', async () => {
		const template = loadFileContent('./test/templates/functions/loadUrl.ps.md')

		// Mock the fetch function to avoid making external HTTP requests
		const fetchStub = sinon.stub(global as never, 'fetch').resolves({
			ok: true,
			text: () => Promise.resolve('<html><body><h1>Test Page</h1><p>This is a test content.</p></body></html>'),
		})

		const result = await parseTemplate(template)

		expect(result.trim()).to.contain('URL: www.example.com')
		expect(result.trim()).to.contain('Test Page')

		fetchStub.restore()
	})

	it('should throw error with invalid loadUrl param', async () => {
		const template = loadFileContent('./test/templates/functions/loadUrl-broken.ps.md')

		try {
			await parseTemplate(template)
			throw new Error('Expected function to throw, but it did not')
		} catch (err: Error | unknown) {
			assert(err instanceof Error)
			expect(err.message).to.equal('Invalid URL')
		}
	})
})
