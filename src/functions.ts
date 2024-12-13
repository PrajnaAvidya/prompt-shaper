import { ParserOptions, ParserParam } from './types'
import { loadDirectoryContents, loadFileContent } from './utils'
import { extname } from 'path'

type PromptShaperFunction = (options: ParserOptions, ...args: ParserParam[]) => string | number

export const functions: Record<string, PromptShaperFunction> = {
	add: (_options: ParserOptions, a: ParserParam, b: ParserParam): number => {
		return (a.value as number) + (b.value as number)
	},
	subtract: (_options: ParserOptions, a: ParserParam, b: ParserParam): number => {
		return (a.value as number) - (b.value as number)
	},
	multiply: (_options: ParserOptions, a: ParserParam, b: ParserParam): number => {
		return (a.value as number) * (b.value as number)
	},
	divide: (_options: ParserOptions, a: ParserParam, b: ParserParam): number => {
		if ((b.value as number) == 0) {
			throw new Error('Division by zero')
		}
		return (a.value as number) / (b.value as number)
	},
	load: (_options: ParserOptions, filePath: ParserParam): string => {
		if (!filePath.value || typeof filePath.value !== 'string') {
			throw new Error('Invalid file path')
		}
		// get file extension for markdown
		const parts = filePath.value.split('.')
		const extension = parts.length > 1 ? `${parts.slice(-1)}` : ''

		return `\n\nFile: ${filePath.value}\n\`\`\`${extension}\n${loadFileContent(filePath.value) as string}\n\`\`\`\n\n`
	},
	loadDir: (options: ParserOptions, dirPathParam: ParserParam): string => {
		// validate params
		if (!dirPathParam || !dirPathParam.value || typeof dirPathParam.value !== 'string') {
			throw new Error('Invalid directory path');
		}
		const dirPath = dirPathParam.value as string;

		// get the extensions list from cli params
		const extensions = (options.fileExtensions || "").split(',').map(ext => ext.trim()).map(ext => (ext.startsWith('.') ? ext : `.${ext}`));

		const contents = loadDirectoryContents(dirPath, extensions);

		// format
		let result = '';
		for (const [filePath, content] of Object.entries(contents)) {
			const fileExt = extname(filePath).slice(1); // Remove leading dot for formatting
			result += `\n\nFile: ${filePath}\n\`\`\`${fileExt}\n${content}\n\`\`\`\n\n`;
		}

		return result;
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
		delete functions[name];
	}
}
