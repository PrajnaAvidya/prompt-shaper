# PromptShaper Samples

This directory contains comprehensive examples demonstrating all major features of PromptShaper v5.0.

## Overview

Start here: [`00-overview.ps.md`](00-overview.ps.md) - Complete feature overview and quick start guide.

## Core Features

### Basic Templating
- [`01-basic-variables.ps.md`](01-basic-variables.ps.md) - Single-line variable definitions and slot rendering
- [`02-multiline-variables.ps.md`](02-multiline-variables.ps.md) - Complex multiline content and formatting
- [`03-variables-with-parameters.ps.md`](03-variables-with-parameters.ps.md) - Reusable templates with parameters

### Advanced Templating
- [`04-nested-and-raw.ps.md`](04-nested-and-raw.ps.md) - Nested variable structures and raw text rendering
- [`05-escaping.ps.md`](05-escaping.ps.md) - Character escaping for special characters and template syntax
- [`06-comments.ps.md`](06-comments.ps.md) - Single-line, multiline, and inline comments

### File Operations
- [`07-load-files.ps.md`](07-load-files.ps.md) - Loading individual files with the `load()` function
- [`08-load-directories.ps.md`](08-load-directories.ps.md) - Loading directory contents with filtering using `loadDir()`

### External Content
- [`09-load-urls.ps.md`](09-load-urls.ps.md) - Fetching web content with `loadUrl()` function
- [`10-images.ps.md`](10-images.ps.md) - Including local and remote images with `img()` function

### CLI and Processing
- [`11-cli-modes.ps.md`](11-cli-modes.ps.md) - CLI options, modes, and processing flags
- [`12-markdown-protection.ps.md`](12-markdown-protection.ps.md) - Markdown code block protection features

## Running the Samples

### Template-Only Mode (No LLM Required)
```bash
# Process templates without LLM integration
prompt-shaper samples/01-basic-variables.ps.md --no-llm
prompt-shaper samples/07-load-files.ps.md --no-llm
```

### With File Extensions
```bash
# Specify file extensions for loadDir examples
prompt-shaper samples/08-load-directories.ps.md --no-llm -e "js,json,md,css"
```

### Raw Mode
```bash
# View templates without processing
prompt-shaper samples/05-escaping.ps.md --raw
```

### Interactive Mode (Requires OpenAI API Key)
```bash
# Start interactive chat with processed template
export OPENAI_API_KEY="your-key-here"
prompt-shaper samples/00-overview.ps.md --interactive
```

## Sample Data

The [`sample-data/`](sample-data/) directory contains supporting files used by the examples:

- `hello.txt` - Simple text content
- `example.js` - JavaScript code example
- `config.json` - JSON configuration file
- `styles.css` - CSS stylesheet
- `sub-template.ps.md` - PromptShaper sub-template
- `README.md` - Documentation
- `temp.log` - Example file for ignore patterns
- `example-image.png` - Minimal test image

## Testing All Samples

Run this script to test all samples:

```bash
#!/bin/bash
echo "Testing all PromptShaper samples..."

# Basic samples (no external dependencies)
for file in samples/0{0,1,2,3,4,5,6}-*.ps.md; do
    echo "Testing $file..."
    prompt-shaper "$file" --no-llm > /dev/null || echo "❌ $file failed"
done

# File operation samples
for file in samples/0{7,8}-*.ps.md; do
    echo "Testing $file..."
    prompt-shaper "$file" --no-llm -e "js,json,md,css,txt" > /dev/null || echo "❌ $file failed"
done

# CLI and markdown samples
for file in samples/{11,12}-*.ps.md; do
    echo "Testing $file..."
    prompt-shaper "$file" --no-llm > /dev/null || echo "❌ $file failed"
done

echo "✅ Sample testing complete!"
```

## Requirements

- **Core samples**: No additional dependencies
- **URL loading** (`09-load-urls.ps.md`): Requires `@mozilla/readability` and `jsdom`
- **Image processing** (`10-images.ps.md`): Uses built-in Sharp library
- **Interactive samples**: Requires `OPENAI_API_KEY` environment variable

## Notes

- All samples are designed to work with the `--no-llm` flag for testing without LLM integration
- File and directory loading examples use the `sample-data/` directory
- Image examples include both local and remote image references
- Samples demonstrate current v5.0 functionality only (no arithmetic functions)