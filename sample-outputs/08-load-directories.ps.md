# Load Directories Example

This sample demonstrates the `loadDir()` function for loading multiple files from directories.

## Basic Directory Loading

Loading all files from the sample-data directory:

File: samples/sample-data/README.md
```md
# Sample Data Directory

This directory contains sample files used by PromptShaper examples.

## Files:

- `hello.txt` - Simple text file
- `example.js` - JavaScript code example
- `config.json` - Configuration file
- `styles.css` - CSS stylesheet
- `sub-template.ps.md` - PromptShaper sub-template
```

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

File: samples/sample-data/example.js
```js

function greet(name) {
    return `Hello, ${name}! Welcome to PromptShaper.`;
}

const message = greet("Developer");
console.log(message);
```

File: samples/sample-data/hello.txt
```txt
Hello from an external file!
This content is loaded using the load() function.
```

File: samples/sample-data/styles.css
```css

.prompt-shaper {
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    padding: 1rem;
    border-radius: 4px;
}

.template {
    font-family: monospace;
    white-space: pre-wrap;
}
```

File: samples/sample-data/sub-template.ps.md
```md
{subTitle = "Sub-template Content"}

## {{subTitle}}

This is content from a sub-template that demonstrates nested template loading.
```

## Directory Loading with Ignore Patterns

Loading files but ignoring specific patterns:

File: samples/sample-data/README.md
```md
# Sample Data Directory

This directory contains sample files used by PromptShaper examples.

## Files:

- `hello.txt` - Simple text file
- `example.js` - JavaScript code example
- `config.json` - Configuration file
- `styles.css` - CSS stylesheet
- `sub-template.ps.md` - PromptShaper sub-template
```

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

File: samples/sample-data/example.js
```js

function greet(name) {
    return `Hello, ${name}! Welcome to PromptShaper.`;
}

const message = greet("Developer");
console.log(message);
```

File: samples/sample-data/hello.txt
```txt
Hello from an external file!
This content is loaded using the load() function.
```

File: samples/sample-data/styles.css
```css

.prompt-shaper {
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    padding: 1rem;
    border-radius: 4px;
}

.template {
    font-family: monospace;
    white-space: pre-wrap;
}
```

File: samples/sample-data/sub-template.ps.md
```md
{subTitle = "Sub-template Content"}

## {{subTitle}}

This is content from a sub-template that demonstrates nested template loading.
```

## Using CLI Extensions Filter

When using the CLI, you can specify file extensions:
```bash
yarn parse -- samples/08-load-directories.ps.md -e "js,json,md"
```

## Loading with Multiple Ignore Patterns

Loading samples/sample-data while ignoring temporary and backup files:

File: samples/sample-data/README.md
```md
# Sample Data Directory

This directory contains sample files used by PromptShaper examples.

## Files:

- `hello.txt` - Simple text file
- `example.js` - JavaScript code example
- `config.json` - Configuration file
- `styles.css` - CSS stylesheet
- `sub-template.ps.md` - PromptShaper sub-template
```

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

File: samples/sample-data/example.js
```js

function greet(name) {
    return `Hello, ${name}! Welcome to PromptShaper.`;
}

const message = greet("Developer");
console.log(message);
```

File: samples/sample-data/hello.txt
```txt
Hello from an external file!
This content is loaded using the load() function.
```

File: samples/sample-data/styles.css
```css

.prompt-shaper {
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    padding: 1rem;
    border-radius: 4px;
}

.template {
    font-family: monospace;
    white-space: pre-wrap;
}
```

File: samples/sample-data/sub-template.ps.md
```md
{subTitle = "Sub-template Content"}

## {{subTitle}}

This is content from a sub-template that demonstrates nested template loading.
```

## Best Practices

- Use the `-e` CLI option to specify which file extensions to include
- Use ignore patterns to exclude unwanted files (logs, temp files, etc.)
- Common ignore patterns: `node_modules,.git,dist,*.log,temp*,.DS_Store`
- Patterns support glob syntax: `*` for wildcards, exact names for specific files/dirs
