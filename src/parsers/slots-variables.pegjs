{
    function buildText(parts) {
        return parts.map(part => {
            if (part.type === 'text') {
                // Preserve newlines and other whitespace characters
                return part.content;
            } else if (part.type === 'slot') {
                let params = part.params ? "(" + part.params.map(p => p.type === 'string' ? `"${p.value}"` : p.value).join(', ') + ")" : "";
                let raw = part.raw ? "@" : "";
                return "{{" + raw + part.variableName + params + "}}";
            } else {
                return '';
            }
        }).join('');
    }
}

start
  = parts:part+ { return { parsed: parts, text: buildText(parts) }; }

part
  = variableDefinition
  / slot
  / text

variableDefinition
  = "{" _ variableName:variableName _ "(" _ variableParams:variableParams _ ")"? _ "}" _ content:(variableDefinition / slot / text)* _ "{/" _ variableName _ "}"
    {
      return { type: 'variable', variableName, params:variableParams, content:{ type:'string', value:content[0].content } };
    }
  / "{" _ variableName:variableName _ "}" _ content:(variableDefinition / slot / text)*_ "{/" _ variableName _ "}"
    {
      return { type: 'variable', variableName, params:[], content:{ type:'string', value:content[0].content } };
    }
  / "{" _ variableName:variableName _ "=" _ value:value _ "}"
    {
      return { type: 'variable', variableName, content:value };
    }

slot
  = "{{" _ "@"? _ variableName:variableName _ "("? _ params:params? _ ")"? _ operator:operator? _ value:value? _ "}}"
    {
      return { type: 'slot', variableName, params, operation: operator ? { operator:operator, value: value.value } : null, raw: text().includes('@'), location: location() };
    }

operator
  = "+" / "-" / "*" / "/"

params
  = head:param tail:(_ "," _ param)*
    { return [head].concat(tail.map(t => t[3])); }

variableParams
  = head:defaultParam tail:(_ "," _ defaultParam)*
    { return [head].concat(tail.map(t => t[3])); }

defaultParam
  = variableName:variableName _ "=" _ value:value
    { return { type: value.type, variableName, value: value.value, required: false }; }
  / variableName:variableName
    { return { type: 'unknown', variableName, value: null, required: true }; }

value
  = string
  / number
  / functionCall

string
  = '"' chars:$[^"]* '"' { return { type: 'string', value: chars }; }

number
  = value:$([0-9]+ ("." [0-9]+)?) { return { type: 'number', value: parseFloat(value) }; }

functionCall
  = functionName:variableName "(" _ params:params _ ")" { return { type: 'function', value: functionName, params }; }

param
  = string
  / number

variableName
  = first:[a-zA-Z_] rest:$[a-zA-Z_0-9]* { return first + rest; }

text
  = chars:$[^{}]+ { return { type: 'text', content: chars }; }

_ "whitespace"
  = [ \t\n\r]*