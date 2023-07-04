# PromptShape

Working draft of my prompt construction scripting language

### Why

I'm a programmer and like many others I've seen great productivity gains due to the assistance of LLMs. the standard way of interacting with GPT through a chat interface works great for a lot of things, but I do a lot of what I would call "non-linear" workflows and find myself spending a lot of time copying and pasting out of text files to construct the exact prompts I want to run. I wanted to add a UI to do some of these tasks in Prajna Chat (my custom GPT client) but decided that first I needed some kind of engine to run all this. after looking into existing templating engines like Handlebars I decided nothing out there was quite what I'm looking for so decided to build my own templating language specifically designed for running GPT/LLM prompts. the idea is that you could just work out of a text file and save a lot of time vs doing a bunch of copy/pasting of repeatedly used text fragments. or you could build a UI around it and make it even more powerful.

### Templates
A template is either a file (for the included samples I'm using the .ps.txt extension) or defined inline in a template file.

Here's an example of an inline template which is defined using single bracket tags (it will become a variable called `basicTemplate`):
```
{basicTemplate}
This is the most basic example of an inline variable with no parameters
{/basicTemplate}
```

Comments are marked with double slashes `// this is a comment` and are removed before rendering.

### Variables
The contents of templates will be loaded into variables which are available to render inside other templates.

### Slots and Parameters
Templates can contain slots (defined using double brackets) which will render content stored inside variables. Slots can reference a global definition (i.e. an inline template), or a variable specific to the current template which is called a parameter.

```
{templateWithGlobalSlot}
This template loads and renders a variable called contactInfo:
{{contactInfo}}
{/templateWithGlobalSlot}
```

```
{templateWithParameters(phoneNumber, zipCode}
This template displays a phone number and zip code:
Phone Number: {{phoneNumber}}
Zip Code: {{zipCode}}
{/templateWithParameters}
```

TODO default/slot params
TODO string vs numeric params

### Slots

this is the syntax for injecting a slot variable. the atomic unit of re-useable text: `{{summarizePrompt}}`

a slot with parameters: `{{coverLetterIntro(companyName="Prajna Concepts", year=2023)}}`

all parameters are either strings or numbers (strings are double-quoted, you can use a backslash to escape double quotes in string parameters e.g. "\"this string \" has quotes\"")

slots are either defined inline

a basic slot definition:
```
{coverLetterIntro}
Hello,

My name is Rafiq, and I'm excited to apply for the position at this company!
{/coverLetterIntro}
```

a slot definition containing slot variables:
```
{coverLetterIntro}
Hello,

My name is Rafiq, and I'm excited to apply for the position of {{Position}} at {{CompanyName}}!
{/coverLetterIntro}
```

### Collections (TBD/WIP)

A collection is an ordered list of slot variables

// example of iterating a collection (will just print each member in order) `[chapters]`

// iterating a collection with custom output
[chapters] => chapter,index
Chapter {{index+1}} // TODO do we really need to support expressions? that means we need to differentiate between string/number slot types.
{{chapter}}
This is the end of the chapter.
[/chapters]

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

// TODO how to append

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

// could something like this work?
{bookSummary}
[chapters] => chapter,index
%gpt%
Please summarize this chapter of the book "Faceless Killers" in 2-3 paragraphs:
==
Chapter {{index}}:
{{chapter}}
%/gpt%
[/chapters]
{/bookSummary}

// what if I wanted to put the results into a collection?
// need a way to define the name of each snippet inside the collection
// basically need a mapping function
[]chapterSummaries => [chapters] => chapter,index
%gpt%
Please summarize this chapter of the book "Faceless Killers"
{{chapter}}
%/gpt%
[]/chapterSummaries
