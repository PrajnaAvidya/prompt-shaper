import peg from 'pegjs'

import { loadFileContent, replaceStringAtLocation } from './utils'
import { ParserOperator, ParserOptions, ParserSection, ParserType, ParserVariables, ValueType } from './types'
import { functions } from './functions'

const templateParser = peg.generate(loadFileContent('src/template-parser.pegjs'))
const maxRecursionDepth = 5

export function parseTemplate(template: string, variables?: ParserVariables, options?: ParserOptions, recursionDepth?: number): string {
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

		// look for inline function call
		if (slot.variableName! in functions) {
			variables[slot.variableName!] = {
				name: slot.variableName!,
				type: ValueType.function,
				value: slot.variableName!,
				params: slot.params || [],
			}
		}

		const variable = variables[slot.variableName!]
		showDebug && console.log('DEBUG: Slot variable:', variable)
		if (!variable) continue

		// get contents of variable
		let variableValue: string | number
		switch (variable.type) {
			case ValueType.number:
				variableValue = variable.value
				break
			case ValueType.string:
				if (slot.raw) {
					// raw strings don't get parsed
					variableValue = variable.value
				} else {
					// recursively render string as template
					showDebug && console.log(`DEBUG: Recursively rendering ${slot.variableName}`)

					// map slot/variable params
					const slotVariables: ParserVariables = variable.params.reduce((obj: ParserVariables, item, index) => {
						// find matching slot param/value
						const slotParam = slot.params && index in slot.params ? slot.params[index] : null
						if (!slotParam && item.required) {
							throw new Error(`Required param for ${slot.variableName} not found: ${item.variableName}`)
						}

						obj[item.variableName!] = {
							name: item.variableName!,
							type: slotParam?.value === 'number' ? ValueType.number : ValueType.string,
							value: slotParam ? slotParam.value : item.value,
							params: [], // this will be used in the future when a function can be passed as a param
						}
						return obj
					}, {})
					showDebug && console.log(`DEBUG: Slot variables for ${slot.variableName}:`, slotVariables)
					if (!recursionDepth) {
						recursionDepth = 0
					}
					recursionDepth++
					variableValue = parseTemplate(
						variable.value as string,
						{ ...variables, ...slotVariables },
						{ ...options, returnParserMatches: options?.returnParserMatches || false },
						recursionDepth,
					) as string
				}
				break
			case ValueType.function: {
				const func = functions[variable.value]
				if (!func) {
					throw new Error(`Unknown function: ${variable.value}`)
				}
				variableValue = func(...variable.params!)
				break
			}
			case ValueType.unknown:
				throw new Error('Variable should never be unknown type (only params should be unknown)')
			default:
				throw new Error(`Unknown variable type: ${variable.type}`)
		}

		// perform arithmetic if necessary
		if (slot.operation && typeof variableValue === 'number') {
			switch (slot.operation.operator) {
				case ParserOperator.Add:
					variableValue += slot.operation.value
					break
				case ParserOperator.Subtract:
					variableValue -= slot.operation.value
					break
				case ParserOperator.Multiply:
					variableValue *= slot.operation.value
					break
				case ParserOperator.Divide:
					variableValue /= slot.operation.value
					break
			}
		}

		// replace slot with variable
		currentTemplate = replaceStringAtLocation(currentTemplate, variableValue, slot.location!.start.offset, slot.location!.end.offset)
	}

	// remove excess whitespace
	return currentTemplate.replace(/\n{3,}/g, '\n\n').trim()
}
