# Variables with Parameters Example

This sample demonstrates how to create reusable variable templates with parameters.

{greeting(name, time="morning")}
Good {{time}}, {{name}}! Welcome to PromptShaper.
{/greeting}

{codeBlock(language, code)}
```{{language}}
{{code}}
```
{/codeBlock}

{section(title, content)}
## {{title}}

{{content}}

---
{/section}

## Using Variables with Parameters

{{greeting("Alice")}}

{{greeting("Bob", "evening")}}

{{codeBlock("python", "print('Hello, World!')")}}

{{codeBlock("javascript", "console.log('Hello, World!');")}}

{{section("Getting Started", "Install PromptShaper using yarn or npm")}}

{{section("Documentation", "Check the README.md file for detailed usage instructions")}}