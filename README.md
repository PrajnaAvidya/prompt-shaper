# PromptShape
Working draft of my prompt construction scripting language

## Why
I'm a programmer and like many I've seen great productivity gains due to the assistance of LLMs. the standard way of interacting with model through a chat interface works great for a lot of things, but I do a lot of what I call "non-linear" workflows and find myself spending a lot of time copying and pasting out of text files to construct the exact prompts I want to run. I wanted to add a UI to do some of these tasks in Prajna Chat (my custom GPT client) but decided that first I needed some kind of text/templating engine to run all this. Inspired by templating engines like Mustache/Handlebars I decided to build my own variant specifically designed for running GPT/LLM prompts. The idea is that you can just work out of a text editor/IDE and save a lot of time vs doing a bunch of copy/pasting of repeatedly used text fragments. Or you could build a UI around it and make it even more powerful.

## Examples
See the `samples` directory and try running them with the parser.

## Terminology
- Template - A piece of text that is rendered by the parser. I'm using the .ps.txt extension for the samples.
- Variable - A value loaded from a template file, or defined inline in a template. Variables are defined using single brackets and are either defined as a single tag, or with matching tags wrapped around text. String variables can be rendered as templates.
- Slot - Renders the contents of a variable or function using double brackets.
- Parameters - One or more arguments passed to a slot or a function. Parameters can be strings or numbers.
- Function - Does "something" and the result is rendered on page, or assigned to a variable.

## Templates, Slots, Variables
A template is a file or string that gets loaded into a variable by the PromptShape parser and is then rendered.

Templates can contain one or more inline variable definitions. They are defined using single brackets can be single line or multi line using tags.
```
{stringVariable = "hello world"}

{numberVariable = 42.1}

{multilineVariable}
This is a variable spanning multiple lines, but the tags can be used on a single line if desired. Multiline variables are always strings.
{/multilineVariable}
```

A template can contain one or more slots which are rendered by replacing their content with variables.
```
This will render the contents of the string variable: {{stringVariable}}

This will render the contents of the number variable: {{numberVariable}}

This will render the contents of the multiline variable, and the @ symbol means it will be rendered as raw text (will not be parsed): {{@multilineVariable}}
```

A multiline variable can contain slot tags, which will be rendered recursively when the template is rendered.
```
{variableWithSlots}
This variable contains a slot which is defined in the outer scope: {{stringVariable}}
{/variableWithSlots}
```

## Parameters and Functions
A multiline variable can also be specified with parameters (which are required if no default is provided) which can be referenced using slots. Parameters are strings or numbers
```
{variableWithParameters(requiredParameter, optionaParameter="hello")}
{{requiredParameter}}
{{optionalParameter}}
{/variableWithParameters}
```

A slot or variable can be assigned the contents of a function, which is called using a function name and one or more parameters in parentheses.
```
// this will assign the output of add(2,2) to a variable called sumOfTwoNumbers
{sumOfTwoNumbers=add(2,2)}

// this will load file.ps.txt and render it in place
{{subTemplateToRender=load("file.ps.txt")}}
```

There's a few basic functions defined in the `functions.ts` file and you can add your own using `registerFunction`.

## String vs Number Parameters
The only difference between string and number params is that numeric params can have basic arithmetic operations done on their output. Supported operations are `+ - * /`.
```
{chapterTitle(chapterIndex)}
Chapter {{chapterIndex+1}}
{/chapterTitle}

// this will output "Chapter 1"
{{chapterTitle(chapterIndex=0)}}

// this will output "Chapter 0" because operators are ignored for string parameters.
{{chapterTitle(chapterIndex="0")}}
```

## Misc
Comments are marked with double slashes `// this is a comment` and are removed before rendering.

You can escape brackets with backslashes so they won't be parsed as tags: `\{\{escapedSlot\}\}`

You can escape brackets or double quotes in string parameters: `{{functionCall("param \" with \} special chars")}}`

## Template parsing/rendering order
1) remove comments
2) match and validate all variables and slots
3) remove variables
4) render slots with variable data from the bottom up
5) string variables will be parsed recursively (variables/slots within them will be rendered)
6) remove excess whitespace
