import { ParserContext, ParserParam } from './types'
import { encodeLocalImageAsBase64, loadDirectoryContents, loadFileContent, loadUrlReadableContents } from './utils'
import { extname } from 'path'

type PromptShaperFunction = (context: ParserContext, ...args: ParserParam[]) => Promise<string | number> | string | number

export const functions: Record<string, PromptShaperFunction> = {
	add: (_context: ParserContext, a: ParserParam, b: ParserParam): number => {
		return (a.value as number) + (b.value as number)
	},
	subtract: (_context: ParserContext, a: ParserParam, b: ParserParam): number => {
		return (a.value as number) - (b.value as number)
	},
	multiply: (_context: ParserContext, a: ParserParam, b: ParserParam): number => {
		return (a.value as number) * (b.value as number)
	},
	divide: (_context: ParserContext, a: ParserParam, b: ParserParam): number => {
		if ((b.value as number) == 0) {
			throw new Error('Division by zero')
		}
		return (a.value as number) / (b.value as number)
	},
	load: (_context: ParserContext, filePath: ParserParam): string => {
		if (!filePath.value || typeof filePath.value !== 'string') {
			throw new Error('Invalid file path')
		}
		// get file extension for markdown
		const parts = filePath.value.split('.')
		const extension = parts.length > 1 ? `${parts.slice(-1)}` : ''

		return `\n\nFile: ${filePath.value}\n\`\`\`${extension}\n${loadFileContent(filePath.value) as string}\n\`\`\`\n\n`
	},
	loadDir: (context: ParserContext, dirPathParam: ParserParam): string => {
		// validate params
		if (!dirPathParam || !dirPathParam.value || typeof dirPathParam.value !== 'string') {
			throw new Error('Invalid directory path')
		}
		const dirPath = dirPathParam.value as string

		// get the extensions list from cli params
		const extensions = (context.options.fileExtensions || '')
			.split(',')
			.map(ext => ext.trim())
			.map(ext => (ext.startsWith('.') ? ext : `.${ext}`))

		const contents = loadDirectoryContents(dirPath, extensions)

		// format
		let result = ''
		for (const [filePath, content] of Object.entries(contents)) {
			const fileExt = extname(filePath).slice(1) // Remove leading dot for formatting
			result += `\n\nFile: ${filePath}\n\`\`\`${fileExt}\n${content}\n\`\`\`\n\n`
		}

		return result
	},
	loadUrl: async (_context: ParserContext, urlParam: ParserParam): Promise<string> => {
		if (!urlParam.value || typeof urlParam.value !== 'string') {
			throw new Error('Invalid URL')
		}
		const url = urlParam.value as string

		const contents = await loadUrlReadableContents(url)
		const formattedUrl = url.replace('http://', '').replace('https://', '')

		return `\n\nURL: ${formattedUrl}\n\`\`\`${contents}\n\`\`\`\n\n`
	},
	img: async (context: ParserContext, source: ParserParam): Promise<string> => {
		let url: string
		if (typeof source.value !== 'string') throw new Error('img() expects a string parameter.')

		if (/^https?:\/\//.test(source.value)) {
			url = source.value // web url
		} else {
			const { data: base64, format } = await encodeLocalImageAsBase64(source.value)
			url = `data:image/${format};base64,${base64}`
		}

		context.attachments.push({
			type: 'image_url',
			image_url: { url },
		})

		return '[image added to prompt]'
	},
}

// allow people to register their own functions
export const registerFunction = (name: string, func: PromptShaperFunction): void => {
	if (functions[name]) {
		throw new Error(`Function ${name} is already registered.`)
	}
	functions[name] = func
}
export const unregisterFunction = (name: string): void => {
	if (functions[name]) {
		delete functions[name]
	}
}
