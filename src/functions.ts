import { ParserParam, PromptShapeFunction } from './types'
import { loadFileContent } from './utils'

export const functions: Record<string, PromptShapeFunction> = {
  add: (a: ParserParam, b: ParserParam) => {
    // Note: You might want to add some error checking here to make sure the params are of the correct type
    return (a.value as number) + (b.value as number)
  },
  load: (filePath: ParserParam) => {
    return loadFileContent(filePath.value as string)
  },
}
