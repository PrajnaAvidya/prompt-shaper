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
	extensions?: string
	generate?: boolean
	interactive?: boolean
	isString?: boolean
	json?: string
	jsonFile?: string
	loadJson?: string
	loadText?: string
	model: string
	outputAssistant: boolean
	prompt: string
	raw?: boolean
	save?: string
	saveJson?: string
}

const defaultFileExtensions = [
	// text
	'.txt',
	'.md',
	'.rst',
	'.html',
	'.htm',

	// common programming languages
	'.js',
	'.ts',
	'.py',
	'.rb',
	'.java',
	'.c',
	'.h',
	'.cpp',
	'.hpp',
	'.cc',
	'.cs',
	'.swift',
	'.kt',
	'.go',
	'.rs',
	'.php',
	'.pl',
	'.sh',
	'.bat',
	'.r',
	'.jl',

	// config/data
	'.json',
	'.yaml',
	'.yml',
	'.xml',
	'.ini',
	'.toml',
	'.env',
]

const envVars =
	process.env.PROMPT_SHAPER_TESTS !== 'true'
		? {
				debug: process.env.PROMPT_SHAPER_DEBUG === 'true',
				extensions: process.env.PROMPT_SHAPER_FILE_EXTENSIONS || defaultFileExtensions.join(','),
				generate: process.env.PROMPT_SHAPER_GENERATE === 'true',
				isString: process.env.PROMPT_SHAPER_IS_STRING === 'true',
				interactive: process.env.PROMPT_SHAPER_INTERACTIVE === 'true',
				json: process.env.PROMPT_SHAPER_JSON,
				jsonFile: process.env.PROMPT_SHAPER_JSON_FILE,
				loadJson: process.env.PROMPT_SHAPER_LOAD_JSON,
				loadText: process.env.PROMPT_SHAPER_LOAD_TEXT,
				model: process.env.PROMPT_SHAPER_MODEL,
				outputAssistant: process.env.PROMPT_SHAPER_OUTPUT_ASSISTANT === 'true',
				prompt: process.env.PROMPT_SHAPER_PROMPT,
				raw: process.env.PROMPT_SHAPER_RAW === 'true',
				save: process.env.PROMPT_SHAPER_SAVE,
				saveJson: process.env.PROMPT_SHAPER_SAVE_JSON,
		  }
		: {}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const prompt = (query: string) => new Promise(resolve => rl.question(query, resolve))

async function handler(input: string, options: CLIOptions) {
	if (options.loadJson) {
		// load json and continue in interactive
		const conversation: ChatMessage[] = JSON.parse(fs.readFileSync(options.loadJson, 'utf8'))
		await startSavedConversation(conversation, options)

		process.exit(0)
	}

	if (options.loadText) {
		// load text and continue in interactive
		const conversation = fs
			.readFileSync(options.loadText, 'utf8')
			.split('\n\n-----\n\n')
			.map(message => {
				const [role, ...content] = message.split('\n\n')
				return { role, content: content.join('\n\n') } as ChatMessage
			})
		await startSavedConversation(conversation, options)

		process.exit(0)
	}

	if ((options.interactive || options.raw) && !input) {
		// start new conversation in interactive
		const conversation: ChatMessage[] = startConversation(options.prompt, options.model)
		await startSavedConversation(conversation, options)

		process.exit(0)
	}

	// all other options require an input
	if (!input) {
		console.error('Input value is required')
		process.exit(1)
	}

	// handle input type
	let template: string
	if (options.isString) {
		template = input
	} else {
		template = loadFileContent(path.resolve(input))
	}

	// resolve save paths
	if (options.save) options.save = path.resolve(options.save)
	if (options.saveJson) options.saveJson = path.resolve(options.saveJson)

	// handle user provided vars
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

	// run the parser
	try {
		const parserOptions = { returnParserMatches: false, showDebugMessages: options.debug as boolean, fileExtensions: options.extensions }

		// parse template if not in raw mode
		const parsed = options.raw ? template : parseTemplate(template, variables, parserOptions)
		console.log(`user\n${[parsed]}\n-----`)

		// check if user wants to send results to LLM
		if (options.generate || options.interactive || options.model !== 'gpt-4o' || options.prompt !== 'You are a helpful assistant.') {
			const conversation: ChatMessage[] = [
				...startConversation(options.prompt, options.model),
				{
					role: 'user',
					content: parsed,
				},
			]

			if (options.interactive || options.raw) {
				// interactive mode
				await interactiveModeLoop(conversation, options, variables)
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

async function startSavedConversation(conversation: ChatMessage[], options: CLIOptions) {
	// show convo history to user
	for (const message of conversation) {
		console.log(`${message.role}\n${message.content}\n-----`)
	}

	await interactiveModeLoop(conversation, options)
}

async function interactiveModeLoop(conversation: ChatMessage[], options: CLIOptions, variables?: ParserVariables) {
	let userTurn = false
	if (conversation[conversation.length - 1].role !== 'user') {
		userTurn = true
	}

	// runs forever until user hits control+c
	const running = true
	while (running) {
		if (!userTurn) {
			await makeCompletionRequest(conversation, options)
			userTurn = true
		}

		// collect user response and then parse response if not in raw mode
		const response = (await prompt('Your response: ')) as string
		const parsedResponse = options.raw
			? response
			: parseTemplate(response, variables || {}, { showDebugMessages: options.debug, fileExtensions: options.extensions }, 0)
		if (parsedResponse !== response) {
			console.log(parsedResponse, '\n-----')
		} else {
			console.log('-----')
		}
		userTurn = false

		// update/save chat history
		conversation.push({ role: 'user', content: parsedResponse })
		if (options.saveJson) {
			saveConversationAsJson(conversation, options)
		}
		if (options.save) {
			saveConversationAsText(conversation, options)
		}
	}
}

async function makeCompletionRequest(conversation: ChatMessage[], options: CLIOptions) {
	console.log('assistant')
	const result = await gpt(conversation, options.model)
	console.log('\n-----')

	// update/save chat history
	conversation.push({ role: 'assistant', content: result })
	if (options.saveJson) {
		saveConversationAsJson(conversation, options)
	}
	if (options.save) {
		saveConversationAsText(conversation, options)
	}
}

function saveConversationAsJson(conversation: ChatMessage[], options: CLIOptions) {
	const filteredConvo = options.outputAssistant ? conversation.filter(m => m.role === 'assistant') : conversation

	fs.writeFileSync(options.saveJson!, JSON.stringify(filteredConvo))
}

function saveConversationAsText(conversation: ChatMessage[], options: CLIOptions) {
	const filteredConvo = options.outputAssistant ? conversation.filter(m => m.role === 'assistant') : conversation
	const conversationText = filteredConvo.map(m => `${m.role}\n\n${m.content}`).join('\n\n-----\n\n')

	fs.writeFileSync(options.save!, conversationText)
}

function startConversation(systemPrompt: string, model: string): ChatMessage[] {
	const conversation: ChatMessage[] = []
	if (!model.startsWith('o1-')) {
		conversation.push({
			role: 'system',
			content: systemPrompt,
		})
	}

	return conversation
}

program
	.description('Run the PromptShaper parser. Docs: https://github.com/PrajnaAvidya/prompt-shaper')
	.version((process.env.npm_package_version as string) || '', '-v, --version', 'Show the current version')
	.argument('[input]', 'Input template file path or string')
	.option('-d, --debug', 'Show debug messages', envVars.debug)
	.option(
		'-e, --extensions',
		'What file extensions to include when loading a directory, list separated by commas (see cli.ts for default file extensions)',
		envVars.extensions,
	)
	.option('-g, --generate', 'Send parsed template result to ChatGPT and return response', envVars.generate)
	.option('-is, --is-string', 'Indicate that the input is a string, not a file path', envVars.isString)
	.option('-i, --interactive', 'Enable interactive mode', envVars.interactive)
	.option('-js, --json <jsonString>', 'Input JSON variables as string', envVars.json)
	.option('-jf, --json-file <filePath>', 'Input JSON variables as file path', envVars.jsonFile)
	.option('-lj, --load-json <filePath>', 'Load conversation from JSON file and continue in interactive mode', envVars.loadJson)
	.option('-lt, --load-text <filePath>', 'Load conversation from text/markdown file and continue in interactive mode', envVars.loadText)
	.option('-m, --model <modelType>', 'OpenAI model to use', envVars.model || 'gpt-4o')
	.option('-oa --output-assistant', 'Save gpt output only to text/JSON (filters out user responses)', envVars.outputAssistant)
	.option('-p, --prompt <promptString>', 'System prompt for LLM conversation', envVars.prompt || 'You are a helpful assistant.')
	.option('-r, --raw', 'Raw interactive mode', envVars.raw)
	.option('-s, --save <filePath>', 'Save output to file path', envVars.save)
	.option('-sj, --save-json <filePath>', 'Save conversation as JSON file', envVars.saveJson)
	.action(handler)

program.parse()
