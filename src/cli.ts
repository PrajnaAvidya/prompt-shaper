#!/usr/bin/env node

import { program } from 'commander'
import { loadFileContent } from './utils'
import { parseTemplate } from './parser'
import { ParserOptions } from './types'

program
	.description('Run the PromptShape parser CLI')
	.argument('<string>', 'Input template path')
	.option('-d, --debug', 'show debug messages')
	.action((inputPath, options) => {
		const parserOptions: ParserOptions = {}
		parserOptions.showDebugMessages = options.debug

		const template = loadFileContent(inputPath)
		const parsed = parseTemplate(template, options)
		console.log(parsed)
	})

program.parse()
