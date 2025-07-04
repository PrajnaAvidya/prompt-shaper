# CLI Modes and Options Example

This sample demonstrates different CLI modes and processing options.

{appName = "PromptShaper"}
{version = "5.0"}

# {{appName}} CLI Demo

Welcome to {{appName}} version {{version}}!

## Template-Only Mode

Process templates without LLM integration:
```bash
prompt-shaper samples/11-cli-modes.ps.md --no-llm
```

## Raw Mode

View the raw template without processing:
```bash
prompt-shaper samples/11-cli-modes.ps.md --raw
```

## Interactive Mode

Start a conversation with the LLM:
```bash
prompt-shaper samples/11-cli-modes.ps.md --interactive
```

## Generate Mode

Get a single response from the LLM:
```bash
prompt-shaper samples/11-cli-modes.ps.md --generate
```

## Processing Options

### Save Output
```bash
prompt-shaper samples/11-cli-modes.ps.md --no-llm --save output.txt
```

### Hide Initial Prompt
```bash
prompt-shaper samples/11-cli-modes.ps.md --no-llm --hide-prompt
```

### Debug Mode
```bash
prompt-shaper samples/11-cli-modes.ps.md --no-llm --debug
```

### File Extensions for loadDir
```bash
prompt-shaper samples/08-load-directories.ps.md --no-llm -e "js,json,md"
```

### Ignore Patterns
```bash
prompt-shaper samples/08-load-directories.ps.md --no-llm --ignore-patterns "*.log,temp*"
```

## String Input

Process template strings directly:
```bash
prompt-shaper -is "{name=\"World\"}Hello {{name}}!" --no-llm
```

## JSON Variables

Provide variables via JSON:
```bash
prompt-shaper -is "Hello {{name}}!" -js '{"name": "PromptShaper"}' --no-llm
```