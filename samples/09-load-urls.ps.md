# Load URLs Example

This sample demonstrates the `loadUrl()` function for fetching content from web URLs.

**Note**: This requires the optional dependencies `@mozilla/readability` and `jsdom` to be installed.

## Loading Web Pages

Loading the PromptShaper GitHub repository:
{{loadUrl("https://github.com/PrajnaAvidya/prompt-shaper")}}

## Loading Documentation

Loading npm package information:
{{loadUrl("https://www.npmjs.com/package/prompt-shaper")}}

## Loading Documentation

Loading README from GitHub:
{{loadUrl("https://raw.githubusercontent.com/PrajnaAvidya/prompt-shaper/main/README.md")}}

## Best Practices

- URLs are automatically converted to readable text using Mozilla's readability library
- Works best with content-rich pages (articles, documentation, etc.)
- May not work well with heavily JavaScript-dependent sites
- Always test URLs to ensure they return the expected content

## Installation

To use loadUrl, install the optional dependencies:
```bash
yarn add @mozilla/readability jsdom
```