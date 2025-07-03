import { ChatCompletionMessageParam, ChatCompletionReasoningEffort } from 'openai/resources/chat/completions/completions'

export interface ParserOptions {
	fileExtensions?: string // what file extensions to include when reading files from directories with loadDir
	returnParserMatches?: boolean // return array of parser matches instead of rendered template
	showDebugMessages?: boolean // show verbose debug stuff
}

export interface ParserVariables {
	[key: string]: {
		name: string
		type: ValueType
		value: string | number
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
	number = 'number',
	function = 'function',
}

export interface ParserParam {
	type: ValueType
	value: string | number
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

type Operator = '+' | '-' | '*' | '/' | '^'

export interface Operand {
	type: ExpressionType
	value: number | string | Operation
	params?: ParserParam[]
}

export enum ExpressionType {
	string = 'string',
	number = 'number',
	variable = 'variable',
	function = 'function',
	operation = 'operation',
}

export interface Expression {
	type: ExpressionType
	value: number | string | Operation
	params?: ParserParam[]
}

export interface Operation {
	operator: Operator
	operands: Operand[]
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
