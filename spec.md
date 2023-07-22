# PromptShape
Working draft of my prompt construction scripting language

### Why
I'm a programmer and like many I've seen great productivity gains due to the assistance of LLMs. the standard way of interacting with model through a chat interface works great for a lot of things, but I do a lot of what I call "non-linear" workflows and find myself spending a lot of time copying and pasting out of text files to construct the exact prompts I want to run. I wanted to add a UI to do some of these tasks in Prajna Chat (my custom GPT client) but decided that first I needed some kind of text/templating engine to run all this. Inspired by templating engines like Mustache/Handlebars I decided to build my own variant specifically designed for running GPT/LLM prompts. The idea is that you can just work out of a text file and save a lot of time vs doing a bunch of copy/pasting of repeatedly used text fragments. Or you can build a UI around it and make it even more powerful.

### Examples
See the `samples` directory and try running them with the parser.

### Terminology
- Template - A file containing text that is rendered by the parser. I'm using the .ps.txt extension for the samples.
- Variable - A value loaded from a template file, or defined inline in a template. Variables are defined using single brackets e.g. `{helloVariable="Hello World"}`
- Slot - Renders the contents of a variable using double brackets e.g. `{{helloVariable}}`.

TODO Redo everything below

### Templates and Variables
A template is a file or inline string that gets loaded into a variable by the PromptShape parser and is then rendered.

Here's an example of an inline template which is defined using single bracket tags (it will become a variable called `basicTemplate`):
```
{basicTemplate}
This is the most basic example of an inline variable with no parameters
{/basicTemplate}
```

### Slots and Parameters
A slot is used to render a variable in a template e.g to render the above template. `{{basicTemplate}}`

Inline templates can contain slots which will render content stored inside variables. Slots can reference a global definition (i.e. an inline template), or a variable specific to the current template which is called a parameter.

```
// example of defining the variable contactInfo, then another variable greeting which uses contactInfo as a global variable, then rendering it inline

{contactInfo}
Me
me@hello.com
555-555-5555
{/contactInfo}

{greeting}
Here is my contact info:
{{contactInfo}}
{/greeting}

{{greeting}}
```

Parameters can be strings or numbers

```
// example of a template with paramters used as slots. note that zipCode is a numeric parameter.

{contactInfo(name, email, zipCode}
{{name}}
{{email}}
{{zipCode}}
{/contactInfo}

{{contactInfo(name="Me", email="me@hello.com", zipCode=55555)}}
```

The only difference between string and number params is that numeric params can have basic arithmetic operations done on its output. Supported operations are `+ - * /`.
```
{chapterTitle(chapterIndex)}
Chapter {{chapterIndex+1}}
{/chapterTitle}

{{chapterTitle(chapterIndex=0)}}

// this will output "Chapter 0" because operations are ignored for string parameters.
{{chapterTitle(chapterIndex="0")}}
```

TODO ability to use variable as param

### Variables
The contents of templates will be loaded into variables which are available to render inside other templates.

### Loading templates from files
The parser can load files as templates inline from within templates
```
// this will load variable called fileTemplate from "file-template.ps.txt:
{fileTemplate = "file-template.ps.txt.txt"}

{{fileTemplate}}
```

### Raw text variables
To render a variable as raw text (i.e. don't parse and execute the contents) use the @ symbol in front of the slot (local parameters will be ignored).

```
{rawText}
This is what a slot looks like in PromptShape: {{slot}}
{rawText}

// the following will just display the exact contents of rawText
{{@rawText}}
```

### Misc

Comments are marked with double slashes `// this is a comment` and are removed before rendering.
