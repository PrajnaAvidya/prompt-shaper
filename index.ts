import {readFileSync} from 'fs'

const text = readFileSync('samples/minimal.ps.txt', 'utf8')

const openingPattern = /{([^}]+)}/g;
const closingPattern = /{\/([^}]+)}/g;

const openingTags = Array.from(text.matchAll(openingPattern));
const closingTags = Array.from(text.matchAll(closingPattern));

console.log(openingTags)
console.log(closingTags)