import { readFileSync } from 'fs'

// load PromptShape file
// const text = readFileSync('samples/minimal.ps.txt', 'utf8')
const text = readFileSync('samples/slots.ps.txt', 'utf8')
console.log(`initial file:\n${text}`)

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
// TODO put this in a function so it can be called during render
const slotPattern = /{{([^}]+)}}/g;
const slotMatches = Array.from(finalTemplate.matchAll(slotPattern))
  .map(match => {
    const [name, paramsRaw] = match[1].split('(');
    let params: {name: string, value: string}[] = []
    if (paramsRaw) {
      let paramPattern = /(\w+)="([^"\\]*(?:\\.[^"\\]*)*)"/g;
      // let paramMatches = Array.from(paramsRaw.matchAll(paramPattern))
      //   .map(match => ({ name: match[1], value: match[2] }));
      let paramMatches = Array.from(paramsRaw.matchAll(paramPattern))
        .map(match => {
          // replace escaped double quote with just double quote
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
console.log('slot variables:', slotMatches);
// console.log('snippetWithParameters params:', slotMatches[2]);

// make a copy of the final template to perform replacements
let renderedTemplate = finalTemplate;

// replace slot variables with rendered text (combine slot variable params with default values)
// TODO need to recursively render nested slots with max depth (also contain slot params within only the namespace of the slot when rendering)
slotMatches.reverse().forEach(slotVar => {
  // console.log(slotVar)

  // find the corresponding slot definition
  const slotDef = slotDefinitions.find(def => def.name === slotVar.name);
  if (!slotDef) {
    throw new Error(`Slot definition for ${slotVar.name} not found`);
  }

  // combine slot variable params with default values
  let params = [...slotVar.params];
  slotDef.optionalParams.forEach(optParam => {
    if (!params.some(param => param.name === optParam.name)) {
      params.push({ name: optParam.name, value: optParam.defaultValue });
    }
  });

  // replace slot variable with rendered text
  let renderedText = slotDef.content;
  params.forEach(param => {
    const paramPattern = new RegExp(`{{${param.name}}}`, 'g');
    renderedText = renderedText.replace(paramPattern, param.value);
  });

  // replace the slot variable in the template
  renderedTemplate = renderedTemplate.substring(0, slotVar.index) + renderedText + renderedTemplate.substring(slotVar.index + slotVar.length);
});

console.log(`final rendered template:\n${renderedTemplate}`);
