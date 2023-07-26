#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import { program } from 'commander'
import { loadFileContent } from './utils'
import { parseTemplate } from './parser'

// TODO provide input inline
program
	.description('Run the PromptShape parser CLI')
	.argument('<filePath>', 'Input template file path')
	.option('-d, --debug', 'Show debug messages')
	.option('-s, --save <string>', 'Path to save output')
	.action((inputPath, options) => {
		// validate paths
		inputPath = path.resolve(inputPath)
		if (options.save) options.save = path.resolve(options.save)

		try {
			const parserOptions = { returnParserMatches: false, showDebugMessages: options.debug as boolean }

			const template = loadFileContent(inputPath)
			const parsed = parseTemplate(template, {}, parserOptions)
			if (options.save) {
				fs.writeFileSync(options.save, parsed)
			} else {
				console.log(parsed)
			}
		} catch (error: any) {
			if (error instanceof Error) {
				console.error(`Error: ${error.message}`)
			} else {
				console.error(`An unknown error occurred: ${error}`)
			}
		}
 })

program.parse()
