# PromptShape

Working draft of my prompt construction scripting language

### Why

I'm a programmer and like many others I've seen great productivity gains due to the assistance of LLMs. the standard way of interacting with GPT through a chat interface works great for a lot of things, but I do a lot of what I would call "non-linear" workflows and find myself spending a lot of time copying and pasting out of text files to construct the exact prompts I want to run. I wanted to add a UI to do some of these tasks in Prajna Chat (my custom GPT client) but decided that first I needed some kind of engine to run all this. after looking into existing templating engines like Handlebars I decided nothing out there was quite what I'm looking for so decided to build my own templating language specifically designed for running GPT/LLM prompts. the idea is that you could just work out of a text file and save a lot of time vs doing a bunch of copy/pasting of repeatedly used text fragments. or you could build a UI around it and make it even more powerful.

### Templates and Variables

A template is either a file (for the included samples I'm using the .ps.txt extension) or defined inline in a template file. Templates are loaded into variables, which can be injected into other templates.

Here's an example of an inline template which is defined using single bracket tags (it will become a variable called `basicTemplate`):
```
{basicTemplate}
This is the most basic example of an inline variable with no parameters
{/basicTemplate}
```

A variable is injected as a slot using double bracket tags so to render the previous template you would write `{{basicTemplate}}`

### Slots and Parameters

Templates can contain slots which will render content stored inside variables. Slots can reference a global definition (i.e. an inline template), or a variable specific to the current template which is called a parameter.

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
// this will load a variable called fileTemplate from "file-template.ps.txt:
{fileTemplate} => path="file-template.ps.txt"

{{fileTemplate}}
```

TODO loading the contents of a file as a variable vs executing a loaded file as a template

File templates with local parameters are not yet implemented,

### Misc

Comments are marked with double slashes `// this is a comment` and are removed before rendering.

TODO default/slot params
TODO string vs numeric params

### Collections (TBD/WIP)

A collection is an ordered list of slot variables

```
// defining a collection inline
{chapter1}
This is the first chapter.
{/chapter1}

{chapter2}
This is the second chapter.
{/chapter2}

{chapter3}
This is the last chapter.
{/chapter3}

[]chapters = chapter1, chapter2, chapter3
```

```
// example of iterating a collection
[chapters] => chapter
Chapter text:
{{chapter}}
This is the end of the chapter.
[/chapters]
```

```
// iterating a collection with index value
[chapters] => chapter,index
Chapter {{index+1}}:
{{chapter}}
This is the end of the chapter.
[/chapters]
```

// TODO how to append to collection

// TODO what steps to take in compilation?
// remove comments
// get/validate all slot definitions, error if there are unmatched opening or closing tags
// remove slot definitions
// check for collection defs, load them (error if referencing unknown snippets) and remove those from the page
// render collections
// render all variables (will need to be called recursively because snippets can contain vars)
// we're done? (no we still need to run the gpt query)

// next step is then to put the result of a template render+gpt call into a snippet for dynamic use
// so if I have a collection of book chapters I need a syntax to run a prompt on each one and then join the results into a single piece of text
%gpt%
This is the prompt that will be sent to gpt
%gpt%
// what if I wanted to put the results into a collection?
// need a way to define the name of each snippet inside the collection
// basically need a mapping function
[]chapterSummaries => [chapters] => chapter,index
%gpt%
Please summarize this chapter of the book "Faceless Killers"
{{chapter}}
%/gpt%
[]/chapterSummaries
