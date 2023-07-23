import { loadFileContent } from './utils'
import peg from 'pegjs'
import {parserParam, parserSection, parserType, parserVariables, valueType} from "./types";

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
// const textToParse = loadFileContent('samples/dev.ps.txt')
const textToParse = loadFileContent('samples/scratch.ps.txt')

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
        params: (value.content!.type === 'function' ? value.content!.params : value.params) || []
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

// const withoutVariables = parsedVaribles.text
//
// // remove excess whitespace
// const withoutExcessWhiteSpace = withoutVariables.replace(/\n{3,}/g, '\n\n').trim()
// console.log(`final template to render:\n${withoutExcessWhiteSpace}`)
//
// // TODO reparse to get the correct locations of the slots & replace vars from the bottom up
// const parsedSlots = variablesParser
//   .parse(withoutExcessWhiteSpace)
//   .parsed.filter((p: any) => p.type === 'slot')
//   .reverse()
// console.log('parsedSlots')
// const currentTemplate = withoutExcessWhiteSpace
// for (const slot of parsedSlots) {
//   console.log('slot', slot)
//   const variable = variables[slot.variableName]
//   console.log('variable', variable)
//   if (!variable) continue
//
//   // TODO get contents of variable
//
//   // TODO replace slot with variable
//
//   break
// }
