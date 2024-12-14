import { readdirSync, readFileSync, statSync } from 'fs'
import { ParserVariables, ValueType } from './types'
import { join, extname } from 'path'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

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

export const loadUrlReadableContents = async (url: string): Promise<string> => {
	try {
		if (!/^https?:\/\/.+$/.test(url)) {
			throw new Error('Invalid URL format')
		}

		const response = await fetch(url)
		if (!response.ok) {
			throw new Error(`Failed to fetch content: ${response.statusText}`)
		}
		const htmlContent = await response.text()

		// parse html into readable text
		const dom = new JSDOM(htmlContent, { url })
		const reader = new Readability(dom.window.document)
		const article = reader.parse()
		if (!article || !article.textContent) {
			console.error(`Failed to parse content: ${url}`)
			process.exit(1)
		}

		return article.textContent
	} catch (error: Error | unknown) {
		if (error instanceof Error) {
			console.error(`Error: ${error.message}`)
			process.exit(1)
		} else {
			console.error(`An unknown error occurred: ${error}`)
			process.exit(1)
		}
	}
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
