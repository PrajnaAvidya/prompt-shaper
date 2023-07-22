start
  = parts:part+ { return parts; }

part
  = variableDefinition
  / text

variableDefinition
  = "{" _ variableName:variableName _ "=" _ value:value _ "}" { return { type: 'variableDefinition', variableName, value }; }

value
  = string
  / number
  / functionCall

string
  = '"' chars:$[^"]* '"' { return { type: 'string', value: chars }; }

number
  = value:$([0-9]+ ("." [0-9]+)?) { return { type: 'number', value: parseFloat(value) }; }

functionCall
  = functionName:variableName "(" _ params:params _ ")" { return { type: 'function', functionName, params }; }

params
  = head:param tail:(_ "," _ param)* { return [head].concat(tail.map(t => t[3])); }

param
  = string
  / number

variableName
  = $[a-zA-Z_][a-zA-Z_0-9]*

text
  = chars:$[^{}]+ { return { type: 'text', value: chars }; }

_ "whitespace"
  = [ \t]*
