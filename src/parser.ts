import { loadFileContent } from './utils'
import peg from "pegjs";

const variablesParser = peg.generate(loadFileContent('src/parsers/slots-variables.pegjs'))

/*
parsing order
- 1) remove comments
- 2a) match and validate all variables and slots
- 2b) remove variables
- *) (future state) collection stuff
- 3) remove excess whitespace
- 4a) render slots with variable data from the bottom up
- 4b) string variables will be parsed recursively (variables/slots within them will be rendered)

TODO deal with stuff nested in multiline variables
 */

// const textToParse = loadFileContent('samples/inline-variable-definitions.ps.txt')
const textToParse = loadFileContent('samples/scratch.ps.txt')

// 1) remove comments using regex
const withoutComments = textToParse.replace(/\/\/.*$/gm, '');
console.log(`Text to parse:\n${withoutComments}`)

// 2a) match all variables
const variables: { [key: string]: object } = {}
const slotNames: string[] = []
// store slots/variables
const parsed = variablesParser.parse(withoutComments)
for (const value of parsed.parsed) {
  console.log(value)
  switch (value.type) {
    case "variable":
      if (value.variableName in variables) {
        throw new Error(`Variable name conflict: ${value.variableName}`)
      }
      variables[value.variableName] = { name: value.variableName, value: value.value }
      break
    case "slot":
      slotNames.push(value.variableName)
      break
    case "text":
      break
    default:
      throw new Error(`Unknown type:\n${value}`)
  }
}
// console.log('variables', variables)
// console.log('slotNames', slotNames)

const withoutVariables = parsed.text

// remove excess whitespace
const withoutExcessWhiteSpace = withoutVariables.replace(/\n{3,}/g, '\n\n').trim()
// console.log(withoutExcessWhiteSpace)

// TODO now reparse to get the correct locations of the slots
// console.log(variablesParser.parse(withoutExcessWhiteSpace))

// TODO replase all vars from the bottom up
