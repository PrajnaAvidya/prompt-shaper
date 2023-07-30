import { expect } from 'chai'
import { exec } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'

describe('CLI', () => {
	it('should parse a template from a file', (done) => {
		exec('ts-node src/cli.ts test/templates/cli/sample.ps.txt', (error, stdout, stderr) => {
			if (error) {
				done(error)
			}
			expect(stdout.trim()).to.equal('Hello, World!')
			done()
		})
	})

	it('should parse a template from a string', (done) => {
		exec('ts-node src/cli.ts "{test = \\\"hello world\\\"}{{test}}" -i', (error, stdout, stderr) => {
			if (error) {
				done(error)
			}
			expect(stdout.trim()).to.equal('hello world')
			done()
		})
	})

	it('should save output to a file', (done) => {
		const outputPath = path.resolve(__dirname, '../output.txt')
		exec(`ts-node src/cli.ts "{variable = \\\"hello world\\\"}{{variable}}" -i -s output.txt`, (error, stdout, stderr) => {
			if (error) {
				done(error)
			}
			expect(fs.readFileSync(outputPath, 'utf8')).to.equal('hello world')
			done()
		})
	})

	it('should show debug messages', (done) => {
		exec('ts-node src/cli.ts "{variable = \\\"hello world\\\"}{{variable}}" -i -d', (error, stdout, stderr) => {
			if (error) {
				done(error)
			}
			expect(stdout).to.include('DEBUG:')
			done()
		})
	})
})
