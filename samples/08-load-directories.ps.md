# Load Directories Example

This sample demonstrates the `loadDir()` function for loading multiple files from directories.

## Basic Directory Loading

Loading all files from the sample-data directory:
{{loadDir("samples/sample-data")}}

## Directory Loading with Ignore Patterns

Loading files but ignoring specific patterns:
{{loadDir("samples/sample-data", "*.log,temp*,backup*")}}

## Using CLI Extensions Filter

When using the CLI, you can specify file extensions:
```bash
yarn parse samples/08-load-directories.ps.md -e "js,json,md"
```

## Loading with Multiple Ignore Patterns

Loading samples/sample-data while ignoring temporary and backup files:
{{loadDir("samples/sample-data", "*.tmp,*.bak,*.log,temp*,backup*")}}

## Best Practices

- Use the `-e` CLI option to specify which file extensions to include
- Use ignore patterns to exclude unwanted files (logs, temp files, etc.)
- Common ignore patterns: `node_modules,.git,dist,*.log,temp*,.DS_Store`
- Patterns support glob syntax: `*` for wildcards, exact names for specific files/dirs