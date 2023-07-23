import { loadFileContent, replaceStringAtLocation } from './utils'
import peg from 'pegjs'
import { parserSection, parserType, parserVariables, valueType } from './types'

const variablesParser = peg.generate(loadFileContent('src/parsers/slots-variables.pegjs'))

/*
parsing order
- 1) remove comments
- 2a) match and validate all variables and slots
- 2b) remove variables
- *) (future state) collection stuff
- 3a) remove excess whitespace
- 3b) render slots with variable data from the bottom up
- 3c) string variables will be parsed recursively (variables/slots within them will be rendered)
 */

// const textToParse = loadFileContent('samples/inline-variable-definitions.ps.txt')
const textToParse = loadFileContent('samples/dev.ps.txt')
// const textToParse = loadFileContent('samples/scratch.ps.txt')

// 1) remove comments using regex
const withoutComments = textToParse.replace(/\/\/.*$/gm, '')
// console.log(`Text to parse:\n${withoutComments}`)

// 2a) match all variables/slots
// TODO ignore variables/slots nested in multiline variables
const variables: parserVariables = {}
// store variables
const parsedVariables = variablesParser.parse(withoutComments)
for (const value of parsedVariables.parsed as parserSection[]) {
  console.log(value)
  switch (value.type) {
    case parserType.variable:
      if (value.variableName! in variables) {
        throw new Error(`Variable name conflict: ${value.variableName}`)
      }
      variables[value.variableName!] = {
        name: value.variableName!,
        type: value.content!.type,
        value: value.content!.value,
        params: (value.content!.type === 'function' ? value.content!.params : value.params) || [],
      }
      break
    case parserType.slot:
    case parserType.text:
      break
    default:
      throw new Error(`Unknown type:\n${value}`)
  }
}
console.log('variables', variables)

const withoutVariables = parsedVariables.text
console.log(`final template to render:\n${withoutVariables}`)

// reparse to get the correct locations of the slots & replace vars from the bottom up
const parsedSlots = variablesParser
  .parse(withoutVariables)
  .parsed.filter((p: parserSection) => p.type === parserType.slot)
  .reverse()
console.log('parsedSlots')
let currentTemplate = withoutVariables
for (const slot of parsedSlots as parserSection[]) {
  console.log('slot', slot)
  const variable = variables[slot.variableName!]
  console.log('variable', variable)
  if (!variable) continue

  // TODO get contents of variable
  // TODO arithmetic
  let variableValue: string | number
  switch (variable.type) {
    case valueType.string:
    case valueType.number:
    case valueType.unknown:
      variableValue = variable.value
      break
    case valueType.function:
      // TODO handle function
      variableValue = 'TODO render function'
      break
    default:
      throw new Error(`Unknown variable type: ${variable.type}`)
  }

  // replace slot with variable
  currentTemplate = replaceStringAtLocation(currentTemplate, variableValue, slot.location!.start.offset, slot.location!.end.offset)

  // console.log(currentTemplate)
}

// remove excess whitespace
const withoutExcessWhiteSpace = currentTemplate.replace(/\n{3,}/g, '\n\n').trim()
console.log(withoutExcessWhiteSpace)
