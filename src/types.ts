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
	operation?: ParserOperation
	raw?: boolean
	location?: {
		start: TextLocation
		end: TextLocation
	}
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

export type PromptShapeFunction = (...args: ParserParam[]) => string | number

export interface ParserOptions {
	returnParserMatches?: boolean // return array of parser matches instead of rendered template
	showDebugMessages?: boolean // show verbose debug stuff
}
