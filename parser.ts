import { readFileSync } from 'fs'

interface templateDefinition {
  name: string
  content: string
  requiredParams: string[]
  optionalParams: {defaultValue: string | number, name: string}[]
}

// load/track files (to prevent circular dependencies)
const loadedFiles = new Set();
const loadFileContent = (filePath: string): string => {
  if (loadedFiles.has(filePath)) {
    throw new Error(`Circular dependency detected: file "${filePath}" has already been loaded.`);
  }
  loadedFiles.add(filePath);
  return readFileSync(filePath, 'utf8').toString();
};

// load file
const text = loadFileContent('samples/file-variables.ps.txt')

// remove comments
const withoutComments = text.replace(/\/\/.*$/gm, '')

// match file loading tags: {variableName = "filePath"}
const fileLoadPattern = /{([^=]+)\s*=\s*"([^"]+)"}/g;
const fileLoadMatches = Array.from(withoutComments.matchAll(fileLoadPattern))
const fileTemplateDefinitions: templateDefinition[] = []
fileLoadMatches.forEach(match => {
  const variableName = match[1].trim();
  const filePath = match[2];
  console.log(filePath)
  const fileContent= loadFileContent(filePath)
  // add the loaded file content as a new template definition
  fileTemplateDefinitions.push({ name: variableName, requiredParams: [], optionalParams: [], content: fileContent });
});

// match inline template tags: {templateName} and {templateName(param1, param2="defaultValue")}
const singleBracePattern = /{([^}(]+)(?:\(([^)]*)\))?\}([\s\S]*?){\/\1}/g

const allTemplateDefinitions = [...fileTemplateDefinitions, ...Array.from(withoutComments.matchAll(singleBracePattern))
  .map(match => {
    const params = match[2] ? match[2].split(',').map(param => param.trim()) : []
    const requiredParams = params.filter(param => !param.includes('='))
    const optionalParams = params.filter(param => param.includes('=')).map(param => {
      const [name, defaultValueRaw] = param.split('=')
      const defaultValueMatch = defaultValueRaw.match(/"([^"\\]*(?:\\.[^"\\]*)*)"/)
      const defaultValue = defaultValueMatch ?  defaultValueMatch[1].replace(/\\"/g, '"') : Number(defaultValueRaw)
      return { name: name.trim(), defaultValue }
    })
    return { name: match[1], requiredParams, optionalParams, content: match[3].trim() }
  })]
console.log('template definitions:', allTemplateDefinitions)

// match variables and get params
const matchVariables = (template: string) => {
  return Array.from(template.matchAll(/{{([^}]+)}}/g))
    .map(match => {
      const [name, paramsRaw] = match[1].split('(')
      let params: {name: string, value: string | number}[] = []
      if (paramsRaw) {
        let paramMatches = Array.from(paramsRaw.matchAll(/(\w+)="([^"\\]*(?:\\.[^"\\]*)*)"|(\w+)=(-?\d+(\.\d+)?)/g))
          .map(match => {
            const value = match[4] ? Number(match[4]) : match[2]
            return { name: match[1] || match[3], value: value }
          })

        return {
          name,
          params: paramMatches,
          index: match.index!,
          length: match[0].length!
        }
      }

      return { name, params, index: match.index!, length: match[0].length! }
    })
}

// remove matched templates and excess whitespace
let finalTemplate = withoutComments.replace(singleBracePattern, '').replace(fileLoadPattern, '').replace(/\n{3,}/g, '\n\n').trim()
console.log(`\ntext to render:\n${finalTemplate}`)

const renderTemplate = (template: string, depth: number = 0): string => {
  if (depth > 5) return template // prevent infinite recursion

  let renderedTemplate = template
  const variables = matchVariables(renderedTemplate)

  // replace variables in reverse order so character positions can be used
  variables.reverse().forEach(variable => {
    const templateDef = allTemplateDefinitions.find(def => def.name === variable.name)
    if (!templateDef) {
      throw new Error(`template definition for ${variable.name} not found`)
    }

    let params = [...variable.params]
    templateDef.optionalParams.forEach(optParam => {
      if (!params.some(param => param.name === optParam.name)) {
        params.push({ name: optParam.name, value: optParam.defaultValue })
      }
    })

    let renderedText = templateDef.content
    // console.log('renderedText', renderedText)
    params.forEach(param => {
      // console.log('param', param);
      // match arithmetic operations (only allowed on numeric params)
      const arithmeticPattern = new RegExp(`{{${param.name}\\s*([\\+\\-\\*\\/])?\\s*(\\d+)?}}`, 'g');
      renderedText = renderedText.replace(arithmeticPattern, (match, operator, number): string => {
        if (typeof param.value === 'number' && operator && number) {
          let result;
          switch (operator) {
            case '+':
              result = Number(param.value) + Number(number);
              break;
            case '-':
              result = Number(param.value) - Number(number);
              break;
            case '*':
              result = Number(param.value) * Number(number);
              break;
            case '/':
              result = Number(param.value) / Number(number);
              break;
            default:
              throw new Error(`Unsupported operator ${operator}`);
          }

          return result.toString();
        } else {
          // regular variable replacement
          return param.value.toString();
        }
      });
    });

    renderedTemplate = renderedTemplate.substring(0, variable.index) + renderedText + renderedTemplate.substring(variable.index + variable.length)
  })

  // recursively render nested templates
  return renderTemplate(renderedTemplate, depth + 1)
}

console.log(`\nfinal rendered text:\n${renderTemplate(finalTemplate)}`)
