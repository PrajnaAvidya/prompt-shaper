#!/usr/bin/env node

import * as fs from 'fs'
import { GenericMessage } from './providers/base'
import * as path from 'path'
import { program } from 'commander'
import { loadFileContent, transformJsonToVariables } from './utils'
import { parseTemplate } from './parser'
import { ParserVariables, ResponseFormat, ReasoningEffort } from './types'
import { generateWithProvider, startConversationWithProvider } from './providers/factory'
import * as readline from 'readline'

interface CLIOptions {
	debug?: boolean
	disableLlm?: boolean
	extensions?: string
	ignorePatterns?: string
	generate?: boolean
	hidePrompt: boolean
	interactive?: boolean
	isString?: boolean
	json?: string
	jsonFile?: string
	loadJson?: string
	loadText?: string
	llm?: boolean
	model: string
	outputAssistant: boolean
	profile?: string
	systemPrompt: string
	raw?: boolean
	save?: string
	saveJson?: string
	responseFormat: ResponseFormat
	reasoningEffort: ReasoningEffort
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
	'.pegjs',
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
	'.tscn',
	'.tres',

	// config/data
	'.json',
	'.yaml',
	'.yml',
	'.xml',
	'.ini',
	'.toml',
	'.env',
]

// load profile options from JSON file
function loadProfileOptions(profilePath: string): Partial<CLIOptions> {
	try {
		const profileContent = fs.readFileSync(path.resolve(profilePath), 'utf8')
		const profileOptions = JSON.parse(profileContent)

		// validate that the profile doesn't contain keys that shouldn't be in profiles
		const excludedKeys = new Set(['profile']) // profile option shouldn't reference itself

		const invalidKeys = Object.keys(profileOptions).filter(key => excludedKeys.has(key))
		if (invalidKeys.length > 0) {
			console.warn(`Warning: Invalid profile options found: ${invalidKeys.join(', ')}`)
		}

		return profileOptions
	} catch (error) {
		if (error instanceof Error) {
			console.error(`Error loading profile from ${profilePath}: ${error.message}`)
		} else {
			console.error(`Error loading profile from ${profilePath}: ${error}`)
		}
		exitApp(1)
	}
}

const envVars =
	process.env.PROMPT_SHAPER_TESTS !== 'true'
		? {
				debug: process.env.PROMPT_SHAPER_DEBUG === 'true',
				extensions: process.env.PROMPT_SHAPER_FILE_EXTENSIONS || defaultFileExtensions.join(','),
				ignorePatterns: process.env.PROMPT_SHAPER_IGNORE_PATTERNS,
				generate: process.env.PROMPT_SHAPER_GENERATE === 'true',
				hidePrompt: process.env.PROMPT_SHAPER_HIDE_PROMPT === 'true',
				isString: process.env.PROMPT_SHAPER_IS_STRING === 'true',
				interactive: process.env.PROMPT_SHAPER_INTERACTIVE === 'true',
				json: process.env.PROMPT_SHAPER_JSON,
				jsonFile: process.env.PROMPT_SHAPER_JSON_FILE,
				loadJson: process.env.PROMPT_SHAPER_LOAD_JSON,
				loadText: process.env.PROMPT_SHAPER_LOAD_TEXT,
				model: process.env.PROMPT_SHAPER_MODEL,
				llm: process.env.PROMPT_SHAPER_NO_LLM !== 'true',
				outputAssistant: process.env.PROMPT_SHAPER_OUTPUT_ASSISTANT === 'true',
				profile: process.env.PROMPT_SHAPER_PROFILE,
				systemPrompt: process.env.PROMPT_SHAPER_SYSTEM_PROMPT,
				raw: process.env.PROMPT_SHAPER_RAW === 'true',
				save: process.env.PROMPT_SHAPER_SAVE,
				saveJson: process.env.PROMPT_SHAPER_SAVE_JSON,
				responseFormat: process.env.PROMPT_SHAPER_RESPONSE_FORMAT,
				reasoningEffort: process.env.PROMPT_SHAPER_REASONING_EFFORT,
		  }
		: {}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const prompt = (query: string) => new Promise(resolve => rl.question(query, resolve))

// centralized exit handler
function exitApp(code: number = 0): never {
	rl.close()
	process.exit(code)
}

async function handler(input: string, cliOptions: CLIOptions) {
	// implement priority system: CLI > profile > env vars
	let profileOptions: Partial<CLIOptions> = {}

	// determine which profile to load (CLI takes priority over env var)
	const profilePath = cliOptions.profile || envVars.profile
	if (profilePath) {
		if (cliOptions.profile && envVars.profile && cliOptions.profile !== envVars.profile) {
			console.warn(`Warning: Ignoring PROMPT_SHAPER_PROFILE environment variable. Using CLI profile: ${cliOptions.profile}`)
		}
		profileOptions = loadProfileOptions(profilePath)
	}

	// merge options in priority order: CLI > profile > env vars > defaults
	const options: CLIOptions = {
		debug: cliOptions.debug ?? profileOptions.debug ?? envVars.debug ?? false,
		extensions: cliOptions.extensions ?? profileOptions.extensions ?? envVars.extensions ?? defaultFileExtensions.join(','),
		ignorePatterns: cliOptions.ignorePatterns ?? profileOptions.ignorePatterns ?? envVars.ignorePatterns,
		generate: cliOptions.generate ?? profileOptions.generate ?? envVars.generate ?? false,
		hidePrompt: cliOptions.hidePrompt ?? profileOptions.hidePrompt ?? envVars.hidePrompt ?? false,
		interactive: cliOptions.interactive ?? profileOptions.interactive ?? envVars.interactive ?? false,
		isString: cliOptions.isString ?? profileOptions.isString ?? envVars.isString ?? false,
		json: cliOptions.json ?? profileOptions.json ?? envVars.json,
		jsonFile: cliOptions.jsonFile ?? profileOptions.jsonFile ?? envVars.jsonFile,
		loadJson: cliOptions.loadJson ?? profileOptions.loadJson ?? envVars.loadJson,
		loadText: cliOptions.loadText ?? profileOptions.loadText ?? envVars.loadText,
		llm: cliOptions.disableLlm ? false : (profileOptions.llm ?? envVars.llm ?? true),
		model: cliOptions.model ?? profileOptions.model ?? envVars.model ?? 'gpt-4o',
		outputAssistant: cliOptions.outputAssistant ?? profileOptions.outputAssistant ?? envVars.outputAssistant ?? false,
		profile: cliOptions.profile ?? profileOptions.profile ?? envVars.profile,
		systemPrompt: cliOptions.systemPrompt ?? profileOptions.systemPrompt ?? envVars.systemPrompt ?? 'You are a helpful assistant.',
		raw: cliOptions.raw ?? profileOptions.raw ?? envVars.raw ?? false,
		save: cliOptions.save ?? profileOptions.save ?? envVars.save,
		saveJson: cliOptions.saveJson ?? profileOptions.saveJson ?? envVars.saveJson,
		responseFormat: (cliOptions.responseFormat ?? profileOptions.responseFormat ?? envVars.responseFormat ?? 'text') as ResponseFormat,
		reasoningEffort: (cliOptions.reasoningEffort ?? profileOptions.reasoningEffort ?? envVars.reasoningEffort ?? 'high') as ReasoningEffort,
	}

	// convert llm flag to nollm for easier logic
	const noLlm = options.llm === false

	// check for conflicting options with disable-llm
	if (noLlm && (options.generate || options.loadJson || options.loadText)) {
		console.error('Error: --disable-llm cannot be used with interactive mode, generate, or conversation loading options')
		exitApp(1)
	}

	// check for --interactive flag specifically
	if (noLlm && options.interactive && !input) {
		console.error('Error: --disable-llm cannot be used with interactive mode, generate, or conversation loading options')
		exitApp(1)
	}

	if (options.loadJson) {
		// load json and continue interactive
		const conversation: GenericMessage[] = JSON.parse(fs.readFileSync(options.loadJson, 'utf8'))
		await startSavedConversation(conversation, options)

		exitApp(0)
	}

	if (options.loadText) {
		// load text and continue interactive
		const conversation = fs
			.readFileSync(options.loadText, 'utf8')
			.split('\n\n-----\n\n')
			.map(message => {
				const [role, ...content] = message.split('\n\n')
				return { role, content: content.join('\n\n') } as GenericMessage
			})
		await startSavedConversation(conversation, options)

		exitApp(0)
	}

	if (options.interactive && !input) {
		// start new conversation
		const conversation: GenericMessage[] = startConversationWithProvider(options.systemPrompt, options.model)
		await startSavedConversation(conversation, options)

		exitApp(0)
	}

	// all other options require an input
	if (!input) {
		console.error('Input value is required')
		exitApp(1)
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
			exitApp(1)
		}
	} else if (options.jsonFile) {
		try {
			const jsonFilePath = path.resolve(options.jsonFile)
			const jsonString = fs.readFileSync(jsonFilePath, 'utf8')
			variables = transformJsonToVariables(JSON.parse(jsonString))
		} catch (error) {
			console.error('Could not read JSON file:', error)
			exitApp(1)
		}
	}

	// run the parser
	try {
		const parserOptions = {
			returnParserMatches: false,
			showDebugMessages: options.debug as boolean,
			fileExtensions: options.extensions,
			ignorePatterns: options.ignorePatterns,
		}

		// parse template if not in raw mode
		const parserContext = { variables, options: parserOptions, attachments: [] }
		const parsed = options.raw ? template : await parseTemplate(template, parserContext)

		// check if user wants to send results to LLM (but not in raw mode or disable-llm mode)
		if (!options.raw && !noLlm && (options.generate || options.interactive)) {
			// show conversational formatting when using llm features
			if (!options.hidePrompt) {
				console.log(`user\n${parsed}\n-----`)
			}
			const conversation: GenericMessage[] = [
				...startConversationWithProvider(options.systemPrompt, options.model),
				{
					role: 'user',
					content: [{ type: 'text', text: parsed }, ...parserContext.attachments.reverse()],
				},
			]

			if (options.generate) {
				// send single request to openai
				await makeCompletionRequest(conversation, options)
			} else {
				// interactive mode
				await interactiveModeLoop(conversation, options, variables)
			}
		} else {
			// template-only mode: output parsed template directly
			if (!options.hidePrompt) {
				console.log(parsed)
			}
			if (options.save) {
				fs.writeFileSync(options.save, parsed)
			}
		}
	} catch (error: Error | unknown) {
		if (error instanceof Error) {
			console.error(`Error: ${error.message}`)
			exitApp(1)
		} else {
			console.error(`An unknown error occurred: ${error}`)
			exitApp(1)
		}
	}

	exitApp(0)
}

async function startSavedConversation(conversation: GenericMessage[], options: CLIOptions) {
	// show convo history to user
	for (const message of conversation) {
		console.log(`${message.role}\n${JSON.stringify(message.content)}\n-----`)
	}

	await interactiveModeLoop(conversation, options)
}

async function interactiveModeLoop(conversation: GenericMessage[], options: CLIOptions, variables?: ParserVariables) {
	let userTurn = false
	if (conversation.length === 0 || conversation[conversation.length - 1].role !== 'user') {
		userTurn = true
	}

	// runs until user exits
	const running = true
	while (running) {
		if (!userTurn) {
			await makeCompletionRequest(conversation, options)
			userTurn = true
		}

		// collect user response and then parse response if not in raw mode
		const response = (await prompt('Your response: ')) as string
		const parserContext = {
			variables: variables || {},
			options: { showDebugMessages: options.debug, fileExtensions: options.extensions },
			attachments: [],
		}
		const parsedResponse = options.raw ? response : await parseTemplate(response, parserContext)
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

async function makeCompletionRequest(conversation: GenericMessage[], options: CLIOptions) {
	console.log('assistant')
	const result = await generateWithProvider(conversation, options.model, options.responseFormat, options.reasoningEffort)
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

function saveConversationAsJson(conversation: GenericMessage[], options: CLIOptions) {
	const filteredConvo = options.outputAssistant ? conversation.filter(m => m.role === 'assistant') : conversation

	fs.writeFileSync(options.saveJson!, JSON.stringify(filteredConvo))
}

function saveConversationAsText(conversation: GenericMessage[], options: CLIOptions) {
	const filteredConvo = options.outputAssistant ? conversation.filter(m => m.role === 'assistant') : conversation
	const conversationText = filteredConvo.map(m => (options.outputAssistant ? m.content : `${m.role}\n\n${m.content}`)).join('\n\n-----\n\n')

	fs.writeFileSync(options.save!, conversationText)
}

program
	.description('Run the PromptShaper parser. Docs: https://github.com/PrajnaAvidya/prompt-shaper')
	.argument('[input]', 'Input template file path or string')
	.option('-d, --debug', 'Show debug messages')
	.option(
		'-e, --extensions <extensions>',
		'What file extensions to include when loading a directory, list separated by commas (see cli.ts for default file extensions)',
	)
	.option('--ignore-patterns <patterns>', 'Comma-separated patterns to ignore when loading directories (supports glob patterns like *.log, temp*)')
	.option('-g, --generate', 'Send parsed template result to ChatGPT and return response')
	.option('-h, --hide-prompt', 'Hide the initial prompt in the console')
	.option('-is, --is-string', 'Indicate that the input is a string, not a file path')
	.option('-i, --interactive', 'Enable interactive mode')
	.option('-js, --json <jsonString>', 'Input JSON variables as string')
	.option('-jf, --json-file <filePath>', 'Input JSON variables as file path')
	.option('-lj, --load-json <filePath>', 'Load conversation from JSON file and continue in interactive mode')
	.option('-lt, --load-text <filePath>', 'Load conversation from text/markdown file and continue in interactive mode')
	.option('-m, --model <modelType>', 'OpenAI model to use')
	.option('--disable-llm', 'Disable all LLM calls and interactive mode (template processing only)')
	.option('-oa --output-assistant', 'Save gpt output only to text/JSON (filters out prompt & user responses)')
	.option('-p, --profile <filePath>', 'Load CLI options from JSON profile file')
	.option('-sp, --system-prompt <promptString>', 'System prompt for LLM conversation')
	.option('-re, --reasoning-effort <effort>', 'Reasoning effort (low/medium/high) for o1/o3 models')
	.option('-rf, --response-format <format>', 'Response format (text/json_object)')
	.option('-r, --raw', "Raw mode (don't parse any Prompt Shaper tags)")
	.option('-s, --save <filePath>', 'Save output to file path')
	.option('-sj, --save-json <filePath>', 'Save conversation as JSON file')
	.action(handler)

program.parse()
