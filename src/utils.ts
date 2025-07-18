import { readdirSync, readFileSync, statSync } from 'fs'
import { existsSync } from 'node:fs'
import { ParserVariables, ValueType } from './types'
import { join, extname } from 'path'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'
import sharp from 'sharp'

const fileCache: { [key: string]: string } = {}

// check if file/directory should be ignored
function shouldIgnore(name: string, ignorePatterns: string[]): boolean {
	if (!ignorePatterns.length) return false

	return ignorePatterns.some(pattern => {
		// exact match
		if (pattern === name) return true

		// simple glob pattern support
		if (pattern.includes('*')) {
			const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
			return regex.test(name)
		}

		return false
	})
}

// load the contents of file (cache results)
export const loadFileContent = (filePath: string): string => {
	if (filePath in fileCache) {
		return fileCache[filePath]
	}
	const contents = readFileSync(filePath, 'utf8').toString()
	fileCache[filePath] = contents
	return contents
}

// load directory files by extension
export const loadDirectoryContents = (
	directoryPath: string,
	extensions: string[],
	recursive: boolean = true,
	ignorePatterns: string[] = [],
): { [filePath: string]: string } => {
	const results: { [filePath: string]: string } = {}

	function readDir(dir: string, recursive: boolean) {
		const list = readdirSync(dir)
		list.forEach(file => {
			// check if ignored
			if (shouldIgnore(file, ignorePatterns)) {
				return
			}

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

		// parse html to readable text
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

// replace slot with rendered contents
export const replaceStringAtLocation = (str: string, replacement: string, start: number, end: number): string => {
	return str.substring(0, start) + replacement + str.substring(end)
}

// transform json to parser variables
export const transformJsonToVariables = (json: { [key: string]: string | number }): ParserVariables =>
	Object.entries(json).reduce((variables, [key, value]) => {
		variables[key] = {
			name: key,
			type: ValueType.string,
			value: value.toString(),
			params: [],
		}
		return variables
	}, {} as ParserVariables)

export const encodeLocalImageAsBase64 = async (path: string): Promise<{ data: string; format: string }> => {
	if (!existsSync(path)) throw new Error(`Image not found at path: ${path}`)

	// convert format if not accepted by openai
	const allowedFormats = ['jpeg', 'png', 'webp', 'gif']
	let image = sharp(path)
	const metadata = await image.metadata()
	let outputFormat = metadata.format
	if (!outputFormat || !allowedFormats.includes(outputFormat)) {
		outputFormat = 'jpeg' // default conversion format
		image = image.jpeg()
	}

	const buffer = await image.toBuffer()

	return {
		data: buffer.toString('base64'),
		format: outputFormat,
	}
}
