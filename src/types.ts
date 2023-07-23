export enum parserType {
  text = 'text',
  variable = 'variable',
  slot = 'slot',
}

export enum valueType {
  string = 'string',
  number = 'number',
  function = 'function',
  unknown = 'unknown',
}

export interface parserParam {
  type: valueType
  value: string | number
  params?: parserParam[]
  required?: boolean
}

export interface parserSection {
  type: parserType
  variableName?: string
  params?: parserParam[]
  content?: parserParam
  raw?: boolean
  location?: {
    start: textLocation
    end: textLocation
  }
}

export interface textLocation {
  column: number
  line: number
  offset: number
}

export interface parserVariables {
  [key: string]: {
    name: string
    type: valueType
    value: string | number
    params: parserParam[]
  }
}
