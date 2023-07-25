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
}

start
  = parts:part+ { return { parsed: parts, text: buildText(parts) } }

part
  = variableDefinition
  / slot
  / text

// variables are defined with single brackets
// for multiline variables, we need to extract the raw content using regex so it can be rendered recursively if necessary
variableDefinition
  = "{" _ variableName:variableName _ "(" _ variableParams:variableParams _ ")"? _ "}" _ content:(variableDefinition / slot / text)* _ "{/" _ variableName _ "}"
    // multiline with parameters (always string)
    {
      const varString = input.slice(location().start.offset, location().end.offset)
      const regex = `(?<!{){${variableName}(?:\\(([^)]*)\\))?\\}([\\s\\S]*?){\\/${variableName}}(?!})`
      const value = Array.from(varString.matchAll(new RegExp(regex, "g")))[0][2]
      return { type: 'variable', variableName, params:variableParams, content:{ type:'string', value } }
    }
  / "{" _ variableName:variableName _ "}" _ content:(variableDefinition / slot / text)* _ "{/" _ variableName _ "}"
    // multiline without params (always string)
    {
      const varString = input.slice(location().start.offset, location().end.offset)
      const regex = `(?<!{){${variableName}(?:\\(([^)]*)\\))?\\}([\\s\\S]*?){\\/${variableName}}(?!})`
      const value = Array.from(varString.matchAll(new RegExp(regex, "g")))[0][2]
      return { type: 'variable', variableName, params:[], content:{ type:'string', value } }
    }
  / "{" _ variableName:variableName _ "=" _ value:value _ "}"
    // single line, content can be string or number or function (which may have params)
    {
      return { type: 'variable', variableName, content:value }
    }

// slots are defined with double brackets
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
  = '"' chars:escapedChars* '"' { return { type: 'string', value: chars.join('') } }

escapedChars
  = escapedChar:escapedCharReturnSlash { return escapedChar }
  / chars:$[^"\\] { return chars }

escapedCharReturnSlash
  = "\\" char:$["{}\""] { return "\\" + char; }

number
  = value:$([0-9]+ ("." [0-9]+)?) { return { type: 'number', value: parseFloat(value) } }

functionCall
  = functionName:variableName "(" _ params:params _ ")" { return { type: 'function', value: functionName, params } }

param
  = string
  / number

// variable names must start with a letter and contain letters, numbers, underscores
variableName
  = first:[a-zA-Z_] rest:$[a-zA-Z_0-9]* { return first + rest }

// matches anything that isn't a PromptShape tag
text
  = escapedChar:escapedChar { return { type: 'text', content: escapedChar } }
  / chars:$[^{}\\]+ { return { type: 'text', content: chars } }

escapedChar
  = "\\" char:$["{}\""] { return char; }

_ "whitespace"
  = [ \t\n\r]*