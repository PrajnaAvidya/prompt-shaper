// working draft of my prompt construction scriping language
// (comments are not added to the final prompt)
// TODO should there be some option/setting to separate snippets by == or not? (e.g. when iterating a collection)

### Slots

this is the syntax for injecting a slot variable. the atomic unit of re-useable text: `{{summarizePrompt}}`

a slot with variables (all variables are strings and must be double-quoted and double quotes can be escaped with a backslash): `{{coverLetterIntro(companyName="Prajna Concepts", year="2023")}}`

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

// this is a collection of slots
// example of iterating a collection (will just print each member in order)
[chapters]

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

// defining a collection
[]chapters = chapter1, chapter2, chapter3
// TODO how to append

// TODO what steps to take in compilation?
// first get/validate all snippet definitions, error if there are unmatched opening or closing tags
// then remove those from the page (and comments)
// then check for collection defs, load them (error if referencing unknown snippets) and then remove those from the page
// then render collections
// then render all variables (will need to be called recursively because snippets can contain vars)
// then we're done? (no we still need to run the gpt query)

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
