# Basic Variables Example

This sample demonstrates the simplest form of variable definition and usage in PromptShaper.

{name = "PromptShaper"}
{version = "5.0"}
{description = "A templating language for LLM prompts"}

Welcome to {{name}} version {{version}}!

{{description}} makes it easy to create dynamic, reusable prompts.

## Single-line Variables
Variables can be defined on a single line using the syntax: `{variable = "value"}`

{greeting = "Hello, World!"}
{user = "Developer"}
{status = "active"}

{{greeting}} This message is for {{user}} with status: {{status}}.