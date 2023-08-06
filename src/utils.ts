import { readFileSync } from 'fs'
import { ExpressionType, ParserSection, ParserVariables, ValueType } from './types'
import { evaluateFunction } from './functions'

const fileCache: { [key: string]: string } = {}
export const loadFileContent = (filePath: string): string => {
	if (filePath in fileCache) {
		return fileCache[filePath]
	}
	const contents = readFileSync(filePath, 'utf8').toString()
	fileCache[filePath] = contents
	return contents
}

export const replaceStringAtLocation = (str: string, replacement: string | number, start: number, end: number): string => {
	return str.substring(0, start) + replacement + str.substring(end)
}

export const transformJsonToVariables = (json: { [key: string]: string | number }): ParserVariables =>
	Object.entries(json).reduce((variables, [key, value]) => {
		variables[key] = {
			name: key,
			type: typeof value === 'number' ? ValueType.number : ValueType.string,
			value: value,
			params: [],
		}
		return variables
	}, {} as ParserVariables)

export const renderSlot = (slot: ParserSection, variables: ParserVariables): string | undefined => {
	// TODO operation (recursive/AST)

	switch (slot.expression!.type) {
		case ExpressionType.string:
		case ExpressionType.number:
			return slot.expression!.value as string
		case ExpressionType.variable:
			const variable = variables[slot.expression!.value as string]
			if (!variable) {
				return undefined
			}

			if (variable.type === ValueType.function) {
				return evaluateFunction(variable.value as string, variable.params!)
			} else {
				return variable.value as string
			}
		case ExpressionType.function:
			return evaluateFunction(slot.expression!.value as string, slot.expression!.params!)
		default:
			return undefined
	}
}
