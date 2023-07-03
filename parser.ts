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
      const [name, defaultValue] = param.split('=');
      return { name: name.trim(), defaultValue: defaultValue.trim() };
    });
    return { name: match[1], requiredParams, optionalParams, content: match[3].trim() };
  });

console.log('slot definitions:', slotDefinitions)

// remove matched slots and excess whitespace
let finalTemplate = withoutComments.replace(singleBracePattern, '').replace(/\n{3,}/g, '\n\n').trim();
console.log(`final template to render:\n${finalTemplate}`);

// match slot variables and get params
const slotPattern = /{{([^}]+)}}/g;
const slotMatches = Array.from(finalTemplate.matchAll(slotPattern))
  .map(match => {
    // console.log(match)
    const [name, paramsRaw] = match[1].split('(');
    let params: any = []
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
      }
    }
    return { name, params }
  });
console.log('Slot matches:', slotMatches);
console.log('snippetWithParameters params:', slotMatches[2]);

// TODO replace slot variables with rendered text (combine slot variable params with default values)
