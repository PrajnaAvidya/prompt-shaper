import { readFileSync } from 'fs'
import { ParserVariables, ValueType } from './types'

const fileCache: { [key: string]: string } = {}

// load the contents of file (cache results)
export const loadFileContent = (filePath: string): string => {
	if (filePath in fileCache) {
		return fileCache[filePath]
	}
	const contents = readFileSync(filePath, 'utf8').toString()
	fileCache[filePath] = contents
	return contents
}

// used to replace a slot with its rendered contents
export const replaceStringAtLocation = (str: string, replacement: string | number, start: number, end: number): string => {
	return str.substring(0, start) + replacement + str.substring(end)
}

// transforms a json key->value array to parser variables
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
