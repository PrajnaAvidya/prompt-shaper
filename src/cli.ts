#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import { program } from 'commander'
import { loadFileContent, transformJsonToVariables } from './utils'
import { parseTemplate } from './parser'
import { ParserVariables } from './types'

interface CLIOptions {
	isString?: boolean
	debug?: boolean
	save?: string
	json?: string
	jsonFile?: string
}

program
	.description('Run the PromptShaper parser. Docs: https://github.com/PrajnaAvidya/prompt-shaper')
	.version((process.env.npm_package_version as string) || '', '-v, --version', 'Show the current version')
	.argument('<input>', 'Input template file path or string')
	.option('-i, --is-string', 'Indicate that the input is a string, not a file path')
	.option('-d, --debug', 'Show debug messages')
	.option('-s, --save <string>', 'Path to save output')
	.option('-j, --json <string>', 'Input JSON variables as string')
	.option('-f, --json-file <string>', 'Input JSON variables as file path')
	.action((input: string, options: CLIOptions) => {
		// handle input type
		let template: string
		if (options.isString) {
			template = input
		} else {
			template = loadFileContent(path.resolve(input))
		}

		if (options.save) options.save = path.resolve(options.save)

		// handle json vars
		let variables: ParserVariables = {}
		if (options.json) {
			try {
				variables = transformJsonToVariables(JSON.parse(options.json))
			} catch (error) {
				console.error('Invalid JSON string provided:', error)
				process.exit(1)
			}
		} else if (options.jsonFile) {
			try {
				const jsonFilePath = path.resolve(options.jsonFile)
				const jsonString = fs.readFileSync(jsonFilePath, 'utf8')
				variables = transformJsonToVariables(JSON.parse(jsonString))
			} catch (error) {
				console.error('Could not read JSON file:', error)
				process.exit(1)
			}
		}

		try {
			const parserOptions = { returnParserMatches: false, showDebugMessages: options.debug as boolean }

			const parsed = parseTemplate(template, variables, parserOptions)
			if (options.save) {
				fs.writeFileSync(options.save, parsed)
			} else {
				console.log(parsed)
			}
		} catch (error: Error | unknown) {
			if (error instanceof Error) {
				console.error(`Error: ${error.message}`)
				process.exit(1)
			} else {
				console.error(`An unknown error occurred: ${error}`)
				process.exit(1)
			}
		}
	})

program.parse()
process.exit(0)
