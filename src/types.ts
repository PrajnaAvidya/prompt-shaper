import { ChatCompletionMessageParam, ChatCompletionReasoningEffort } from 'openai/resources/chat/completions/completions'

export interface ParserOptions {
	fileExtensions?: string | string[] // what file extensions to include when reading files from directories with loadDir
	ignorePatterns?: string // comma-separated patterns to ignore when loading directories
	returnParserMatches?: boolean // return array of parser matches instead of rendered template
	showDebugMessages?: boolean // show verbose debug stuff
}

export interface ParserVariables {
	[key: string]: {
		name: string
		type: ValueType
		value: string
		params: ParserParam[]
		raw?: boolean
	}
}

export interface ParserContext {
	variables: ParserVariables
	options: ParserOptions
	attachments: Array<{ type: 'image_url'; image_url: { url: string } }>
}

export enum ParserType {
	text = 'text',
	variable = 'variable',
	slot = 'slot',
}

export enum ValueType {
	string = 'string',
	function = 'function',
}

export interface ParserParam {
	type: ValueType
	value: string
	params?: ParserParam[]
	variableName?: string
	required?: boolean
}

export interface ParserSection {
	type: ParserType
	variableName?: string
	params?: ParserParam[]
	content?: ParserParam
	expression?: Expression
	raw?: boolean
	location?: {
		start: TextLocation
		end: TextLocation
	}
}

export enum ExpressionType {
	string = 'string',
	variable = 'variable',
	function = 'function',
}

export interface Expression {
	type: ExpressionType
	value: string
	params?: ParserParam[]
}

export interface TextLocation {
	column: number
	line: number
	offset: number
}

export type ResponseFormat = 'text' | 'json_object'

export interface Generate {
	(
		messages: ChatCompletionMessageParam[],
		model: string,
		responseFormat: ResponseFormat,
		reasoningEffort: ChatCompletionReasoningEffort,
	): Promise<string>
}
