# Nested Variables and Raw Text Example

This sample demonstrates nested variable structures and raw text rendering using the @ symbol.

{template = "PromptShaper"}
{rawExample = "This {{will}} not be parsed as a slot"}

{outerVariable}
This is the outer variable containing: {{template}}

{innerVariable}
This is an inner variable that will be rendered within the outer one.
{/innerVariable}

Inner content: {{innerVariable}}
{/outerVariable}

{codeTemplate}
// This shows how to use {{template}} in your code
function processTemplate() {
    return "{{template}} processed successfully";
}
{/codeTemplate}

## Nested Rendering Example

{{outerVariable}}

## Raw Text Rendering Example

Using @ symbol to prevent parsing:
{{@rawExample}}

Normal parsing (this will show empty because 'will' variable is not defined):
{{rawExample}}

## Code Template Example

{{@codeTemplate}}