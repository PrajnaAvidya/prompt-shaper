# Markdown Code Block Protection Example

This sample demonstrates how PromptShaper protects content inside markdown code blocks from being parsed.

## Fenced Code Blocks

Content inside fenced code blocks is protected:

```javascript
{notParsed = "This won't be processed"}
function example() {
    return "{{templateVar}} - this slot won't be parsed";
}
```

```python
# This Python code is also protected
{variable = "not processed"}
print("{{greeting}} - this slot is ignored")
```

## Inline Code

Content in `{inline = "code"}` and `{{slots}}` is also protected.

## Normal Processing

Outside of code blocks, everything works normally:
- This should be parsed
- Language: javascript

## Mixed Content Example

Here's some normal text with This should be parsed.

```{{language}}
// This code block uses a variable in the language tag
{example = "but this variable definition is ignored"}
console.log("{{templateVar}} - this slot is ignored");
```

But this This should be parsed is parsed normally.

## Complex Example

```yaml
# YAML configuration (protected)
app:
  name: "{{appName}}"  # This slot won't be parsed
  settings:
    {debug: true}      # This variable won't be defined
```

Outside the code block: This should be parsed works fine.

## Backtick Variations

Single backticks: `{var = "ignored"}` and `{{slot}}` are protected.

Triple backticks with language:
```json
{
  "template": "{{ignored}}",
  "variable": "{notProcessed = 'value'}"
}
```

This protection ensures your code examples remain intact!
