import { readFileSync } from 'fs'

const loadedFiles = new Set()
export const loadFileContent = (filePath: string): string => {
  if (loadedFiles.has(filePath)) {
    throw new Error(`Circular dependency detected: file "${filePath}" has already been loaded.`)
  }
  loadedFiles.add(filePath)
  return readFileSync(filePath, 'utf8').toString()
}

export const replaceStringAtLocation = (str: string, replacement: string | number, start: number, end: number): string => {
  return str.substring(0, start) + replacement + str.substring(end)
}
