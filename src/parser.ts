import peggy from 'peggy'

import { loadFileContent, replaceStringAtLocation } from './utils'
import { ExpressionType, Operand, Operation, ParserContext, ParserParam, ParserSection, ParserType, ParserVariables, ValueType } from './types'
import { functions } from './functions'

const isPackaged = process.argv[1].endsWith('.js') || process.argv[1].endsWith('prompt-shaper')
const templateParser: peggy.Parser = isPackaged ? require('./template-parser.js') : peggy.generate(loadFileContent('src/template-parser.pegjs'))
const maxRecursionDepth = 5

export const parseTemplate = async (template: string, parserContext?: ParserContext, recursionDepth?: number): Promise<string> => {
	if (typeof template !== 'string' || template.trim() === '' || (recursionDepth && recursionDepth > maxRecursionDepth)) return template

	if (!parserContext) {
		parserContext = {
			variables: {},
			options: {},
			attachments: [],
		}
	}

	const showDebug = parserContext.options.showDebugMessages || false

	showDebug && console.log(`DEBUG: Parsing template:\n${template}`)

	// match all outer tags
	showDebug && console.log('DEBUG: Matching all outer tags')
	const parsedVariables = templateParser.parse(template)
	if (parserContext.options.returnParserMatches === true) {
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
				} else if (value.variableName! in parserContext.variables) {
					throw new Error(`Variable name conflict: ${value.variableName}`)
				}
				parserContext.variables[value.variableName!] = {
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
	showDebug && console.log('DEBUG: Found single-line-variables:', parserContext.variables)

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
		const slotValue = await renderSlot(slot, parserContext, recursionDepth || 0)
		if (slotValue) {
			currentTemplate = replaceStringAtLocation(currentTemplate, slotValue, slot.location!.start.offset, slot.location!.end.offset)
		}
	}

	return currentTemplate
		.replace(/(\/\/.*$)|(\/\*[\s\S]*?\*\/)/gm, '') // remove comments
		.replace(/\n{3,}/g, '\n\n') // remove excess whitespace
		.trim()
}

// traverse an operation recursively as a syntax tree
async function evaluateOperation(operation: Operation | Operand, parserContext: ParserContext): Promise<number> {
	if ('type' in operation) {
		switch (operation.type) {
			case 'number':
				return operation.value as number
			case 'variable':
				return (await evaluateVariable(operation.value as string, [], parserContext)) as number
			case 'function':
				return (await evaluateFunction(operation.value as string, operation.params || [], parserContext)) as number
			case 'operation':
				// this is when the operand is an operation inside parenthesis
				return (await evaluateOperation(operation.value as Operation, parserContext)) as number
		}
	}

	if ('operator' in operation) {
		let result = await evaluateOperation(operation.operands[0], parserContext)

		switch (operation.operator) {
			case '+':
				result += await evaluateOperation(operation.operands[1], parserContext)
				break
			case '-':
				result -= await evaluateOperation(operation.operands[1], parserContext)
				break
			case '*':
				result *= await evaluateOperation(operation.operands[1], parserContext)
				break
			case '/': {
				const operand2 = await evaluateOperation(operation.operands[1], parserContext)
				if (operand2 === 0) {
					throw new Error('Division by zero')
				}
				result /= operand2
				break
			}
			case '^':
				result = Math.pow(result, await evaluateOperation(operation.operands[1], parserContext))
				break
		}

		return result
	}

	// we should never reach this
	throw new Error('Invalid operation')
}

// evaluate the contents of a variable (which may contain a static value or a function evaluation)
async function evaluateVariable(
	variableName: string,
	params: ParserParam[],
	parserContext: ParserContext,
	raw: boolean = false,
	recursionDepth = 0,
): Promise<string | number | undefined> {
	const variable = parserContext.variables[variableName]
	if (!variable) {
		return undefined
	}

	if (variable.type === ValueType.function) {
		return await evaluateFunction(variable.value as string, variable.params!, parserContext)
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
		parserContext.variables = { ...parserContext.variables, ...slotVariables }

		recursionDepth++

		return (await parseTemplate(variable.value as string, parserContext, recursionDepth)) as string
	}
}

async function evaluateFunction(functionName: string, params: ParserParam[], parserContext: ParserContext): Promise<string | number> {
	const func = functions[functionName]
	if (!func) {
		throw new Error(`Unknown function: ${functionName}`)
	}
	return func(parserContext, ...params)
}

// render the contents of a slot to a string
async function renderSlot(slot: ParserSection, parserContext: ParserContext, recursionDepth: number): Promise<string | undefined> {
	switch (slot.expression!.type) {
		case ExpressionType.number:
		case ExpressionType.string:
			return slot.expression!.value as string
		case ExpressionType.variable:
		case ExpressionType.function:
			if ((slot.expression!.value as string) in functions) {
				return (await evaluateFunction(slot.expression!.value as string, slot.expression!.params!, parserContext)) as string
			} else if ((slot.expression!.value as string) in parserContext.variables) {
				return (await evaluateVariable(
					slot.expression!.value as string,
					slot.expression!.params || [],
					parserContext,
					slot.raw || false,
					recursionDepth,
				)) as string
			} else {
				return undefined
			}
		case ExpressionType.operation:
			return (await evaluateOperation(slot.expression!.value as Operation, parserContext)).toString()
		default:
			return undefined
	}
}
