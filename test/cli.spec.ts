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
			expect(stdout.trim()).to.contain('Hello, World!')
			done()
		})
	})

	it('should parse a template from a string', done => {
		exec('ts-node src/cli.ts -is "{test = \\"hello world\\"}{{test}}"', (error, stdout) => {
			if (error) {
				throw new Error(error.message)
			}
			expect(stdout.trim()).to.contain('hello world')
			done()
		})
	})

	it('should save output to a file', done => {
		const outputPath = path.resolve(__dirname, '../output.txt')
		exec(`ts-node src/cli.ts -is "{variable = \\"hello world\\"}{{variable}}" -s output.txt`, error => {
			if (error) {
				throw new Error(error.message)
			}
			expect(fs.readFileSync(outputPath, 'utf8')).to.equal('hello world')
			done()
		})
	})

	it('should show debug messages', done => {
		exec('ts-node src/cli.ts -is "{variable = \\"hello world\\"}{{variable}}" -d', (error, stdout) => {
			if (error) {
				throw new Error(error.message)
			}
			expect(stdout).to.include('DEBUG:')
			done()
		})
	})

	it('should parse variables from a JSON string', done => {
		exec('ts-node src/cli.ts -is "{{test}}" -js \'{ "test": "hello world" }\'', (error, stdout) => {
			if (error) {
				throw new Error(error.message)
			}
			expect(stdout.trim()).to.contain('hello world')
			done()
		})
	})

	it('should parse variables from a JSON file', done => {
		const jsonFilePath = path.resolve(__dirname, './templates/cli/variables.json')
		exec(`ts-node src/cli.ts -is "{{test}}" -jf ${jsonFilePath}`, (error, stdout) => {
			if (error) {
				throw new Error(error.message)
			}
			expect(stdout.trim()).to.contain('hello world')
			done()
		})
	})

	it('should fail when no input or interactive mode', done => {
		exec('ts-node src/cli.ts -d', error => {
			if (error) {
				expect(error.message).to.contain('Input value is required')
			} else {
				throw new Error('Error not thrown by cli')
			}
			done()
		})
	})
})
