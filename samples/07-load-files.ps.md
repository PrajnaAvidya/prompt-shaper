# Load Files Example

This sample demonstrates the `load()` function for including external file content.

## Loading Text Files

Loading a simple text file:
{{load("samples/sample-data/hello.txt")}}

## Loading Code Files

Loading a JavaScript file:
{{load("samples/sample-data/example.js")}}

## Loading Markdown Files

Loading another PromptShaper template:
{{load("samples/sample-data/sub-template.ps.md")}}

## Using Load with Relative Paths

Loading configuration file:
{{load("samples/sample-data/config.json")}}

## Best Practices

- Use relative paths from the project root
- Include file extensions for proper syntax highlighting
- The load function automatically wraps content in code blocks with appropriate language tags