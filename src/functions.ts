import { ParserParam } from './types'
import { loadFileContent } from './utils'

type PromptShaperFunction = (...args: ParserParam[]) => string | number

export const functions: Record<string, PromptShaperFunction> = {
	add: (a: ParserParam, b: ParserParam): number => {
		return (a.value as number) + (b.value as number)
	},
	subtract: (a: ParserParam, b: ParserParam): number => {
		return (a.value as number) - (b.value as number)
	},
	multiply: (a: ParserParam, b: ParserParam): number => {
		return (a.value as number) * (b.value as number)
	},
	divide: (a: ParserParam, b: ParserParam): number => {
		if ((b.value as number) == 0) {
			throw new Error('Division by zero')
		}
		return (a.value as number) / (b.value as number)
	},
	load: (filePath: ParserParam): string => {
		if (!filePath.value || typeof filePath.value !== 'string') {
			throw new Error('Invalid file path')
		}
		return `\n===\n\nFile: ${filePath.value}\n\n${loadFileContent(filePath.value) as string}\n\n===\n`
	},
}

// allow people to add their own functions
export const registerFunction = (name: string, func: PromptShaperFunction): void => {
	if (functions[name]) {
		throw new Error(`Function ${name} is already registered.`)
	}
	functions[name] = func
}
