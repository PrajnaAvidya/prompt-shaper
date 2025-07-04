# Comments Example

This sample demonstrates different types of comments in PromptShaper templates.

// This is a single-line comment and will be removed during processing
{title = "PromptShaper Comments Demo"}

/*
This is a multiline comment.
It can span multiple lines
and will be completely removed during processing.
*/

{content = "Main content here"} // Inline comment after variable definition

{description}
PromptShaper supports both single-line (//) and multiline (/* */) comments.
// This comment inside a multiline variable will be removed
Comments are useful for documentation and notes.
{/description}

## Output Content

{{title}}

{{content}} // This inline comment will be removed

{{description}}

// Final comment at the end

/*
Note: All comments in this template will be removed
during normal processing, but preserved in raw mode.
*/