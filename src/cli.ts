#!/usr/bin/env node

import * as fs from 'fs'
import { GenericMessage } from './providers/base'
import * as path from 'path'
import { program } from 'commander'
import { loadFileContent, transformJsonToVariables } from './utils'
import { parseTemplate } from './parser'
import { ParserVariables, ResponseFormat, ReasoningEffort } from './types'
import { generateWithProvider, startConversationWithProvider, clearProviderCache, createProvider } from './providers/factory'
import * as readline from 'readline'

// helper function to check if model is OpenAI
function isOpenAIModel(model: string): boolean {
	return model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('o3')
}

// check if tiktoken is available
let tiktokenAvailable: boolean | null = null
function isTiktokenAvailable(): boolean {
	if (tiktokenAvailable === null) {
		try {
			require('tiktoken')
			tiktokenAvailable = true
		} catch (error) {
			tiktokenAvailable = false
		}
	}
	return tiktokenAvailable
}

// get encoding for model
function getEncodingForModel(model: string): string {
	if (model.startsWith('gpt-4') || model.startsWith('gpt-3.5')) {
		return 'cl100k_base'
	} else if (model.startsWith('o1') || model.startsWith('o3')) {
		return 'o200k_base'
	} else {
		return 'cl100k_base' // default fallback
	}
}

// helper function for token counting
function countTokens(text: string, model: string): number {
	if (isTiktokenAvailable()) {
		const tiktoken = require('tiktoken')
		const encoding = getEncodingForModel(model)
		const enc = tiktoken.get_encoding(encoding)
		const tokens = enc.encode(text)
		enc.free()
		return tokens.length
	} else {
		// fallback to heuristic if tiktoken is not available
		// roughly 4 characters per token for English text
		return Math.ceil(text.length / 4)
	}
}

// helper function to estimate conversation tokens
function estimateConversationTokens(
	conversation: GenericMessage[],
	model: string,
): { totalTokens: number; breakdown: Array<{ role: string; tokens: number; preview: string }> } {
	let totalTokens = 0
	const breakdown: Array<{ role: string; tokens: number; preview: string }> = []

	for (const message of conversation) {
		const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content)

		const tokens = countTokens(content, model)
		totalTokens += tokens

		// create preview (first 50 chars)
		const preview = content.length > 50 ? content.substring(0, 50) + '...' : content

		breakdown.push({
			role: message.role,
			tokens,
			preview,
		})
	}

	return { totalTokens, breakdown }
}

// helper function to clear previous assistant response from terminal
function clearPreviousResponse(responseText: string): void {
	if (process.env.PROMPT_SHAPER_TESTS) {
		return // skip during tests
	}

	// count lines in the response - need to account for terminal wrapping
	const terminalWidth = process.stdout.columns || 80
	const responseLines = responseText.split('\n')

	let totalLines = 1 // start with 1 for "assistant" header

	// count actual lines including wrapped lines
	for (const line of responseLines) {
		if (line.length === 0) {
			totalLines += 1 // empty line
		} else {
			totalLines += Math.ceil(line.length / terminalWidth)
		}
	}

	totalLines += 3 // +1 for empty line from "\n-----", +1 for "-----" footer itself, +1 adjustment

	// move cursor up and clear each line
	for (let i = 0; i < totalLines; i++) {
		process.stdout.write('\x1b[A') // move cursor up one line
		process.stdout.write('\x1b[K') // clear from cursor to end of line
	}
}

interface InteractiveCommand {
	name: string
	description: string
	handler: (conversation: GenericMessage[], options: CLIOptions, args: string[]) => Promise<boolean> | boolean
}

export const interactiveCommands: InteractiveCommand[] = [
	{
		name: 'help',
		description: 'Show this help message',
		handler: () => {
			console.log('Available commands:')
			interactiveCommands.forEach(cmd => {
				console.log(`  /${cmd.name.padEnd(10)} - ${cmd.description}`)
			})
			console.log('-----')
			return true // continue conversation
		},
	},
	{
		name: 'exit',
		description: 'Exit interactive mode',
		handler: () => {
			console.log('Goodbye!')
			exitApp(0)
		},
	},
	{
		name: 'rewind',
		description: 'Remove last user-assistant exchange',
		handler: (conversation, options) => {
			if (
				conversation.length >= 2 &&
				conversation[conversation.length - 1].role === 'assistant' &&
				conversation[conversation.length - 2].role === 'user'
			) {
				// remove the last user-assistant exchange
				conversation.pop() // remove assistant response
				conversation.pop() // remove user question
				console.log('Rewound last exchange. Conversation has been reverted.\n-----')

				// update saved files after rewind
				if (options.saveJson) {
					saveConversationAsJson(conversation, options)
				}
				if (options.save) {
					saveConversationAsText(conversation, options)
				}
			} else {
				console.log('Cannot rewind: no previous exchange to remove.\n-----')
			}
			return true // continue conversation
		},
	},
	{
		name: 'clear',
		description: 'Clear conversation history and start fresh',
		handler: (conversation, options) => {
			// clear screen (skip during tests)
			if (!process.env.PROMPT_SHAPER_TESTS) {
				console.clear()
			}

			// show previous session cost
			if (sessionCostTracker.apiCalls.length > 0) {
				console.log(`Previous session estimated cost: $${sessionCostTracker.totalCost.toFixed(6)}`)
				console.log(`(${sessionCostTracker.apiCalls.length} API calls made)`)
				console.log('')
			}

			// reset conversation to just system prompt if exists
			const systemMessage = conversation.find(msg => msg.role === 'system')
			conversation.length = 0 // clear array
			if (systemMessage) {
				conversation.push(systemMessage)
			}

			// reset cost tracker for new session
			sessionCostTracker = {
				totalCost: 0,
				apiCalls: [],
			}

			// update saved files with cleared conversation
			if (options.saveJson) {
				saveConversationAsJson(conversation, options)
			}
			if (options.save) {
				saveConversationAsText(conversation, options)
			}

			// show welcome message again
			console.log('Conversation cleared. Starting fresh!\n-----')
			showWelcomeMessage(options)
			return true // continue conversation
		},
	},
	{
		name: 'model',
		description: 'Switch to different model or show current model',
		handler: (conversation, options, args) => {
			if (args.length === 0) {
				// show current model
				const provider = getProviderFromModel(options.model)
				console.log(`Current model: ${options.model} (${provider})\n-----`)
			} else {
				// switch to new model
				const newModel = args[0]

				try {
					validateModelName(newModel)
					// test if provider can be created successfully
					createProvider(newModel, options.debug)
				} catch (error) {
					console.log(`Error: ${error instanceof Error ? error.message : error}`)
					console.log('-----')
					return true
				}

				const oldModel = options.model
				options.model = newModel

				// clear provider cache so next llm call uses correct provider
				clearProviderCache(options.debug)

				console.log(`Switched from ${oldModel} to ${newModel}\n-----`)
			}
			return true // continue conversation
		},
	},
	{
		name: 'retry',
		description: 'Retry the last request with a new response',
		handler: async (conversation, options) => {
			// find the last user message
			let lastUserIndex = -1
			for (let i = conversation.length - 1; i >= 0; i--) {
				if (conversation[i].role === 'user') {
					lastUserIndex = i
					break
				}
			}

			if (lastUserIndex === -1) {
				console.log('Cannot retry: no user message found in conversation.\n-----')
				return true
			}

			// find and clear the last assistant response from terminal
			let lastAssistantResponse = ''
			for (let i = conversation.length - 1; i > lastUserIndex; i--) {
				if (conversation[i].role === 'assistant') {
					lastAssistantResponse =
						typeof conversation[i].content === 'string' ? (conversation[i].content as string) : JSON.stringify(conversation[i].content)
					break
				}
			}

			// clear the previous response from terminal if it exists
			if (lastAssistantResponse) {
				clearPreviousResponse(lastAssistantResponse)
			}

			// remove any assistant messages after the last user message
			while (conversation.length > lastUserIndex + 1) {
				conversation.pop()
			}

			// get new response for the last user message
			await makeCompletionRequest(conversation, options)

			return true // continue conversation
		},
	},
	{
		name: 'tokens',
		description: 'Show token count for the current conversation',
		handler: (conversation, options) => {
			if (conversation.length === 0) {
				console.log('No messages in conversation to count.\n-----')
				return true
			}

			const { totalTokens, breakdown } = estimateConversationTokens(conversation, options.model)

			console.log(`Token count for current conversation (${options.model}):`)
			console.log(`Total tokens: ${totalTokens}`)
			console.log('')
			console.log('Breakdown by message:')

			breakdown.forEach((item, index) => {
				console.log(`${index + 1}. ${item.role}: ${item.tokens} tokens`)
				console.log(`   "${item.preview}"`)
			})

			// show encoding info
			if (isTiktokenAvailable()) {
				const encoding = getEncodingForModel(options.model)
				if (isOpenAIModel(options.model)) {
					console.log(`\nUsing ${encoding} encoding (tiktoken)`)
				} else {
					console.log(`\nUsing ${encoding} encoding (tiktoken) - approximate for ${options.model}`)
				}
			} else {
				console.log('\nUsing heuristic estimation (4 chars/token)')
				console.log('Install tiktoken for accurate counts: yarn add tiktoken')
			}

			console.log('-----')
			return true // continue conversation
		},
	},
	{
		name: 'cost',
		description: 'Show estimated cost for the current session',
		handler: () => {
			if (sessionCostTracker.apiCalls.length === 0) {
				console.log('No API calls made in this session yet.\n-----')
				return true
			}

			console.log('Estimated session cost breakdown:')
			console.log(`Total estimated cost: $${sessionCostTracker.totalCost.toFixed(6)}`)
			console.log('')
			console.log('API calls in this session:')

			sessionCostTracker.apiCalls.forEach((call, index) => {
				console.log(`${index + 1}. ${call.model}: $${call.cost.toFixed(6)}`)
				console.log(`   Input: ${call.inputTokens.toLocaleString()} tokens, Output: ${call.outputTokens.toLocaleString()} tokens`)
				console.log(`   Time: ${call.timestamp.toLocaleTimeString()}`)
			})

			console.log('')
			console.log('Note: Pricing based on July 2025 rates. Actual costs may vary.')
			console.log('-----')
			return true // continue conversation
		},
	},
]

interface CostTracker {
	totalCost: number
	apiCalls: Array<{
		model: string
		inputTokens: number
		outputTokens: number
		cost: number
		timestamp: Date
	}>
}

interface ModelPricing {
	inputTokensPerDollar: number // how many input tokens you get for $1
	outputTokensPerDollar: number // how many output tokens you get for $1
}

// current pricing data based on provider websites (updated July 2025)
const MODEL_PRICING: Record<string, ModelPricing> = {
	// openai models - exact pricing from platform.openai.com/docs/pricing
	'gpt-4.1': { inputTokensPerDollar: 500000, outputTokensPerDollar: 125000 }, // $2.00/$8.00 per 1M tokens
	'gpt-4.1-mini': { inputTokensPerDollar: 2500000, outputTokensPerDollar: 625000 }, // $0.40/$1.60 per 1M tokens
	'gpt-4.1-nano': { inputTokensPerDollar: 10000000, outputTokensPerDollar: 2500000 }, // $0.10/$0.40 per 1M tokens
	'gpt-4.5-preview': { inputTokensPerDollar: 13333, outputTokensPerDollar: 6667 }, // $75.00/$150.00 per 1M tokens
	'gpt-4o': { inputTokensPerDollar: 400000, outputTokensPerDollar: 100000 }, // $2.50/$10.00 per 1M tokens
	'gpt-4o-audio-preview': { inputTokensPerDollar: 400000, outputTokensPerDollar: 100000 }, // $2.50/$10.00 per 1M tokens
	'gpt-4o-realtime-preview': { inputTokensPerDollar: 200000, outputTokensPerDollar: 50000 }, // $5.00/$20.00 per 1M tokens
	'gpt-4o-mini': { inputTokensPerDollar: 6666667, outputTokensPerDollar: 1666667 }, // $0.15/$0.60 per 1M tokens
	'gpt-4o-mini-audio-preview': { inputTokensPerDollar: 6666667, outputTokensPerDollar: 1666667 }, // $0.15/$0.60 per 1M tokens
	'gpt-4o-mini-realtime-preview': { inputTokensPerDollar: 1666667, outputTokensPerDollar: 416667 }, // $0.60/$2.40 per 1M tokens
	'gpt-4o-search-preview': { inputTokensPerDollar: 400000, outputTokensPerDollar: 100000 }, // $2.50/$10.00 per 1M tokens
	'gpt-4o-mini-search-preview': { inputTokensPerDollar: 6666667, outputTokensPerDollar: 1666667 }, // $0.15/$0.60 per 1M tokens
	o1: { inputTokensPerDollar: 66667, outputTokensPerDollar: 16667 }, // $15.00/$60.00 per 1M tokens
	'o1-pro': { inputTokensPerDollar: 6667, outputTokensPerDollar: 1667 }, // $150.00/$600.00 per 1M tokens
	'o1-mini': { inputTokensPerDollar: 909091, outputTokensPerDollar: 227273 }, // $1.10/$4.40 per 1M tokens
	o3: { inputTokensPerDollar: 500000, outputTokensPerDollar: 125000 }, // $2.00/$8.00 per 1M tokens
	'o3-pro': { inputTokensPerDollar: 50000, outputTokensPerDollar: 12500 }, // $20.00/$80.00 per 1M tokens
	'o3-deep-research': { inputTokensPerDollar: 100000, outputTokensPerDollar: 25000 }, // $10.00/$40.00 per 1M tokens
	'o3-mini': { inputTokensPerDollar: 909091, outputTokensPerDollar: 227273 }, // $1.10/$4.40 per 1M tokens
	'o4-mini': { inputTokensPerDollar: 909091, outputTokensPerDollar: 227273 }, // $1.10/$4.40 per 1M tokens
	'o4-mini-deep-research': { inputTokensPerDollar: 500000, outputTokensPerDollar: 125000 }, // $2.00/$8.00 per 1M tokens
	'codex-mini-latest': { inputTokensPerDollar: 666667, outputTokensPerDollar: 166667 }, // $1.50/$6.00 per 1M tokens
	'computer-use-preview': { inputTokensPerDollar: 333333, outputTokensPerDollar: 83333 }, // $3.00/$12.00 per 1M tokens
	'gpt-image-1': { inputTokensPerDollar: 200000, outputTokensPerDollar: 0 }, // $5.00/- per 1M tokens (image generation)

	// legacy models for compatibility
	'gpt-4': { inputTokensPerDollar: 33333, outputTokensPerDollar: 16667 }, // estimated legacy pricing
	'gpt-3.5-turbo': { inputTokensPerDollar: 2000000, outputTokensPerDollar: 666667 }, // estimated legacy pricing

	// anthropic models
	'claude-opus-4-0': { inputTokensPerDollar: 66667, outputTokensPerDollar: 13333 }, // $15/$75 per 1M tokens
	'claude-sonnet-4-0': { inputTokensPerDollar: 333333, outputTokensPerDollar: 66667 }, // $3/$15 per 1M tokens
	'claude-3-7-sonnet-latest': { inputTokensPerDollar: 333333, outputTokensPerDollar: 66667 }, // $3/$15 per 1M tokens
	'claude-3-5-sonnet-latest': { inputTokensPerDollar: 333333, outputTokensPerDollar: 66667 }, // $3/$15 per 1M tokens
	'claude-3-5-haiku-latest': { inputTokensPerDollar: 1250000, outputTokensPerDollar: 250000 }, // $0.80/$4.00 per 1M tokens

	// gemini models - exact pricing from ai.google.dev/pricing
	'gemini-2.5-pro': { inputTokensPerDollar: 800000, outputTokensPerDollar: 100000 }, // $1.25/$10 per 1M tokens (≤200k context)
	'gemini-2.5-flash': { inputTokensPerDollar: 3333333, outputTokensPerDollar: 400000 }, // $0.30/$2.50 per 1M tokens
	'gemini-2.5-flash-lite-preview': { inputTokensPerDollar: 10000000, outputTokensPerDollar: 2500000 }, // $0.10/$0.40 per 1M tokens
	'gemini-2.0-flash': { inputTokensPerDollar: 10000000, outputTokensPerDollar: 2500000 }, // $0.10/$0.40 per 1M tokens
	'gemini-2.0-flash-lite': { inputTokensPerDollar: 13333333, outputTokensPerDollar: 3333333 }, // $0.075/$0.30 per 1M tokens
	'gemini-1.5-flash': { inputTokensPerDollar: 13333333, outputTokensPerDollar: 3333333 }, // $0.075/$0.30 per 1M tokens (≤128k context)
	'gemini-1.5-flash-8b': { inputTokensPerDollar: 26666667, outputTokensPerDollar: 6666667 }, // $0.0375/$0.15 per 1M tokens (≤128k context)
	'gemini-1.5-pro': { inputTokensPerDollar: 800000, outputTokensPerDollar: 200000 }, // $1.25/$5.00 per 1M tokens (≤128k context)
	
	// legacy/compatibility
	'gemini-pro': { inputTokensPerDollar: 800000, outputTokensPerDollar: 200000 }, // using 1.5 pro pricing
}

// helper function to get pricing for a model (with fallback)
function getModelPricing(model: string): ModelPricing {
	// try exact match first
	if (MODEL_PRICING[model]) {
		return MODEL_PRICING[model]
	}

	// fallback to pattern matching
	if (model.startsWith('gpt-4.5-preview')) {
		return MODEL_PRICING['gpt-4.5-preview']
	} else if (model.startsWith('gpt-4.1-nano')) {
		return MODEL_PRICING['gpt-4.1-nano']
	} else if (model.startsWith('gpt-4.1-mini')) {
		return MODEL_PRICING['gpt-4.1-mini']
	} else if (model.startsWith('gpt-4.1')) {
		return MODEL_PRICING['gpt-4.1']
	} else if (model.startsWith('gpt-4o-mini-search-preview')) {
		return MODEL_PRICING['gpt-4o-mini-search-preview']
	} else if (model.startsWith('gpt-4o-search-preview')) {
		return MODEL_PRICING['gpt-4o-search-preview']
	} else if (model.startsWith('gpt-4o-mini-realtime-preview')) {
		return MODEL_PRICING['gpt-4o-mini-realtime-preview']
	} else if (model.startsWith('gpt-4o-mini-audio-preview')) {
		return MODEL_PRICING['gpt-4o-mini-audio-preview']
	} else if (model.startsWith('gpt-4o-mini')) {
		return MODEL_PRICING['gpt-4o-mini']
	} else if (model.startsWith('gpt-4o-realtime-preview')) {
		return MODEL_PRICING['gpt-4o-realtime-preview']
	} else if (model.startsWith('gpt-4o-audio-preview')) {
		return MODEL_PRICING['gpt-4o-audio-preview']
	} else if (model.startsWith('gpt-4o')) {
		return MODEL_PRICING['gpt-4o']
	} else if (model.startsWith('gpt-4')) {
		return MODEL_PRICING['gpt-4']
	} else if (model.startsWith('gpt-3.5')) {
		return MODEL_PRICING['gpt-3.5-turbo']
	} else if (model.startsWith('o1-pro')) {
		return MODEL_PRICING['o1-pro']
	} else if (model.startsWith('o1-mini')) {
		return MODEL_PRICING['o1-mini']
	} else if (model.startsWith('o1')) {
		return MODEL_PRICING['o1']
	} else if (model.startsWith('o3-pro')) {
		return MODEL_PRICING['o3-pro']
	} else if (model.startsWith('o3-deep-research')) {
		return MODEL_PRICING['o3-deep-research']
	} else if (model.startsWith('o3-mini')) {
		return MODEL_PRICING['o3-mini']
	} else if (model.startsWith('o3')) {
		return MODEL_PRICING['o3']
	} else if (model.startsWith('o4-mini-deep-research')) {
		return MODEL_PRICING['o4-mini-deep-research']
	} else if (model.startsWith('o4-mini')) {
		return MODEL_PRICING['o4-mini']
	} else if (model.startsWith('codex-mini-latest')) {
		return MODEL_PRICING['codex-mini-latest']
	} else if (model.startsWith('computer-use-preview')) {
		return MODEL_PRICING['computer-use-preview']
	} else if (model.startsWith('gpt-image-1')) {
		return MODEL_PRICING['gpt-image-1']
	} else if (model.startsWith('claude-opus')) {
		return MODEL_PRICING['claude-opus-4-0']
	} else if (model.startsWith('claude-sonnet-3-7')) {
		return MODEL_PRICING['claude-3-7-sonnet-latest']
	} else if (model.startsWith('claude-sonnet-3-5')) {
		return MODEL_PRICING['claude-3-5-sonnet-latest']
	} else if (model.startsWith('claude-sonnet')) {
		return MODEL_PRICING['claude-sonnet-4-0']
	} else if (model.startsWith('claude-haiku') || model.startsWith('claude-3-5-haiku')) {
		return MODEL_PRICING['claude-3-5-haiku-latest']
	} else if (model.startsWith('gemini-2.5-pro')) {
		return MODEL_PRICING['gemini-2.5-pro']
	} else if (model.startsWith('gemini-2.5-flash-lite-preview')) {
		return MODEL_PRICING['gemini-2.5-flash-lite-preview']
	} else if (model.startsWith('gemini-2.5-flash')) {
		return MODEL_PRICING['gemini-2.5-flash']
	} else if (model.startsWith('gemini-2.0-flash-lite')) {
		return MODEL_PRICING['gemini-2.0-flash-lite']
	} else if (model.startsWith('gemini-2.0-flash')) {
		return MODEL_PRICING['gemini-2.0-flash']
	} else if (model.startsWith('gemini-1.5-flash-8b')) {
		return MODEL_PRICING['gemini-1.5-flash-8b']
	} else if (model.startsWith('gemini-1.5-flash')) {
		return MODEL_PRICING['gemini-1.5-flash']
	} else if (model.startsWith('gemini-1.5-pro')) {
		return MODEL_PRICING['gemini-1.5-pro']
	} else if (model.startsWith('gemini')) {
		return MODEL_PRICING['gemini-pro']
	}

	// default fallback pricing
	return { inputTokensPerDollar: 100000, outputTokensPerDollar: 50000 }
}

// helper function to calculate cost for api call
function calculateApiCallCost(inputTokens: number, outputTokens: number, model: string): number {
	const pricing = getModelPricing(model)
	const inputCost = inputTokens / pricing.inputTokensPerDollar
	const outputCost = outputTokens / pricing.outputTokensPerDollar
	return inputCost + outputCost
}

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

// global cost tracker for the session
let sessionCostTracker: CostTracker = {
	totalCost: 0,
	apiCalls: [],
}

// create readline interface when not in test mode
let rl: readline.Interface | null = null

const getReadlineInterface = () => {
	if (!rl && !process.env.PROMPT_SHAPER_TESTS) {
		rl = readline.createInterface({ input: process.stdin, output: process.stdout })
	}
	return rl
}

const prompt = (query: string) =>
	new Promise(resolve => {
		const readline = getReadlineInterface()
		if (readline) {
			readline.question(query, resolve)
		} else {
			resolve('') // return empty string during tests
		}
	})

function getProviderFromModel(model: string): string {
	if (isOpenAIModel(model)) {
		return 'OpenAI'
	} else if (model.startsWith('claude-')) {
		return 'Anthropic'
	} else if (model.startsWith('gemini-')) {
		return 'Google'
	}
	return 'Unknown'
}

function validateModelName(model: string): void {
	if (getProviderFromModel(model) === 'Unknown') {
		throw new Error(`"${model}" is not a recognized model name.
Valid model patterns:
  OpenAI: gpt-*, o1-*, o3-*
  Anthropic: claude-*
  Google: gemini-*`)
	}
}

function showWelcomeMessage(options: CLIOptions) {
	const provider = getProviderFromModel(options.model)
	const modelDisplay = `${options.model} (${provider})`

	console.log('╭─────────────────────────────────────────────────────────────╮')
	console.log('│ PromptShaper Interactive Mode                               │')
	console.log('├─────────────────────────────────────────────────────────────┤')
	console.log(`│ Model: ${modelDisplay.substring(0, 50).padEnd(53)}│`)
	console.log('│                                                             │')
	console.log('│ Type /help to see available commands                        │')
	console.log('│ Type /exit to quit                                          │')
	console.log('╰─────────────────────────────────────────────────────────────╯')
	console.log()
}

// centralized exit handler
function exitApp(code: number = 0): never {
	if (rl) {
		rl.close()
	}
	process.exit(code)
}

async function handler(input: string, cliOptions: CLIOptions) {
	// implement priority system: CLI > profile > env vars
	let profileOptions: Partial<CLIOptions> = {}

	// determine profile to load (cli takes priority over env var)
	const profilePath = cliOptions.profile || envVars.profile
	if (profilePath) {
		if (cliOptions.profile && envVars.profile && cliOptions.profile !== envVars.profile) {
			console.warn(`Warning: Ignoring PROMPT_SHAPER_PROFILE environment variable. Using CLI profile: ${cliOptions.profile}`)
		}
		profileOptions = loadProfileOptions(profilePath)
	}

	// merge options in priority order: cli > profile > env vars > defaults
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
		llm: cliOptions.disableLlm ? false : profileOptions.llm ?? envVars.llm ?? true,
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

	// validate model name early
	if (options.debug) {
		console.log(`[DEBUG] Validating model name: ${options.model}`)
	}
	validateModelName(options.model)

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
		if (options.debug) {
			console.log(`[DEBUG] Loading conversation from JSON: ${options.loadJson}`)
		}
		const conversation: GenericMessage[] = JSON.parse(fs.readFileSync(options.loadJson, 'utf8'))
		await startSavedConversation(conversation, options)

		exitApp(0)
	}

	if (options.loadText) {
		// load text and continue interactive
		if (options.debug) {
			console.log(`[DEBUG] Loading conversation from text: ${options.loadText}`)
		}
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
		if (options.debug) {
			console.log(`[DEBUG] Starting interactive mode with model: ${options.model}`)
		}
		const conversation: GenericMessage[] = startConversationWithProvider(options.systemPrompt, options.model, options.debug)
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

		// check if user wants to send results to llm (but not in raw mode or disable-llm mode)
		if (!options.raw && !noLlm && (options.generate || options.interactive)) {
			// show conversational formatting when using llm features
			if (!options.hidePrompt) {
				console.log(`user\n${parsed}\n-----`)
			}
			const conversation: GenericMessage[] = [
				...startConversationWithProvider(options.systemPrompt, options.model, options.debug),
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

	// show welcome message for new conversations
	if (conversation.length === 0 || (conversation.length === 1 && conversation[0].role === 'system')) {
		showWelcomeMessage(options)
	}

	// runs until user exits
	const running = true
	while (running) {
		if (!userTurn) {
			await makeCompletionRequest(conversation, options)
			userTurn = true
		}

		// collect user response and then parse response if not in raw mode
		const response = (await prompt('\n> ')) as string

		// check if response is a command
		if (response.trim().startsWith('/')) {
			const parts = response.trim().split(/\s+/)
			const commandName = parts[0].substring(1) // remove the '/' prefix
			const args = parts.slice(1)

			if (options.debug) {
				console.log(`[DEBUG] Processing command: ${commandName} with args: ${args.join(' ')}`)
			}

			// find matching command
			const command = interactiveCommands.find(cmd => cmd.name === commandName)
			if (command) {
				const shouldContinue = await command.handler(conversation, options, args)
				if (shouldContinue) {
					continue
				}
			} else {
				console.log(`Unknown command: /${commandName}. Type /help for available commands.\n-----`)
				continue
			}
		}

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
	if (options.debug) {
		console.log(`[DEBUG] Making completion request with model: ${options.model}`)
	}

	// calculate input tokens before api call
	const inputText = conversation.map(msg => (typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content))).join('\n')
	const inputTokens = countTokens(inputText, options.model)

	console.log('assistant')
	const result = await generateWithProvider(conversation, options.model, options.responseFormat, options.reasoningEffort, options.debug)
	console.log('\n-----')

	// calculate output tokens after api call
	const outputTokens = countTokens(result, options.model)

	// calculate and track cost
	const cost = calculateApiCallCost(inputTokens, outputTokens, options.model)
	sessionCostTracker.totalCost += cost
	sessionCostTracker.apiCalls.push({
		model: options.model,
		inputTokens,
		outputTokens,
		cost,
		timestamp: new Date(),
	})

	if (options.debug) {
		console.log(`[DEBUG] API call cost: $${cost.toFixed(6)} (${inputTokens} input + ${outputTokens} output tokens)`)
		console.log(`[DEBUG] Session total cost: $${sessionCostTracker.totalCost.toFixed(6)}`)
	}

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

// only parse if this is the main module
if (require.main === module) {
	program.parse()
}
