import { expect } from 'chai'
import { exec } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'

describe('CLI', () => {
	it('should parse a template from a file', done => {
		exec('ts-node src/cli.ts test/templates/cli/sample.ps.txt', (error, stdout) => {
			if (error) {
				throw new Error(error.message)
			}
			expect(stdout.trim()).to.equal('Hello, World!')
			done()
		})
	})

	it('should parse a template from a string', done => {
		exec('ts-node src/cli.ts "{test = \\"hello world\\"}{{test}}" -i', (error, stdout) => {
			if (error) {
				throw new Error(error.message)
			}
			expect(stdout.trim()).to.equal('hello world')
			done()
		})
	})

	it('should save output to a file', done => {
		const outputPath = path.resolve(__dirname, '../output.txt')
		exec(`ts-node src/cli.ts "{variable = \\"hello world\\"}{{variable}}" -i -s output.txt`, error => {
			if (error) {
				throw new Error(error.message)
			}
			expect(fs.readFileSync(outputPath, 'utf8')).to.equal('hello world')
			done()
		})
	})

	it('should show debug messages', done => {
		exec('ts-node src/cli.ts "{variable = \\"hello world\\"}{{variable}}" -i -d', (error, stdout) => {
			if (error) {
				throw new Error(error.message)
			}
			expect(stdout).to.include('DEBUG:')
			done()
		})
	})

	it('should parse variables from a JSON string', done => {
		exec('ts-node src/cli.ts "{{test}}" -i -j \'{ "test": "hello world" }\'', (error, stdout) => {
			if (error) {
				throw new Error(error.message)
			}
			expect(stdout.trim()).to.equal('hello world')
			done()
		})
	})

	it('should parse variables from a JSON file', done => {
		const jsonFilePath = path.resolve(__dirname, './templates/cli/variables.json')
		exec(`ts-node src/cli.ts "{{test}}" -i -jf ${jsonFilePath}`, (error, stdout) => {
			if (error) {
				throw new Error(error.message)
			}
			expect(stdout.trim()).to.equal('hello world')
			done()
		})
	})
})
