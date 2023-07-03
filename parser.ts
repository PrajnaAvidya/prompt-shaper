import { readFileSync } from 'fs'

// load file
const text = readFileSync('samples/number-params.ps.txt', 'utf8')

// remove comments
const withoutComments = text.replace(/\/\/.*$/gm, '')

// match slot definitions: {slot} and {slot(param1, param2="defaultValue")}content{/slot}
const singleBracePattern = /{([^}(]+)(?:\(([^)]*)\))?\}([\s\S]*?){\/\1}/g
const slotDefinitions = Array.from(withoutComments.matchAll(singleBracePattern))
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
  })

console.log('slot definitions:', slotDefinitions)

// remove matched slots and excess whitespace
let finalTemplate = withoutComments.replace(singleBracePattern, '').replace(/\n{3,}/g, '\n\n').trim()
console.log(`\ntemplate to render:\n${finalTemplate}`)

// match slot variables and get params
const matchSlotVariables = (template: string) => {
  const slotPattern = /{{([^}]+)}}/g
  return Array.from(template.matchAll(slotPattern))
    .map(match => {
      const [name, paramsRaw] = match[1].split('(')
      let params: {name: string, value: string | number}[] = []
      if (paramsRaw) {
        let paramPattern = /(\w+)="([^"\\]*(?:\\.[^"\\]*)*)"|(\w+)=(\d+)/g
        let paramMatches = Array.from(paramsRaw.matchAll(paramPattern))
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

const renderTemplate = (template: string, depth: number = 0): string => {
  if (depth > 5) return template // prevent infinite recursion

  let renderedTemplate = template
  const slotMatches = matchSlotVariables(renderedTemplate)

  // console.log('slotMatches', slotMatches[1].params)
  slotMatches.reverse().forEach(slotVar => {
    const slotDef = slotDefinitions.find(def => def.name === slotVar.name)
    if (!slotDef) {
      throw new Error(`slot definition for ${slotVar.name} not found`)
    }

    let params = [...slotVar.params]
    slotDef.optionalParams.forEach(optParam => {
      if (!params.some(param => param.name === optParam.name)) {
        params.push({ name: optParam.name, value: optParam.defaultValue })
      }
    })

    let renderedText = slotDef.content
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
          // Regular variable replacement
          return param.value.toString();
        }
      });
    });

    renderedTemplate = renderedTemplate.substring(0, slotVar.index) + renderedText + renderedTemplate.substring(slotVar.index + slotVar.length)
  })

  // recursively render nested slots
  return renderTemplate(renderedTemplate, depth + 1)
}

console.log(`\nfinal rendered text:\n${renderTemplate(finalTemplate)}`)
