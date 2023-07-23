import { writeFileSync } from 'fs'
import { loadFileContent } from './src/utils'

interface variableDefinition {
  name: string
  content: string
  requiredParams: string[]
  optionalParams: { defaultValue: string | number; name: string }[]
}

// load/track files (to prevent circular dependencies)

// load file
// const text = loadFileContent('samples/file-variables.ps.txt')
const text = loadFileContent('samples/dev.ps.txt')

// remove comments
const withoutComments = text.replace(/\/\/.*$/gm, '')

// match file loading tag: {variableName = "filePath"}
// TODO make this the general inline matching section
const fileLoadPattern = /{([^\s=]{1,})\s*=\s*"([^"\n]{1,})"}/g
const fileLoadMatches = Array.from(withoutComments.matchAll(fileLoadPattern))
const fileTemplateDefinitions: variableDefinition[] = []
fileLoadMatches.forEach((match) => {
  const variableName = match[1].trim()
  const filePath = match[2]
  const fileContent = loadFileContent(filePath)
  // const fileContent = "todo"

  // add the loaded file content as a new template definition
  fileTemplateDefinitions.push({ name: variableName, requiredParams: [], optionalParams: [], content: fileContent })
})

// match multi line template tags: {templateName} and {templateName(param1, param2="defaultValue")}
// const singleBracePattern = /{([^}(]+)(?:\(([^)]*)\))?\}([\s\S]*?){\/\1}/g
const singleBracePattern = /(?<!{){([^}(]+)(?:\(([^)]*)\))?\}([\s\S]*?){\/\1}(?!})/g

const allTemplateDefinitions = [
  ...fileTemplateDefinitions,
  ...Array.from(withoutComments.matchAll(singleBracePattern)).map((match) => {
    const params = match[2] ? match[2].split(',').map((param) => param.trim()) : []
    const requiredParams = params.filter((param) => !param.includes('='))
    const optionalParams = params
      .filter((param) => param.includes('='))
      .map((param) => {
        const [name, defaultValueRaw] = param.split('=')
        const defaultValueMatch = defaultValueRaw.match(/"([^"\\]*(?:\\.[^"\\]*)*)"/)
        const defaultValue = defaultValueMatch ? defaultValueMatch[1].replace(/\\"/g, '"') : Number(defaultValueRaw)
        return { name: name.trim(), defaultValue }
      })
    return { name: match[1], requiredParams, optionalParams, content: match[3].trim() }
  }),
]
console.log('template definitions:', allTemplateDefinitions)

// match variables and get params
const matchVariables = (template: string, onlyMatchRaw: boolean = false) => {
  const pattern = onlyMatchRaw ? /{{@([^}]+)}}/g : /{{(?!@)([^}]+)}}/g

  return Array.from(template.matchAll(pattern)).map((match) => {
    const [name, paramsRaw] = match[1].split('(')
    const params: { name: string; value: string | number }[] = []
    if (paramsRaw) {
      const paramMatches = Array.from(paramsRaw.matchAll(/(\w+)="([^"\\]*(?:\\.[^"\\]*)*)"|(\w+)=(-?\d+(\.\d+)?)/g)).map((match) => {
        const value = match[4] ? Number(match[4]) : match[2]
        return { name: match[1] || match[3], value: value }
      })

      return {
        name,
        params: paramMatches,
        index: match.index!,
        length: match[0].length!,
      }
    }

    return { name, params, index: match.index!, length: match[0].length! }
  })
}

// remove matched templates and excess whitespace
const finalTemplate = withoutComments
  .replace(singleBracePattern, '')
  .replace(fileLoadPattern, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim()
console.log(`\ntext to render:\n${finalTemplate}`)

const maxDepth = 5
const renderTemplate = (template: string, depth: number = 0): string => {
  // after reaching max depth, we only render raw text variables and then return the result
  const finalPass = depth > maxDepth

  let renderedTemplate = template
  const variables = matchVariables(renderedTemplate, finalPass)

  // replace variables in reverse order so character positions can be used
  variables.reverse().forEach((variable) => {
    const templateDef = allTemplateDefinitions.find((def) => def.name === variable.name)
    if (!templateDef) {
      throw new Error(`template definition for ${variable.name} not found`)
    }

    const params = [...variable.params]
    templateDef.optionalParams.forEach((optParam) => {
      if (!params.some((param) => param.name === optParam.name)) {
        params.push({ name: optParam.name, value: optParam.defaultValue })
      }
    })

    let renderedText = templateDef.content
    // console.log('renderedText', renderedText)
    params.forEach((param) => {
      // console.log('param', param);
      // match arithmetic operations (only allowed on numeric params)
      const arithmeticPattern = new RegExp(`{{${param.name}\\s*([\\+\\-\\*\\/])?\\s*(\\d+)?}}`, 'g')
      renderedText = renderedText.replace(arithmeticPattern, (match, operator, number): string => {
        if (typeof param.value === 'number' && operator && number) {
          let result
          switch (operator) {
            case '+':
              result = Number(param.value) + Number(number)
              break
            case '-':
              result = Number(param.value) - Number(number)
              break
            case '*':
              result = Number(param.value) * Number(number)
              break
            case '/':
              result = Number(param.value) / Number(number)
              break
            default:
              throw new Error(`Unsupported operator ${operator}`)
          }

          return result.toString()
        } else {
          // regular variable replacement
          return param.value.toString()
        }
      })
    })

    renderedTemplate = renderedTemplate.substring(0, variable.index) + renderedText + renderedTemplate.substring(variable.index + variable.length)
  })

  // recursively render nested templates
  return finalPass ? renderedTemplate : renderTemplate(renderedTemplate, depth + 1)
}

// console.log(`\nfinal rendered text:\n${renderTemplate(finalTemplate)}`)
writeFileSync('output.txt', renderTemplate(finalTemplate))
console.log('final text rendered to output.txt')
