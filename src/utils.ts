import { readdirSync, readFileSync, statSync } from 'fs'
import { ParserVariables, ValueType } from './types'
import { join, extname } from 'path'

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

// load a directory of files by extension, recursively if specified
export const loadDirectoryContents = (directoryPath: string, extensions: string[], recursive: boolean = true): { [filePath: string]: string } => {
	const results: { [filePath: string]: string } = {}

	function readDir(dir: string, recursive: boolean) {
		const list = readdirSync(dir)
		list.forEach(file => {
			const filePath = join(dir, file)
			const stat = statSync(filePath)
			if (stat) {
				if (recursive && stat.isDirectory()) {
					readDir(filePath, recursive)
				} else {
					const fileExt = extname(file)
					if (extensions.includes(fileExt)) {
						results[filePath] = loadFileContent(filePath)
					}
				}
			}
		})
	}

	readDir(directoryPath, recursive)

	return results
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
