#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import { program } from 'commander'
import { loadFileContent, transformJsonToVariables } from './utils'
import { parseTemplate } from './parser'
import { ParserVariables } from './types'
import { gpt } from './models/openai'

interface CLIOptions {
	debug?: boolean
	format: 'templateOrResponse' | 'templateAndResponse'
	generate?: boolean
	isString?: boolean
	json?: string
	jsonFile?: string
	model: string
	save?: string
}

async function handler(input: string, options: CLIOptions) {
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

		let response: string = ''
		if (options.format === 'templateAndResponse' || (options.format === 'templateOrResponse' && !options.generate)) {
			response = parsed
			console.log(response)
		}

		if (options.generate) {
			// send to openai
			const result = await gpt(parsed, options.model)
			console.log("") // to prevent the stdout buffer from getting overwritten
			if (options.save) {
				response = options.format === 'templateAndResponse' ? `${response}\n\n${result}` : result
				fs.writeFileSync(options.save, response)
			}
		} else {
			// just return the generated text
			if (options.save) {
				fs.writeFileSync(options.save, parsed)
			}
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
}

program
	.description('Run the PromptShaper parser. Docs: https://github.com/PrajnaAvidya/prompt-shaper')
	.version((process.env.npm_package_version as string) || '', '-v, --version', 'Show the current version')
	.argument('<input>', 'Input template file path or string')
	.option('-i, --is-string', 'Indicate that the input is a string, not a file path')
	.option('-d, --debug', 'Show debug messages')
	.option('-s, --save <string>', 'Path to save output')
	.option('-j, --json <string>', 'Input JSON variables as string')
	.option('-jf, --json-file <string>', 'Input JSON variables as file path')
	.option('-g, --generate', 'Send parsed template result to ChatGPT and return response (instead of the generated template)')
	.option('-m, --model <string>', 'What OpenAI model to use: gpt-4 (default), gpt-3.5-turbo-16k, etc', 'gpt-4')
	.option('-f, --format <string>', 'Set format of output: templateOrResponse (default), templateAndResponse', 'templateOrResponse')
	.action(handler)

program.parse()
