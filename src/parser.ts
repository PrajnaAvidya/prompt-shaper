import peggy from 'peggy'

import { loadFileContent, replaceStringAtLocation } from './utils'
import { ExpressionType, Operand, Operation, ParserParam, ParserSection, ParserType, ParserVariables, ValueType } from './types'
import { functions } from './functions'

const isPackaged = process.argv[1].endsWith('.js') || process.argv[1].endsWith('prompt-shaper')
const templateParser: peggy.Parser = isPackaged ? require('./template-parser.js') : peggy.generate(loadFileContent('src/template-parser.pegjs'))
const maxRecursionDepth = 5

interface ParserOptions {
	returnParserMatches?: boolean // return array of parser matches instead of rendered template
	showDebugMessages?: boolean // show verbose debug stuff
}

export const parseTemplate = (template: string, variables?: ParserVariables, options?: ParserOptions, recursionDepth?: number): string => {
	if (typeof template !== 'string' || template.trim() === '' || (recursionDepth && recursionDepth > maxRecursionDepth)) return template

	if (!variables) variables = {}
	const showDebug = options?.showDebugMessages || false

	// remove comments using regex
	const withoutComments = template.replace(/\/\/.*$/gm, '')
	showDebug && console.log(`DEBUG: Parsing template:\n${withoutComments}`)

	// match all outer tags
	showDebug && console.log('DEBUG: Matching all outer tags')
	const parsedVariables = templateParser.parse(withoutComments)
	if (options?.returnParserMatches === true) {
		return parsedVariables.parsed
	}
	if (parsedVariables.parsed.length === 1 && parsedVariables.parsed[0].type === 'text') {
		showDebug && console.log('DEBUG: No tags to parse, returning original template')
		return template
	}
	for (const value of parsedVariables.parsed as ParserSection[]) {
		showDebug && console.log('DEBUG: Match: ', value)
		switch (value.type) {
			case ParserType.variable:
				// check for conflicts
				if (value.variableName! in functions) {
					throw new Error(`Variable name conflicts with function: ${value.variableName}`)
				} else if (value.variableName! in variables) {
					throw new Error(`Variable name conflict: ${value.variableName}`)
				}
				variables[value.variableName!] = {
					name: value.variableName!,
					type: value.content!.type,
					value: value.content!.value,
					params: (value.content!.type === 'function' ? value.content!.params : value.params) || [],
				}
				break
			case ParserType.slot:
			case ParserType.text:
				break
			default:
				throw new Error(`Unknown type:\n${value}`)
		}
	}
	showDebug && console.log('DEBUG: Found single-line-variables:', variables)

	// parser returns the template with variable definitions removed
	const withoutVariables = parsedVariables.text
	showDebug && console.log(`DEBUG: Final template to render:\n${withoutVariables}`)

	// render slots from the bottom up
	showDebug && console.log('DEBUG: Rendering slots')
	const slots = parsedVariables.parsed.filter((p: ParserSection) => p.type === ParserType.slot).reverse()
	let currentTemplate = withoutVariables
	for (const slot of slots as ParserSection[]) {
		showDebug && console.log('DEBUG: Rendering slot:', slot)

		// replace slot with variable
		const slotValue = renderSlot(slot, variables, recursionDepth || 0)
		if (slotValue) {
			currentTemplate = replaceStringAtLocation(currentTemplate, slotValue, slot.location!.start.offset, slot.location!.end.offset)
		}
	}

	// remove excess whitespace
	return currentTemplate.replace(/\n{3,}/g, '\n\n').trim()
}

// traverse an operation recursively as a syntax tree
function evaluateOperation(operation: Operation | Operand, variables: ParserVariables): number {
	if ('type' in operation) {
		switch (operation.type) {
			case 'number':
				return operation.value as number
			case 'variable':
				return evaluateVariable(operation.value as string, variables, []) as number
			case 'function':
				return evaluateFunction(operation.value as string, operation.params || []) as number
			case 'operation':
				// this is when the operand is an operation inside parenthesis
				return evaluateOperation(operation.value as Operation, variables)
		}
	}

	if ('operator' in operation) {
		let result = evaluateOperation(operation.operands[0], variables)

		switch (operation.operator) {
			case '+':
				result += evaluateOperation(operation.operands[1], variables)
				break
			case '-':
				result -= evaluateOperation(operation.operands[1], variables)
				break
			case '*':
				result *= evaluateOperation(operation.operands[1], variables)
				break
			case '/': {
				const operand2 = evaluateOperation(operation.operands[1], variables)
				if (operand2 === 0) {
					throw new Error('Division by zero')
				}
				result /= operand2
				break
			}
			case '^':
				result = Math.pow(result, evaluateOperation(operation.operands[1], variables))
				break
		}

		return result
	}

	// we should never reach this
	throw new Error('Invalid operation')
}

// evaluate the contents of a variable (which may contain a static value or a function evaluation)
function evaluateVariable(
	variableName: string,
	variables: ParserVariables,
	params: ParserParam[],
	raw: boolean = false,
	recursionDepth = 0,
): string | number | undefined {
	const variable = variables[variableName]
	if (!variable) {
		return undefined
	}

	if (variable.type === ValueType.function) {
		return evaluateFunction(variable.value as string, variable.params!)
	} else if (variable.type === ValueType.number) {
		return variable.value
	} else if (variable.type === ValueType.string) {
		if (raw) {
			return variable.value
		}

		// map slot/variable params
		const slotVariables: ParserVariables = variable.params.reduce((obj: ParserVariables, item, index) => {
			// find matching slot param/value
			const slotParam = params && index in params ? params[index] : null
			if (!slotParam && item.required) {
				throw new Error(`Required param for ${variableName} not found: ${item.variableName}`)
			}

			obj[item.variableName!] = {
				name: item.variableName!,
				type: slotParam?.value === 'number' ? ValueType.number : ValueType.string,
				value: slotParam ? slotParam.value : item.value,
				params: [], // this will be used in the future when a function can be passed as a param
			}
			return obj
		}, {})

		recursionDepth++

		return parseTemplate(variable.value as string, { ...variables, ...slotVariables }, {}, recursionDepth) as string
	}
}

function evaluateFunction(functionName: string, params: ParserParam[]): string | number {
	const func = functions[functionName]
	if (!func) {
		throw new Error(`Unknown function: ${functionName}`)
	}
	return func(...params)
}

// render the contents of a slot to a string
function renderSlot(slot: ParserSection, variables: ParserVariables, recursionDepth: number): string | undefined {
	switch (slot.expression!.type) {
		case ExpressionType.number:
		case ExpressionType.string:
			return slot.expression!.value as string
		case ExpressionType.variable:
		case ExpressionType.function:
			if ((slot.expression!.value as string) in functions) {
				return evaluateFunction(slot.expression!.value as string, slot.expression!.params!) as string
			} else if ((slot.expression!.value as string) in variables) {
				return evaluateVariable(
					slot.expression!.value as string,
					variables,
					slot.expression!.params || [],
					slot.raw || false,
					recursionDepth,
				) as string
			} else {
				return undefined
			}
		case ExpressionType.operation:
			return evaluateOperation(slot.expression!.value as Operation, variables).toString()
		default:
			return undefined
	}
}
