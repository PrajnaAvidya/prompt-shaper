import { readFileSync } from 'fs'
import { ExpressionType, Operand, Operation, ParserSection, ParserVariables, ValueType } from './types'
import { evaluateFunction } from './functions'

const fileCache: { [key: string]: string } = {}

// load the contents of file (cache results)
export const loadFileContent = (filePath: string): string => {
	if (filePath in fileCache) {
		return fileCache[filePath]
	}
	const contents = readFileSync(filePath, 'utf8').toString()
	fileCache[filePath] = contents
	return contents
}

// used to replace a slot with its rendered contents
export const replaceStringAtLocation = (str: string, replacement: string | number, start: number, end: number): string => {
	return str.substring(0, start) + replacement + str.substring(end)
}

// transforms a json key->value array to parser variables
export const transformJsonToVariables = (json: { [key: string]: string | number }): ParserVariables =>
	Object.entries(json).reduce((variables, [key, value]) => {
		variables[key] = {
			name: key,
			type: typeof value === 'number' ? ValueType.number : ValueType.string,
			value: value,
			params: [],
		}
		return variables
	}, {} as ParserVariables)

// traverse an operation recursively as a syntax tree
function evaluateOperation(operation: Operation | Operand, variables: ParserVariables): number {
	if ('type' in operation) {
		switch (operation.type) {
			case 'number':
				return operation.value as number
			case 'variable':
				return evaluateVariable(operation.value as string, variables) as number
			case 'function':
				return evaluateFunction(operation.value as string, operation.params || []) as number
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
			case '/':
				const operand2 = evaluateOperation(operation.operands[1], variables)
				if (operand2 === 0) {
					throw new Error('Division by zero')
				}
				result /= operand2
				break
		}

		return result
	}

	// we should never reach this
	throw new Error('Invalid operation')
}

// evaluate the contents of a variable (which may contain a static value or a function evaluation)
function evaluateVariable(variableName: string, variables: ParserVariables): string | number | undefined {
	const variable = variables[variableName]
	if (!variable) {
		return undefined
	}

	if (variable.type === ValueType.function) {
		return evaluateFunction(variable.value as string, variable.params!)
	} else {
		return variable.value
	}
}

// render the contents of a slot to a string
export const renderSlot = (slot: ParserSection, variables: ParserVariables): string | undefined => {
	switch (slot.expression!.type) {
		case ExpressionType.string:
		case ExpressionType.number:
			return slot.expression!.value as string
		case ExpressionType.variable:
			return evaluateVariable(slot.expression!.value as string, variables) as string
		case ExpressionType.function:
			return evaluateFunction(slot.expression!.value as string, slot.expression!.params!) as string
		case ExpressionType.operation:
			return evaluateOperation(slot.expression!.value as Operation, variables).toString()
		default:
			return undefined
	}
}
