import peggy from 'peggy'

import { loadFileContent, replaceStringAtLocation } from './utils'
import { ExpressionType, ParserContext, ParserParam, ParserSection, ParserType, ParserVariables, ValueType } from './types'
import { functions } from './functions'

const isPackaged = process.argv[1].endsWith('.js') || process.argv[1].endsWith('prompt-shaper')
const templateParser: peggy.Parser = isPackaged ? require('./template-parser.js') : peggy.generate(loadFileContent('src/template-parser.pegjs'))
const maxRecursionDepth = 5

// mask markdown blocks to prevent parsing of their content
function maskCodeBlocks(template: string): { maskedTemplate: string; codeBlocks: string[] } {
	const codeBlocks: string[] = []

	// match fenced (```...```) and inline (`...`)
	const codeBlockRegex = /(`{3,}[\s\S]*?`{3,}|`[^`\n]*?`)/g

	const maskedTemplate = template.replace(codeBlockRegex, match => {
		const index = codeBlocks.length
		codeBlocks.push(match)
		return `__CODE_BLOCK_${index}__`
	})

	return { maskedTemplate, codeBlocks }
}

// restore markdown blocks after parsing
function restoreCodeBlocks(template: string, codeBlocks: string[]): string {
	return template.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
		return codeBlocks[parseInt(index)] || match
	})
}

// preprocess multiline variables that contain problematic syntax
function preprocessProblematicMultilineVars(template: string): { processedTemplate: string; problematicVars: Record<string, string> } {
	const problematicVars: Record<string, string> = {}
	const multilineVarRegex = /\{(\w+)\}([\s\S]*?)\{\/\1\}/g

	const processedTemplate = template.replace(multilineVarRegex, (match, varName, content) => {
		// check if content contains syntax that would cause parsing errors
		try {
			// try to parse a simple template with the content to see if it's problematic
			templateParser.parse(content.trim())
			// if parsing succeeds, return original
			return match
		} catch (error) {
			// if parsing fails, store the original content and replace with safe placeholder
			problematicVars[varName] = content
			return `{${varName}}__PROBLEMATIC_CONTENT__{/${varName}}`
		}
	})

	return { processedTemplate, problematicVars }
}

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

	// preserve markdown blocks before parsing
	const { maskedTemplate, codeBlocks } = maskCodeBlocks(template)
	showDebug && console.log(`DEBUG: Masked template:\n${maskedTemplate}`)

	// preprocess problematic multiline variables
	const { processedTemplate: preprocessedTemplate, problematicVars } = preprocessProblematicMultilineVars(maskedTemplate)
	showDebug && console.log(`DEBUG: Preprocessed template:\n${preprocessedTemplate}`)
	showDebug && console.log(`DEBUG: Problematic vars:`, problematicVars)

	// match all outer tags
	showDebug && console.log('DEBUG: Matching all outer tags')
	const parsedVariables = templateParser.parse(preprocessedTemplate)
	if (parserContext.options.returnParserMatches === true) {
		return parsedVariables.parsed
	}
	if (parsedVariables.parsed.length === 1 && parsedVariables.parsed[0].type === 'text') {
		showDebug && console.log('DEBUG: No tags to parse, returning original template')
		return restoreCodeBlocks(template, codeBlocks)
	}
	for (const value of parsedVariables.parsed as ParserSection[]) {
		showDebug && console.log('DEBUG: Match: ', value)
		switch (value.type) {
			case ParserType.variable: {
				// check for conflicts
				if (value.variableName! in functions) {
					throw new Error(`Variable name conflicts with function: ${value.variableName}`)
				} else if (value.variableName! in parserContext.variables) {
					throw new Error(`Variable name conflict: ${value.variableName}`)
				}
				// restore problematic content if this variable was preprocessed
				const finalValue = value.variableName! in problematicVars ? problematicVars[value.variableName!] : value.content!.value

				parserContext.variables[value.variableName!] = {
					name: value.variableName!,
					type: value.content!.type,
					value: finalValue,
					params: (value.content!.type === 'function' ? value.content!.params : value.params) || [],
					// mark as raw if it was problematic
					raw: value.variableName! in problematicVars,
				}
				break
			}
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

	return restoreCodeBlocks(
		currentTemplate
			.replace(/(\/\/.*$)|(\/\*[\s\S]*?\*\/)/gm, '') // remove comments
			.replace(/\n{3,}/g, '\n\n') // remove excess whitespace
			.trim(),
		codeBlocks,
	)
}

// evaluate the contents of a variable (which may contain a static value or a function evaluation)
async function evaluateVariable(
	variableName: string,
	params: ParserParam[],
	parserContext: ParserContext,
	raw: boolean = false,
	recursionDepth = 0,
): Promise<string | undefined> {
	const variable = parserContext.variables[variableName]
	if (!variable) {
		return undefined
	}

	if (variable.type === ValueType.function) {
		return await evaluateFunction(variable.value, variable.params!, parserContext)
	} else if (variable.type === ValueType.string) {
		// always treat multiline variables as raw
		if (raw || variable.raw) {
			return variable.value
		}

		// try to parse template content, but fall back to raw if it fails with syntax errors
		try {
			// map slot/variable params
			const slotVariables: ParserVariables = variable.params.reduce((obj: ParserVariables, item, index) => {
				// find matching slot param/value
				const slotParam = params && index in params ? params[index] : null
				if (!slotParam && item.required) {
					throw new Error(`Required param for ${variableName} not found: ${item.variableName}`)
				}

				obj[item.variableName!] = {
					name: item.variableName!,
					type: ValueType.string,
					value: slotParam ? slotParam.value : item.value,
					params: [], // this will be used in the future when a function can be passed as a param
				}
				return obj
			}, {})
			parserContext.variables = { ...parserContext.variables, ...slotVariables }

			recursionDepth++

			return (await parseTemplate(variable.value as string, parserContext, recursionDepth)) as string
		} catch (error) {
			// if parsing fails due to syntax errors, return raw content
			if (error instanceof SyntaxError) {
				return variable.value
			}
			// re-throw other errors
			throw error
		}
	}
}

async function evaluateFunction(functionName: string, params: ParserParam[], parserContext: ParserContext): Promise<string> {
	const func = functions[functionName]
	if (!func) {
		throw new Error(`Unknown function: ${functionName}`)
	}
	return func(parserContext, ...params)
}

// render the contents of a slot to a string
async function renderSlot(slot: ParserSection, parserContext: ParserContext, recursionDepth: number): Promise<string | undefined> {
	switch (slot.expression!.type) {
		case ExpressionType.string:
			return slot.expression!.value
		case ExpressionType.variable:
		case ExpressionType.function:
			if ((slot.expression!.value as string) in functions) {
				return await evaluateFunction(slot.expression!.value as string, slot.expression!.params!, parserContext)
			} else if ((slot.expression!.value as string) in parserContext.variables) {
				return await evaluateVariable(
					slot.expression!.value as string,
					slot.expression!.params || [],
					parserContext,
					slot.raw || false,
					recursionDepth,
				)
			} else {
				return undefined
			}
		default:
			return undefined
	}
}
