# PromptShaper

PromptShaper is a templating language and CLI tool for efficiently constructing LLM prompts. Build dynamic, reusable prompts with variables, functions, and file/url loading capabilities.

## Why

I'm a programmer, and like many I've seen productivity gains due to the assistance of LLMs. The standard way of interacting with a model through a chat interface works great for basic queries, but I do a lot of what I call "non-linear" workflows and found myself spending too much time copying and pasting text fragments to construct the exact prompts I wanted to run. I was working on my own custom LLM chat client and wanted to build a UI to construct dynamic and reusable prompts to send to the OpenAI API and realized I needed an engine to run it. Inspired by templating engines like Handlebars, I built my own variant specifically designed for executing highly customized GPT/LLM prompts.

## Features

- **Templating Engine**: Work out of a text editor/IDE and save a lot of time by avoiding repetitive copy/pasting of text fragments. Through the use of slots, variables, and functions you can dynamically load and render text into LLM prompts.
- **CLI**: A variety of command-line options to customize usage, and you can specify various input/output formats.
- **Directory Loading with Ignore Patterns**: Load entire codebases while intelligently excluding build artifacts, dependencies, and other unwanted files using glob patterns (`node_modules`, `*.log`, `temp*`, etc.).
- **Inline Images**: Include images directly in your prompts using the `img` function, either by referencing local image files or remote URLs. The images are automatically encoded and attached to the prompt sent to the LLM.
- **Interactive Mode** (OpenAI key required): After constructing your prompt you can continue your conversation in the command line, or load a previous conversation from JSON or text and continue in interactive mode. You can even use PromptShaper tags in interactive mode!

## Requirements

- Node.js and yarn - https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
- Yarn package manager - https://yarnpkg.com/getting-started/install

## Installation & Usage

Run the CLI using npx (no installation required):
```bash
npx prompt-shaper [options] <input>
```

Or install globally with yarn:
```bash
yarn global add prompt-shaper
prompt-shaper [options] <input>
```

Run `npx prompt-shaper --help` to see a complete list of CLI options.

## CLI Options

### Input/Output Options
- `<input>` - Template file path or string (required unless using `-i` for new conversation)
- `-is, --is-string` - Treat input as a template string instead of file path
- `-s, --save <filePath>` - Save output to file path
- `-sj, --save-json <filePath>` - Save conversation as JSON file

### Mode Options
- `-r, --raw` - Raw mode (don't parse any PromptShaper tags)
- `-i, --interactive` - Enable interactive mode with OpenAI
- `-g, --generate` - Send parsed template to OpenAI and return single response
- `--no-llm` - Disable all LLM calls and interactive mode (template processing only)

### LLM Configuration
- `-m, --model <modelType>` - OpenAI model to use (default: "gpt-4o")
- `-sp, --system-prompt <promptString>` - System prompt for LLM conversation
- `-dp, --developer-prompt <promptString>` - Developer prompt for LLM conversation (used for o1/o3 models)
- `-rf, --response-format <format>` - Response format: "text" or "json_object" (default: "text")
- `-re, --reasoning-effort <effort>` - Reasoning effort for o1/o3 models: "low", "medium", or "high" (default: "high")

### Variable Input
- `-js, --json <jsonString>` - Input JSON variables as string
- `-jf, --json-file <filePath>` - Input JSON variables from file

### Conversation Management
- `-lj, --load-json <filePath>` - Load conversation from JSON file and continue in interactive mode
- `-lt, --load-text <filePath>` - Load conversation from text/markdown file and continue in interactive mode

### Display Options
- `-h, --hide-prompt` - Hide the initial prompt in the console output
- `-oa, --output-assistant` - Save only assistant responses to output files (filters out user prompts)
- `-d, --debug` - Show debug messages during parsing

### File Processing
- `-e, --extensions <extensions>` - Comma-separated list of file extensions to include when using `loadDir()` function
- `--ignore-patterns <patterns>` - Comma-separated patterns to ignore when loading directories (supports glob patterns like `*.log`, `temp*`)

## Environment Variables

All CLI options can be set using environment variables. Command-line options take precedence over environment variables.

| Environment Variable | CLI Option | Description |
|---------------------|------------|-------------|
| `OPENAI_API_KEY` | N/A | **Required** for OpenAI integration |
| `PROMPT_SHAPER_DEBUG` | `-d, --debug` | Show debug messages ("true"/"false") |
| `PROMPT_SHAPER_FILE_EXTENSIONS` | `-e, --extensions` | Comma-separated file extensions |
| `PROMPT_SHAPER_IGNORE_PATTERNS` | `--ignore-patterns` | Comma-separated ignore patterns |
| `PROMPT_SHAPER_GENERATE` | `-g, --generate` | Send to OpenAI for single response ("true"/"false") |
| `PROMPT_SHAPER_HIDE_PROMPT` | `-h, --hide-prompt` | Hide initial prompt ("true"/"false") |
| `PROMPT_SHAPER_IS_STRING` | `-is, --is-string` | Treat input as string ("true"/"false") |
| `PROMPT_SHAPER_INTERACTIVE` | `-i, --interactive` | Enable interactive mode ("true"/"false") |
| `PROMPT_SHAPER_JSON` | `-js, --json` | JSON variables string |
| `PROMPT_SHAPER_JSON_FILE` | `-jf, --json-file` | JSON variables file path |
| `PROMPT_SHAPER_LOAD_JSON` | `-lj, --load-json` | Load conversation from JSON |
| `PROMPT_SHAPER_LOAD_TEXT` | `-lt, --load-text` | Load conversation from text |
| `PROMPT_SHAPER_MODEL` | `-m, --model` | OpenAI model name |
| `PROMPT_SHAPER_NO_LLM` | `--no-llm` | Disable all LLM calls ("true"/"false") |
| `PROMPT_SHAPER_OUTPUT_ASSISTANT` | `-oa, --output-assistant` | Output only assistant responses ("true"/"false") |
| `PROMPT_SHAPER_SYSTEM_PROMPT` | `-sp, --system-prompt` | System prompt text |
| `PROMPT_SHAPER_DEVELOPER_PROMPT` | `-dp, --developer-prompt` | Developer prompt text |
| `PROMPT_SHAPER_RAW` | `-r, --raw` | Raw mode ("true"/"false") |
| `PROMPT_SHAPER_SAVE` | `-s, --save` | Output file path |
| `PROMPT_SHAPER_SAVE_JSON` | `-sj, --save-json` | JSON output file path |
| `PROMPT_SHAPER_RESPONSE_FORMAT` | `-rf, --response-format` | Response format ("text"/"json_object") |
| `PROMPT_SHAPER_REASONING_EFFORT` | `-re, --reasoning-effort` | Reasoning effort ("low"/"medium"/"high") |

## Usage Examples

### Basic Template Processing
```bash
# Process a template file
npx prompt-shaper my_template.ps.md

# Process a template string
npx prompt-shaper -is "Hello, {{name}}!" -js '{"name": "World"}'

# Save output to file
npx prompt-shaper my_template.ps.md -s output.md
```

### Interactive Mode with OpenAI
```bash
# Start new conversation in interactive mode
npx prompt-shaper -i

# Process template and continue conversation
npx prompt-shaper my_template.ps.md -i

# Load previous conversation and continue
npx prompt-shaper -lt previous_conversation.md
```

### Raw Mode (No Parsing)
```bash
# Process file without parsing PromptShaper tags
npx prompt-shaper -r my_file.js

# Useful for code analysis while preserving syntax
npx prompt-shaper -r -i my_code.py
```

### Template-Only Mode (No LLM)
```bash
# Process templates without any LLM integration
npx prompt-shaper my_template.ps.md --no-llm

# Save processed template to file
npx prompt-shaper my_template.ps.md --no-llm -s output.md

# Use with template strings
npx prompt-shaper -is "{name=\"World\"}Hello {{name}}!" --no-llm

# Using environment variable
export PROMPT_SHAPER_NO_LLM=true
npx prompt-shaper my_template.ps.md

# Template processing with directory loading
npx prompt-shaper -is "{{loadDir(\"src\")}}" --no-llm -e "js,ts"
```

### Directory Loading with Ignore Patterns
```bash
# Method 1: Using ignore patterns in the template function
echo '{{loadDir(".", "node_modules,.git,dist,*.log")}}' > load_project.ps.md
npx prompt-shaper load_project.ps.md -e "js,ts,md"

# Method 2: Using CLI ignore patterns option (applies to all loadDir calls)
echo '{{loadDir(".")}}' > load_project.ps.md
npx prompt-shaper load_project.ps.md -e "js,ts,md" --ignore-patterns "node_modules,.git,dist,*.log"

# Method 3: Using environment variable
export PROMPT_SHAPER_IGNORE_PATTERNS="node_modules,.git,dist,*.log"
npx prompt-shaper load_project.ps.md -e "js,ts,md"
```

### Advanced Usage
```bash
# Use specific model with custom prompts
npx prompt-shaper my_template.ps.md -m gpt-4 -sp "You are a code reviewer"

# Generate single response with JSON output
npx prompt-shaper my_template.ps.md -g -rf json_object

# Load variables from file and hide initial prompt
npx prompt-shaper my_template.ps.md -jf variables.json -h
```

## Templates, Slots, Variables

A template is a file or string that gets loaded into a variable by the PromptShaper parser and is then rendered.

Templates can contain one or more inline variable definitions. They are defined using single braces and can be single line or multi line using tags.

```
{stringVariable = "hello world"}

{multilineVariable}
This is a variable spanning multiple lines, but the tags can be used on a single line if desired. Multiline variables are always strings.
{/multilineVariable}
```

A template can contain one or more slots which are rendered by replacing their content with variables.

```
This will render the contents of the string variable: {{stringVariable}}

This will render the contents of the multiline variable, and the @ symbol means it will be rendered as raw text (will not be parsed): {{@multilineVariable}}
```

A multiline variable can contain slot tags, which will be rendered recursively when the template is rendered.

```
{variableWithSlots}
This variable contains a slot which is defined in the outer scope: {{stringVariable}}
{/variableWithSlots}
```

## Parameters and Functions

A multiline variable can also be specified with parameters (which are required if no default is provided) which can be referenced using slots. Parameters are strings.

```
{variableWithParameters(requiredParameter, optionalParameter="hello")}
{{requiredParameter}}
{{optionalParameter}}
{/variableWithParameters}
```

A slot or variable can be assigned the contents of a function, which is called using a function name and one or more parameters in parentheses.

```
// this will load file.ps.md and render it in place
{{load("file.ps.md")}}
```

There's a few basic functions defined in the `functions.ts` file and you can add your own using `registerFunction`.

## Built-in Functions

By default, the `parser.ts` uses the contents of `functions.ts` as built-in functions. You can add your own custom functions with `registerFunction`.

### File Operations
- **load(filePath)**: Loads a file from the specified path and renders its content.
```
// loads and renders the content of file.ps.md
{{load("file.ps.md")}}
```

- **loadDir(dirPath, ignorePatterns)**: Loads all files from the specified directory (and its subdirectories) that match certain extensions, and renders their contents. **Note**: The `loadDir` function uses the file extensions specified in the `--extensions` CLI option or the `PROMPT_SHAPER_FILE_EXTENSIONS` environment variable to determine which files to include. By default, it includes common text and code file extensions.
```
// loads and renders all files in the 'src' directory
{{loadDir("src")}}

// loads files but ignores node_modules, .git, and dist directories
{{loadDir("src", "node_modules,.git,dist")}}

// supports glob patterns - ignores all .log files and temp* files
{{loadDir("logs", "*.log,temp*,.DS_Store")}}
```

- **loadUrl(url)**: Loads content from the specified URL and uses the [@mozilla/readability](https://github.com/mozilla/readability) library to convert it into readable text.
```
// loads and renders the Prompt Shaper GitHub page
{{loadUrl("https://github.com/PrajnaAvidya/prompt-shaper")}}
```

### Image Processing
- **img(source)**: Loads an image from a local file path or a URL, encodes it, and attaches it as image content in your LLM prompt. Images are automatically converted to JPEG format for OpenAI compatibility.
```
{{img("path/to/image.png")}}
{{img("https://example.com/image.jpg")}}
```


## String Parameters

All parameters are strings and must be double-quoted.

## Special Features

### Comment Handling
Comments are marked with double slashes `// this is a comment` or `/* multiline style */` and are removed before rendering in normal mode. In raw mode (`-r`), all comments are preserved.

### Escaping
You can escape braces with backslashes so they won't be parsed as tags: `\{\{escapedSlot\}\}`

You can escape braces or double quotes in string parameters: `{{functionCall("param \" with \} special chars")}}`

### Ignore Patterns for Directory Loading
The `loadDir` function supports ignore patterns to exclude specific files and directories:

- **Exact names**: `node_modules`, `.git`, `.DS_Store`
- **Glob patterns**: `*.log`, `temp*`, `*.test.*`
- **Pattern examples**:
  - `node_modules` - ignores any file/directory named exactly "node_modules"
  - `*.log` - ignores all files ending with ".log" 
  - `temp*` - ignores all files/directories starting with "temp"
  - `.DS_Store` - ignores macOS system files

```
// ignore common development directories
{{loadDir(".", "node_modules,.git,dist,coverage")}}

// ignore temporary and log files
{{loadDir("src", "*.tmp,*.log,temp*")}}
```

### Markdown Code Block Protection
PromptShaper automatically detects and preserves content inside markdown code blocks:

```markdown
Here's some code:
```javascript
{variable = "this won't be parsed"}
console.log({{variable}});
```
But this {{will}} be parsed.
```

Both fenced code blocks (triple backticks) and inline code (`single backticks`) are protected.

## Template Parsing/Rendering Order

1. Mask markdown code blocks to prevent parsing their content
2. Preprocess multiline variables that contain problematic syntax
3. Remove comments (unless in raw mode)
4. Match and validate all variables and slots  
5. Remove variable definitions from output
6. Render slots with variable data from the bottom up
7. String variables will be parsed recursively (variables/slots within them will be rendered)
8. Restore masked code blocks
9. Remove excess whitespace

## Examples and Samples

The `samples` directory contains comprehensive examples demonstrating all PromptShaper features. These samples provide practical learning materials and reference implementations for every major capability.

### Quick Start with Samples

```bash
# Run the overview sample for a complete feature demonstration
npx prompt-shaper samples/00-overview.ps.md --no-llm

# Try basic variable examples
npx prompt-shaper samples/01-basic-variables.ps.md --no-llm

# Explore file loading capabilities
npx prompt-shaper samples/07-load-files.ps.md --no-llm

# Test directory loading with file filtering
npx prompt-shaper samples/08-load-directories.ps.md --no-llm -e "js,json,md"
```

### Testing All Samples

A comprehensive regression testing system verifies that all samples work correctly and detects any changes in behavior:

```bash
# Run the automated sample test suite with regression detection
./test-samples.sh

# Regenerate reference outputs (after intentional changes)
./generate-sample-outputs.sh
```

The test system compares current sample outputs against reference outputs stored in `sample-outputs/` to catch regressions. It runs automatically in CI and will fail the build if any sample breaks or produces different output.

## Terminology

- **Template** - A piece of text that is rendered by the parser. I'm using the .ps.md extension for the samples.
- **Variable** - A value loaded from a template file, or defined inline in a template. Variables are defined using single braces and are either defined as a single tag, or with matching tags wrapped around text. String variables can be rendered as templates.
- **Slot** - Renders the contents of a variable or function using double braces.
- **Parameters** - One or more arguments passed to a slot or a function. Parameters are strings.
- **Function** - Does "something" and the result is rendered on page, or assigned to a variable.
- **Raw Mode** - Processing mode where PromptShaper tags are not parsed, useful for code analysis or preserving exact syntax.
- **Template-Only Mode** - Processing mode where LLM integration is disabled using `--no-llm`, useful for pure templating without requiring an OpenAI API key.

**Note: You must set the OPENAI_API_KEY environment variable for LLM features (`--interactive`, `--generate`) to work. Template processing with `--no-llm` requires no API key.**
