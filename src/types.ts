export enum ParserType {
  text = 'text',
  variable = 'variable',
  slot = 'slot',
}

export enum ValueType {
  string = 'string',
  number = 'number',
  function = 'function',
  unknown = 'unknown',
}

export interface ParserParam {
  type: ValueType
  value: string | number
  params?: ParserParam[]
  required?: boolean
}

export interface ParserSection {
  type: ParserType
  variableName?: string
  params?: ParserParam[]
  content?: ParserParam
  raw?: boolean
  location?: {
    start: TextLocation
    end: TextLocation
  }
}

export interface TextLocation {
  column: number
  line: number
  offset: number
}

export interface ParserVariables {
  [key: string]: {
    name: string
    type: ValueType
    value: string | number
    params: ParserParam[]
  }
}

export type PromptShapeFunction = (...args: ParserParam[]) => string | number
