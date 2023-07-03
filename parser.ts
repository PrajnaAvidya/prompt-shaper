import { readFileSync } from 'fs'

// load file
// const text = readFileSync('samples/minimal.ps.txt', 'utf8')
const text = readFileSync('samples/slots.ps.txt', 'utf8')
// console.log(`initial file:\n${text}`)

// remove comments
const withoutComments = text.replace(/\/\/.*$/gm, '');

// match slot definitions: {slot} and {slot(param1, param2="defaultValue")}content{/slot}
const singleBracePattern = /{([^}(]+)(?:\(([^)]*)\))?\}([\s\S]*?){\/\1}/g;
const slotDefinitions = Array.from(withoutComments.matchAll(singleBracePattern))
  .map(match => {
    const params = match[2] ? match[2].split(',').map(param => param.trim()) : [];
    const requiredParams = params.filter(param => !param.includes('='));
    const optionalParams = params.filter(param => param.includes('=')).map(param => {
      const [name, defaultValueRaw] = param.split('=');
      const defaultValuePattern = /"([^"\\]*(?:\\.[^"\\]*)*)"/;
      const defaultValueMatch = defaultValueRaw.match(defaultValuePattern);
      let defaultValue = defaultValueMatch ? defaultValueMatch[1] : defaultValueRaw;
      // replace escaped double quote with just double quote
      defaultValue = defaultValue.replace(/\\"/g, '"');
      return { name: name.trim(), defaultValue: defaultValue.trim() };
    });
    return { name: match[1], requiredParams, optionalParams, content: match[3].trim() };
  });

console.log('slot definitions:', slotDefinitions)

// remove matched slots and excess whitespace
let finalTemplate = withoutComments.replace(singleBracePattern, '').replace(/\n{3,}/g, '\n\n').trim();
console.log(`final template to render:\n${finalTemplate}`);

// match slot variables and get params
const matchSlotVariables = (template: string) => {
  const slotPattern = /{{([^}]+)}}/g;
  return Array.from(template.matchAll(slotPattern))
    .map(match => {
      const [name, paramsRaw] = match[1].split('(');
      let params: {name: string, value: string}[] = []
      if (paramsRaw) {
        let paramPattern = /(\w+)="([^"\\]*(?:\\.[^"\\]*)*)"/g;
        let paramMatches = Array.from(paramsRaw.matchAll(paramPattern))
          .map(match => {
            let value = match[2].replace(/\\"/g, '"');
            return { name: match[1], value: value };
          });

        return {
          name,
          params: paramMatches,
          index: match.index!,
          length: match[0].length!
        }
      }

      return { name, params, index: match.index!, length: match[0].length! }
    });
}

const renderTemplate = (template: string, depth: number = 4): string => {
  if (depth > 5) return template; // prevent infinite recursion

  let renderedTemplate = template;
  const slotMatches = matchSlotVariables(renderedTemplate);

  slotMatches.reverse().forEach(slotVar => {
    const slotDef = slotDefinitions.find(def => def.name === slotVar.name);
    if (!slotDef) {
      throw new Error(`Slot definition for ${slotVar.name} not found`);
    }

    let params = [...slotVar.params];
    slotDef.optionalParams.forEach(optParam => {
      if (!params.some(param => param.name === optParam.name)) {
        params.push({ name: optParam.name, value: optParam.defaultValue });
      }
    });

    let renderedText = slotDef.content;
    params.forEach(param => {
      const paramPattern = new RegExp(`{{${param.name}}}`, 'g');
      renderedText = renderedText.replace(paramPattern, param.value);
    });

    renderedTemplate = renderedTemplate.substring(0, slotVar.index) + renderedText + renderedTemplate.substring(slotVar.index + slotVar.length);
  });

  // recursively render nested slots
  return renderTemplate(renderedTemplate, depth + 1);
}

console.log(`final rendered template:\n${renderTemplate(finalTemplate)}`);
