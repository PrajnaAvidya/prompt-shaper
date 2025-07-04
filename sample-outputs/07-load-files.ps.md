# Load Files Example

This sample demonstrates the `load()` function for including external file content.

## Loading Text Files

Loading a simple text file:

File: samples/sample-data/hello.txt
```txt
Hello from an external file!
This content is loaded using the load() function.
```

## Loading Code Files

Loading a JavaScript file:

File: samples/sample-data/example.js
```js

function greet(name) {
    return `Hello, ${name}! Welcome to PromptShaper.`;
}

const message = greet("Developer");
console.log(message);
```

## Loading Markdown Files

Loading another PromptShaper template:

File: samples/sample-data/sub-template.ps.md
```md
{subTitle = "Sub-template Content"}

## {{subTitle}}

This is content from a sub-template that demonstrates nested template loading.
```

## Using Load with Relative Paths

Loading configuration file:

File: samples/sample-data/config.json
```json
{
  "name": "PromptShaper",
  "version": "5.0.0",
  "description": "Templating language for LLM prompts",
  "features": [
    "variables",
    "file loading",
    "directory loading",
    "image processing"
  ]
}
```

## Best Practices

- Use relative paths from the project root
- Include file extensions for proper syntax highlighting
- The load function automatically wraps content in code blocks with appropriate language tags
