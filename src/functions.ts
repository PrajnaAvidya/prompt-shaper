import { ParserParam, PromptShapeFunction } from './types'
import { loadFileContent } from './utils'

export const functions: Record<string, PromptShapeFunction> = {
  add: (a: ParserParam, b: ParserParam): number => {
    return (a.value as number) + (b.value as number)
  },
  subtract: (a: ParserParam, b: ParserParam): number => {
    return (a.value as number) - (b.value as number)
  },
  multiply: (a: ParserParam, b: ParserParam): number => {
    return (a.value as number) * (b.value as number)
  },
  divide: (a: ParserParam, b: ParserParam): number => {
    return (a.value as number) / (b.value as number)
  },
  load: (filePath: ParserParam): string => {
    return loadFileContent(filePath.value as string)
  },
}

// to allow people to add their own functions
export const registerFunction = (name: string, func: PromptShapeFunction): void => {
  if (functions[name]) {
    throw new Error(`Function ${name} is already registered.`)
  }
  functions[name] = func
}
