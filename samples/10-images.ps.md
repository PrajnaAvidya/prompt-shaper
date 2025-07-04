# Images Example

This sample demonstrates the `img()` function for including images in prompts.

**Note**: Images are encoded and attached to LLM prompts, so this works best with `--interactive` or `--generate` modes.

## Loading Local Images

Loading a local image file:
{{img("samples/sample-data/example-image.png")}}

## Loading Remote Images

Loading an image from a URL:
{{img("https://via.placeholder.com/300x200/0066cc/ffffff?text=PromptShaper")}}

## Multiple Image Examples

Local image: {{img("samples/sample-data/example-image.png")}}
Remote image: {{img("https://via.placeholder.com/600x400/ff6600/ffffff?text=Screenshot")}}

## Image Processing Notes

- Local images are automatically converted to JPEG format for OpenAI compatibility
- Images are base64-encoded and attached to the prompt
- Supported formats: PNG, JPEG, GIF, WebP, SVG, and more (via Sharp library)
- Images appear as "[image added to prompt]" in template output
- Actual images are sent to the LLM when using interactive or generate modes

## Usage with LLM

To see images in action, run with LLM integration:
```bash
prompt-shaper samples/10-images.ps.md --interactive
prompt-shaper samples/10-images.ps.md --generate
```