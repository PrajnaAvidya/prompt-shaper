import { expect } from 'chai'
import sinon from 'sinon'
import { parseTemplate } from '../src/parser'
import { ParserContext } from '../src/types'

describe('img function', () => {
	let encodeLocalImageStub: sinon.SinonStub
	let fetchStub: sinon.SinonStub

	beforeEach(() => {
		fetchStub = sinon.stub(global, 'fetch')
		encodeLocalImageStub = sinon.stub().resolves({
			data: 'test_base64_data',
			format: 'png',
		})

		sinon.replace(require('../src/utils'), 'encodeLocalImageAsBase64', encodeLocalImageStub)
	})

	afterEach(() => {
		sinon.restore()
	})

	it('should correctly process a local image file', async () => {
		const template = 'Here is a local image: {{img("test_image.png")}}'

		const context: ParserContext = { variables: {}, options: {}, attachments: [] }

		encodeLocalImageStub.resolves({ data: 'test_base64_data', format: 'png' })

		const result = await parseTemplate(template, context)

		expect(result).to.contain('[image added to prompt]')
		expect(encodeLocalImageStub.calledOnceWith('test_image.png')).to.be.true

		expect(context.attachments).to.deep.equal([
			{
				type: 'image_url',
				image_url: {
					url: 'data:image/png;base64,test_base64_data',
				},
			},
		])
	})

	it('should correctly process an external image URL', async () => {
		const template = 'Here is an external image: {{img("https://example.com/image.jpg")}}'

		const context: ParserContext = { variables: {}, options: {}, attachments: [] }

		const mockResponse = {
			ok: true,
			arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
		}

		fetchStub.resolves(mockResponse as never)

		const result = await parseTemplate(template, context)

		expect(result).to.contain('[image added to prompt]')
		expect(context.attachments).to.deep.equal([
			{
				type: 'image_url',
				image_url: {
					url: 'https://example.com/image.jpg',
				},
			},
		])
	})

	it('should throw an error for invalid parameter types', async () => {
		const template = 'Invalid usage: {{img(123)}}'
		const context: ParserContext = { variables: {}, options: {}, attachments: [] }

		try {
			await parseTemplate(template, context)
			throw new Error('Test should have thrown but did not')
		} catch (err: Error | unknown) {
			expect((err as Error).message).to.equal('img() expects a string parameter.')
		}
	})

	it('should handle errors from local file encoding gracefully', async () => {
		const template = 'Failed local image load: {{img("bad_image.png")}}'
		const context: ParserContext = { variables: {}, options: {}, attachments: [] }

		encodeLocalImageStub.rejects(new Error('Failed to load local file'))

		try {
			await parseTemplate(template, context)
			throw new Error('Test should have thrown but did not')
		} catch (err: Error | unknown) {
			expect((err as Error).message).to.equal('Failed to load local file')
		}
	})
})
