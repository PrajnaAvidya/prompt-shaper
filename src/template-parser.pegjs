{
    // build text from parsed parts
    function buildText(parts) {
        let offset = 0
        return parts.map(part => {
            if (part.type === 'text') {
                offset += part.content.length
                return part.content
            } else if (part.type === 'slot') {
                // re-construct the slot string with its parameters and optional raw marker (@)
                const params = part.params ? "(" + part.params.map(p => p.type === 'string' ? `"${p.value}"` : p.value).join(', ') + ")" : ""
                const raw = part.raw ? "@" : ""
                const operation = part.operation ? `${part.operation.operator}${part.operation.value}` : ""
                const slot = "{{" + raw + part.variableName + params + operation + "}}"
                // adjust the slot location based on the current offset
                part.location.start.offset = offset
                part.location.end.offset = part.location.start.offset + slot.length
                offset += slot.length
                return slot
            } else {
                return ''
            }
        }).join('')
    }

    // recursively join element content
    function joinContent(content) {
      if (typeof content === 'string') return content
      return content.map(section => {
        switch (section.type) {
          case 'slot':
            const raw = section.raw ? "@" : ""
            const params = section.params ? "(" + section.params.map(p => p.type === 'string' ? `"${p.value}"` : p.value).join(', ') + ")" : ""
            return `{{${raw}${section.variableName}${params}}}`
          //case 'variable':
          //  return `{${section.variableName}}${joinContent(section.content.value)}{/${section.variableName}}`
          case 'variable':
            return ''
          case 'text':
            return section.content
          default:
            throw new Error(`Unknown section type: ${section.type}`)
        }
      }).join('')
    }
}

start
  = parts:part+ { return { parsed: parts, text: buildText(parts) } }

part
  = variableDefinition
  / slot
  / text

variableDefinition
  = "{" _ variableName:variableName _ "(" _ variableParams:variableParams _ ")"? _ "}" _ content:(variableDefinition / slot / text)* _ "{/" _ variableName _ "}"
    {
      // variable with name, parameters, and content
      return { type: 'variable', variableName, params:variableParams, content:{ type:'string', value:joinContent(content) } }
    }
  / "{" _ variableName:variableName _ "}" _ content:(variableDefinition / slot / text)* _ "{/" _ variableName _ "}"
    {
      // variable with name and content, but no parameters
      return { type: 'variable', variableName, params:[], content:{ type:'string', value:joinContent(content) } }
    }
  / "{" _ variableName:variableName _ "=" _ value:value _ "}"
    {
      // variable with name and value
      return { type: 'variable', variableName, content:value }
    }

slot
  = "{{" _ "@"? _ variableName:variableName _ "("? _ params:params? _ ")"? _ operator:operator? _ value:value? _ "}}"
    {
      return { type: 'slot', variableName, params, operation: operator ? { operator:operator, value: value.value } : null, raw: text().includes('@'), location: location() }
    }

operator
  = "+" / "-" / "*" / "/"

params
  = head:param tail:(_ "," _ param)*
    { return [head].concat(tail.map(t => t[3])) }

variableParams
  = head:defaultParam tail:(_ "," _ defaultParam)*
    { return [head].concat(tail.map(t => t[3])) }

defaultParam
  = variableName:variableName _ "=" _ value:value
    { return { type: value.type, variableName, value: value.value, required: false } }
  / variableName:variableName
    { return { type: 'unknown', variableName, value: null, required: true } }

value
  = string
  / number
  / functionCall

string
  = '"' chars:$[^"]* '"' { return { type: 'string', value: chars } }

number
  = value:$([0-9]+ ("." [0-9]+)?) { return { type: 'number', value: parseFloat(value) } }

functionCall
  = functionName:variableName "(" _ params:params _ ")" { return { type: 'function', value: functionName, params } }

param
  = string
  / number

variableName
  = first:[a-zA-Z_] rest:$[a-zA-Z_0-9]* { return first + rest }

text
  = chars:$[^{}]+ { return { type: 'text', content: chars } }

_ "whitespace"
  = [ \t\n\r]*