#!/usr/bin/env node

import * as fs from 'fs'
import { program } from 'commander'
import { loadFileContent } from './utils'
import { parseTemplate } from './parser'

program
	.description('Run the PromptShape parser CLI')
	.argument('<string>', 'Input template path')
	.option('-d, --debug', 'Show debug messages')
	.option('-s, --save <string>', 'Path to save output')
	.action((inputPath, options) => {
		const parserOptions = { returnParserMatches: false, showDebugMessages: options.debug as boolean }

		const template = loadFileContent(inputPath)
		const parsed = parseTemplate(template, {}, parserOptions)
		if (options.save) {
			fs.writeFileSync(options.save, parsed)
		} else {
			console.log(parsed)
		}
	})

program.parse()
