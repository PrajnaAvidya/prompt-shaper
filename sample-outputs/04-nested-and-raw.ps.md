# Nested Variables and Raw Text Example

This sample demonstrates nested variable structures and raw text rendering using the @ symbol.

## Nested Rendering Example

This is the outer variable containing: PromptShaper

Inner content: 
This is an inner variable that will be rendered within the outer one.

## Raw Text Rendering Example

Using @ symbol to prevent parsing:
This {{will}} not be parsed as a slot

Normal parsing (this will show empty because 'will' variable is not defined):
This {{will}} not be parsed as a slot

## Code Template Example

function processTemplate() {
    return "{{template}} processed successfully";
}
