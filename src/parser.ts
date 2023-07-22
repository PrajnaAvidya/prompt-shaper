import {loadFileContent} from "./utils";

const parser = require('./ps-parser.js')

const text = loadFileContent('samples/inline-variable-definitions.ps.txt')

const test = parser.parse(text, {})
console.log(test)
console.log(test[7].value.params)
