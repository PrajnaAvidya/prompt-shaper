#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import { program } from 'commander'
import { loadFileContent } from './utils'
import { parseTemplate } from './parser'

program
	.description('Run the PromptShape parser CLI')
	.argument('<input>', 'Input template file path')
	.option('-i, --is-string', 'Indicate that the input is a string, not a file path')
	.option('-d, --debug', 'Show debug messages')
	.option('-s, --save <string>', 'Path to save output')
	.action((input, options) => {
		let template: string
		if (options.isString) {
			template = input
		} else {
			template = loadFileContent(path.resolve(input))
		}

		if (options.save) options.save = path.resolve(options.save)

		try {
			const parserOptions = { returnParserMatches: false, showDebugMessages: options.debug as boolean }

			const parsed = parseTemplate(template, {}, parserOptions)
			if (options.save) {
				fs.writeFileSync(options.save, parsed)
			} else {
				console.log(parsed)
			}
		} catch (error: Error | unknown) {
			if (error instanceof Error) {
				console.error(`Error: ${error.message}`)
			} else {
				console.error(`An unknown error occurred: ${error}`)
			}
		}
	})

program.parse()
