{
    // build text from parsed parts
    function buildText(parts) {
        let offset = 0
        return parts.map(part => {
            if (part.type === 'text') {
                offset += part.content.length
                return part.content
            } else if (part.type === 'slot') {
                // adjust the slot location based on the current offset
                part.location.start.offset = offset
                part.location.end.offset = part.location.start.offset + part.content.length
                offset += part.content.length
                return part.content
            } else {
                return ''
            }
        }).join('')
    }
}

start
  = parts:part+ { return { parsed: parts, text: buildText(parts) } }

part
  = variable
  / slot
  / text
  / fail

fail
  = . { throw new SyntaxError(`Syntax error at line ${location().end.line} column ${location().end.column}: '${text()}'`) }

// variables are defined with single braces
// for multiline variables, we need to extract the raw content using regex so it can be rendered recursively if necessary
variable
  = "{" _ variableName:variableName _ params:("(" _ variableParams _ ")")? _ "}" _ content:(variable / slot / text)* _ "{/" _ endName:variableName _ "}"
    // multiline with parameters (always string)
    {
      if (variableName !== endName) {
        throw new SyntaxError(`Mismatched variable tags: {${variableName}} ... {/${endName}}`);
      }
      const variableParams = params ? params[2] : [];
      const varString = input.slice(location().start.offset, location().end.offset)
      const regex = `(?<!{){${variableName}(?:\\(([^)]*)\\))?\\}([\\s\\S]*?){\\/${variableName}}(?!})`
      const value = Array.from(varString.matchAll(new RegExp(regex, "g")))[0][2]
      return { type: 'variable', variableName, params:variableParams, content:{ type:'string', value } }
    }
  / "{" _ variableName:variableName _ "}" _ content:(variable / slot / text)* _ "{/" _ endName:variableName _ "}"
    // multiline without params (always string)
    {
      if (variableName !== endName) {
        throw new SyntaxError(`Mismatched variable tags: {${variableName}} ... {/${endName}}`);
      }
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


// slots are defined with double braces
slot
  = "{{" _ "@"? _ expression:expression _ "}}"
    {
      return { type: 'slot', expression, raw: text().includes('@'), location: location(), content: input.slice(location().start.offset, location().end.offset) }
    }

expression
  = head:additive tail:(_ operator:addSubOperator _ additive:additive)*
    { return tail.reduce((result, element) => { return { type: 'operation', value: { operator: element[1], operands: [result, element[3]] } } }, head) }

additive
  = head:multiplicative tail:(_ operator:mulDivOperator _ multiplicative:multiplicative)*
    { return tail.reduce((result, element) => { return { type: 'operation', value: { operator: element[1], operands: [result, element[3]] } } }, head) }

multiplicative
  = head:primary tail:(_ operator:powOperator _ primary:primary)*
    { return tail.reduce((result, element) => { return { type: 'operation', value: { operator: element[1], operands: [result, element[3]] } } }, head) }

primary
  = "(" _ expression:expression _ ")" { return expression }
  / functionCall
  / variableObject
  / number
  / string

addSubOperator
  = "+" / "-"

mulDivOperator
  = "*" / "/"

powOperator
  = "^"

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
  = "\\" char:$["{}\""] { return "\\" + char }

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
variableObject
  = first:[a-zA-Z_] rest:$[a-zA-Z_0-9]* { return { type: 'variable', value: first + rest } }

// matches anything that isn't a PromptShaper tag
text
  = escapedChar:escapedChar { return { type: 'text', content: escapedChar } }
  / chars:$[^{}\\]+ { return { type: 'text', content: chars } }

escapedChar
  = "\\" char:$["{}\""] { return char }

_ "whitespace"
  = [ \t]*