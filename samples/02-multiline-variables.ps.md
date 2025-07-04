# Multiline Variables Example

This sample demonstrates multiline variables, which can span multiple lines and contain complex content.

{introduction}
PromptShaper is a powerful templating language designed specifically for constructing LLM prompts.

Key features include:
- Variable definitions and slot rendering
- File and directory loading capabilities  
- URL content fetching
- Image integration
- Template-only processing mode
{/introduction}

{codeExample}
```javascript
function greet(name) {
    return `Hello, ${name}!`;
}

console.log(greet("PromptShaper"));
```
{/codeExample}

{instructions}
To use this template:

1. Define your variables using single braces
2. Reference variables using double braces
3. Process with: `prompt-shaper template.ps.md`
{/instructions}

## Output

{{introduction}}

Here's a code example:
{{codeExample}}

{{instructions}}