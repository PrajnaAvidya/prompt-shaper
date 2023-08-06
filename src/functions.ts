import { ParserParam, PromptShaperFunction } from './types'
import { loadFileContent } from './utils'

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
		return loadFileContent(filePath.value as string)
	},
}

export const evaluateFunction = (functionName: string, params: ParserParam[]): string => {
	const func = functions[functionName]
	if (!func) {
		throw new Error(`Unknown function: ${functionName}`)
	}
	return func(...params) as string
}

// to allow people to add their own functions
export const registerFunction = (name: string, func: PromptShaperFunction): void => {
	if (functions[name]) {
		throw new Error(`Function ${name} is already registered.`)
	}
	functions[name] = func
}
