# Load URLs Example

This sample demonstrates the `loadUrl()` function for fetching content from web URLs.

**Note**: This requires the optional dependencies `@mozilla/readability` and `jsdom` to be installed.

## Loading Technical Documentation

Loading the JSON specification (RFC 7159):
{{loadUrl("https://tools.ietf.org/rfc/rfc7159.txt")}}

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