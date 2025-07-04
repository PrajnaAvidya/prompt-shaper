# Escaping Characters Example

This sample demonstrates how to escape special characters in PromptShaper templates.

## Escaping Braces

To show literal braces without parsing:
- Escaped slot: {{greeting}}
- Normal slot: Hello, World!

## Escaping Quotes in Variables

She said, Welcome to PromptShaper!

## Path Examples

Path: /home/user/projects

## Showing Template Syntax

To display template syntax literally:
- Variable definition: {variable = "value"}
- Slot reference: {{variable}}
- Multiline variable: {variable}content{/variable}

## Mixed Content

Normal: Hello, World!
Escaped: {{greeting}}
Raw: Hello, World!
