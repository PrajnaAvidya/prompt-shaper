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

type OperandType = 'number' | 'function' | 'variable' | 'operation'

export interface Operand {
	type: OperandType
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

export interface Operation {
	operator: Operator
	operands: Operand[]
}

export interface Expression {
	type: ExpressionType
	value: number | string | Operation
	params?: ParserParam[]
}

export interface TextLocation {
	column: number
	line: number
	offset: number
}

export interface ParserVariables {
	[key: string]: {
		name: string
		type: ValueType
		value: string | number
		params: ParserParam[]
	}
}

export type PromptShaperFunction = (...args: ParserParam[]) => string | number

export interface ParserOptions {
	returnParserMatches?: boolean // return array of parser matches instead of rendered template
	showDebugMessages?: boolean // show verbose debug stuff
}

export interface CLIOptions {
	isString?: boolean
	debug?: boolean
	save?: string
	json?: string
	jsonFile?: string
}
