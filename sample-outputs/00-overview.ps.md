# PromptShaper Overview and Quick Start

This is a comprehensive overview of PromptShaper's capabilities and syntax.

# Welcome to PromptShaper 5.0

PromptShaper is a templating language specifically designed for constructing LLM prompts. Created by Prajna Avidya, it provides powerful features for dynamic, reusable prompt creation.

## Quick Syntax Reference

### Variables
```
{variable = "value"}          // Single-line variable
{multiline}                   // Multiline variable start
Content here
{/multiline}                  // Multiline variable end
```

### Slots
```
{{variable}}                  // Render variable
{{@variable}}                 // Render as raw text (no parsing)
```

### Functions
```
{{load("file.txt")}}          // Load file content
{{loadDir("path")}}           // Load directory contents
{{loadUrl("https://...")}}    // Load URL content
{{img("image.png")}}          // Include image
```

## Key Features Demonstrated

### 1. Template Processing
- Basic variable definition and rendering
- Multiline content with complex formatting
- Parameter-based templates for reusability

### 2. File Operations
- Load individual files with syntax highlighting
- Load entire directories with filtering
- Fetch content from web URLs

### 3. Media Integration
- Include images from local files or URLs
- Automatic encoding for LLM compatibility

### 4. Advanced Features
- Markdown code block protection
- Comment removal (single-line and multiline)
- Character escaping for special cases
- Raw text rendering

### 5. CLI Processing Modes
- Template-only mode (`--no-llm`)
- Interactive chat mode (`--interactive`)
- Single response generation (`--generate`)
- Raw template viewing (`--raw`)

## Getting Started

1. **Install**: `yarn global add prompt-shaper`
2. **Basic usage**: `prompt-shaper template.ps.md`
3. **Template-only**: `prompt-shaper template.ps.md --no-llm`
4. **Interactive**: `prompt-shaper template.ps.md --interactive`

## Sample Files Overview

- `01-basic-variables.ps.md` - Variable definitions and slots
- `02-multiline-variables.ps.md` - Complex multiline content
- `03-variables-with-parameters.ps.md` - Reusable templates
- `04-nested-and-raw.ps.md` - Nested structures and raw rendering
- `05-escaping.ps.md` - Character escaping techniques
- `06-comments.ps.md` - Comment syntax and removal
- `07-load-files.ps.md` - File loading examples
- `08-load-directories.ps.md` - Directory loading with filtering
- `09-load-urls.ps.md` - Web content fetching
- `10-images.ps.md` - Image integration
- `11-cli-modes.ps.md` - CLI options and modes
- `12-markdown-protection.ps.md` - Code block protection

## Try It Now

Run this overview:
```bash
prompt-shaper samples/00-overview.ps.md --no-llm
```

Explore other samples:
```bash
prompt-shaper samples/01-basic-variables.ps.md --no-llm
prompt-shaper samples/07-load-files.ps.md --no-llm
```
