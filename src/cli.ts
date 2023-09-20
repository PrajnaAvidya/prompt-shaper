#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import { program } from 'commander'
import { loadFileContent, transformJsonToVariables } from './utils'
import { parseTemplate } from './parser'
import { ChatMessage, ParserVariables } from './types'
import { gpt } from './models/openai'
import * as readline from 'readline'

interface CLIOptions {
	debug?: boolean
	generate?: boolean
	interactive?: boolean
	isString?: boolean
	json?: string
	jsonFile?: string
	loadJson?: string
	loadText?: string
	model: string
	prompt: string
	save?: string
	saveJson?: string
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const prompt = (query: string) => new Promise(resolve => rl.question(query, resolve))

async function handler(input: string, options: CLIOptions) {
	if (options.loadJson) {
		// TODO load json and continue in interactive
		const conversation: ChatMessage[] = JSON.parse(fs.readFileSync(options.loadJson, 'utf8'))
	} else if (options.loadText) {
		// TODO load text and continue in interactive
	}

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
		console.log(parsed)

		if (options.generate || options.interactive || options.model !== 'gpt-4' || options.prompt !== 'You are a helpful assistant.') {
			const conversation: ChatMessage[] = [
				{
					role: 'system',
					content: options.prompt,
				},
				{
					role: 'user',
					content: parsed,
				},
			]

			if (options.interactive) {
				// interactive mode
				await interactiveModeLoop(conversation, options)
			} else {
				// send single request to openai
				await makeCompletionRequest(conversation, options)
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

	process.exit(0)
}

async function interactiveModeLoop(conversation: ChatMessage[], options: CLIOptions) {
	const running = true
	while (running) {
		await makeCompletionRequest(conversation, options)

		const response = (await prompt('Your response: ')) as string
		conversation.push({ role: 'user', content: response })
		if (options.saveJson) {
			saveConversationAsJson(conversation, options.saveJson)
		}
		if (options.save) {
			saveConversationAsText(conversation, options.save)
		}
	}
}

async function makeCompletionRequest(conversation: ChatMessage[], options: CLIOptions) {
	const result = await gpt(conversation, options.model)
	console.log('') // to prevent the stdout buffer from getting overwritten

	conversation.push({ role: 'assistant', content: result })
	if (options.saveJson) {
		saveConversationAsJson(conversation, options.saveJson)
	}
	if (options.save) {
		saveConversationAsText(conversation, options.save)
	}
}

function saveConversationAsJson(conversation: ChatMessage[], filePath: string) {
	fs.writeFileSync(filePath, JSON.stringify(conversation))
}

function saveConversationAsText(conversation: ChatMessage[], filePath: string) {
	const conversationText = conversation.map(m => `${m.role}\n\n${m.content}`).join('\n\n-----\n\n')

	fs.writeFileSync(filePath, conversationText)
}

program
	.description('Run the PromptShaper parser. Docs: https://github.com/PrajnaAvidya/prompt-shaper')
	.version((process.env.npm_package_version as string) || '', '-v, --version', 'Show the current version')
	.argument('<input>', 'Input template file path or string')
	.option('-d, --debug', 'Show debug messages')
	.option('-g, --generate', 'Send parsed template result to ChatGPT and return response (instead of the generated template)')
	.option('-is, --is-string', 'Indicate that the input is a string, not a file path')
	.option('-i, --interactive', 'Enable interactive mode (continue conversation in command line)')
	.option('-js, --json <jsonString>', 'Input JSON variables as string')
	.option('-jf, --json-file <filePath>', 'Input JSON variables as file path')
	.option('-lj, --load-json <filePath>', 'Load conversation from JSON file and continue in interactive mode')
	.option('-lt, --load-text <filePath>', 'Load conversation from text/markdown file and continue in interactive mode')
	.option('-m, --model <modelType>', 'What OpenAI model to use: gpt-4 (default), gpt-3.5-turbo-16k, etc', 'gpt-4')
	.option('-p, --prompt <promptString>', 'System prompt for LLM conversation', 'You are a helpful assistant.')
	.option('-s, --save <filePath>', 'Save text/markdown output to file path')
	.option('-sj, --save-json <filePath>', 'Save conversation as JSON file')
	.action(handler)

program.parse()
