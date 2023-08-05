export enum ParserType {
	text = 'text',
	variable = 'variable',
	slot = 'slot',
}

export enum ValueType {
	string = 'string',
	number = 'number',
	function = 'function',
	unknown = 'unknown',
}

export interface ParserParam {
	type: ValueType
	value: string | number
	params?: ParserParam[]
	variableName?: string
	required?: boolean
}

export interface ParserOperation {
	operator: ParserOperator
	value: number
}

export enum ParserOperator {
	Add = '+',
	Subtract = '-',
	Multiply = '*',
	Divide = '/',
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

type Operator = '+' | '-' | '*' | '/'

type OperandType = 'string' | 'number' | 'function' | 'variable'

interface Operand {
	type: OperandType
	value: number | string
	params?: Expression[]
}

export enum ExpressionType {
	string = 'string',
	number = 'number',
	variable = 'variable',
	function = 'function',
	operation = 'operation',
}

type ExpressionValue = string | number | Operation

interface Operation {
	operator: Operator
	operands: Operand[]
}

interface Expression {
	type: ExpressionType
	value: ExpressionValue
	params?: ParserParam[]
	// operator: Operator
	// operands: (Expression | Operand)[]
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
