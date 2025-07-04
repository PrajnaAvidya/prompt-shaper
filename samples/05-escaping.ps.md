# Escaping Characters Example

This sample demonstrates how to escape special characters in PromptShaper templates.

{greeting = "Hello, World!"}
{example = "This is an \"escaped quote\" example"}

## Escaping Braces

To show literal braces without parsing:
- Escaped slot: \{\{greeting\}\}
- Normal slot: {{greeting}}

## Escaping Quotes in Variables

{quotedText = "She said, Welcome to PromptShaper!"}

{{quotedText}}

## Path Examples

{complexExample = "Path: /home/user/projects"}

{{complexExample}}

## Showing Template Syntax

To display template syntax literally:
- Variable definition: \{variable = "value"\}
- Slot reference: \{\{variable\}\}
- Multiline variable: \{variable\}content\{/variable\}

## Mixed Content

Normal: {{greeting}}
Escaped: \{\{greeting\}\}
Raw: {{@greeting}}