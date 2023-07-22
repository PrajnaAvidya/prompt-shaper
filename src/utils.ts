import { readFileSync } from 'fs'

const loadedFiles = new Set()
export const loadFileContent = (filePath: string): string => {
  if (loadedFiles.has(filePath)) {
    throw new Error(`Circular dependency detected: file "${filePath}" has already been loaded.`)
  }
  loadedFiles.add(filePath)
  return readFileSync(filePath, 'utf8').toString()
}
