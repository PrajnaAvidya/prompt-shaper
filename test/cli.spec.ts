import { expect } from 'chai'
import { exec } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'

describe('CLI', () => {
	it('should parse a template from a file', done => {
		exec('ts-node src/cli.ts test/templates/cli/sample.ps.md', (error, stdout) => {
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

	it('should not parse input template when in raw mode', done => {
		exec('ts-node src/cli.ts -r test/templates/cli/raw.ps.md', (error, stdout) => {
			if (error) {
				throw new Error(error.message)
			}
			expect(stdout.trim()).to.contain('none of this {{ }}} should be parsed! // !{}}}{{')
			done()
		})
	})

	describe('File processing options', () => {
		it('should work with extensions option', done => {
			exec('ts-node src/cli.ts -is "{{loadDir(\\"test/templates/single-line-variables\\")}}" -e "md"', (error, stdout) => {
				if (error) {
					throw new Error(error.message)
				}
				expect(stdout).to.include('user')
				expect(stdout).to.include('-----')
				done()
			})
		})

		it('should work with ignore patterns option', done => {
			exec('ts-node src/cli.ts -is "{{loadDir(\\"test/templates\\")}}" --ignore-patterns "*.json,backup*" -e "md"', (error, stdout) => {
				if (error) {
					throw new Error(error.message)
				}
				expect(stdout).to.include('user')
				expect(stdout).to.include('-----')
				done()
			})
		})
	})

	describe('Display options', () => {
		it('should hide prompt when --hide-prompt is used', done => {
			exec('ts-node src/cli.ts -is "{greeting=\\"Hello World\\"}{{greeting}}" --hide-prompt --no-llm', (error, stdout) => {
				if (error) {
					throw new Error(error.message)
				}
				expect(stdout).to.not.include('user')
				expect(stdout).to.not.include('-----')
				expect(stdout.trim()).to.equal('')
				done()
			})
		})
	})

	describe('LLM configuration options', () => {
		it('should accept model option without making LLM calls', done => {
			exec('ts-node src/cli.ts -is "{greeting=\\"Hello World\\"}{{greeting}}" -m "gpt-4"', (error, stdout) => {
				if (error) {
					throw new Error(error.message)
				}
				expect(stdout).to.include('user')
				expect(stdout).to.include('Hello World')
				expect(stdout).to.include('-----')
				done()
			})
		})

		it('should accept system prompt option without making LLM calls', done => {
			exec('ts-node src/cli.ts -is "{greeting=\\"Hello World\\"}{{greeting}}" -sp "You are a helpful assistant"', (error, stdout) => {
				if (error) {
					throw new Error(error.message)
				}
				expect(stdout).to.include('user')
				expect(stdout).to.include('Hello World')
				expect(stdout).to.include('-----')
				done()
			})
		})

		it('should accept developer prompt option without making LLM calls', done => {
			exec('ts-node src/cli.ts -is "{greeting=\\"Hello World\\"}{{greeting}}" -dp "Test developer prompt"', (error, stdout) => {
				if (error) {
					throw new Error(error.message)
				}
				expect(stdout).to.include('user')
				expect(stdout).to.include('Hello World')
				expect(stdout).to.include('-----')
				done()
			})
		})

		it('should accept response format option without making LLM calls', done => {
			exec('ts-node src/cli.ts -is "{greeting=\\"Hello World\\"}{{greeting}}" -rf "json_object"', (error, stdout) => {
				if (error) {
					throw new Error(error.message)
				}
				expect(stdout).to.include('user')
				expect(stdout).to.include('Hello World')
				expect(stdout).to.include('-----')
				done()
			})
		})

		it('should accept reasoning effort option without making LLM calls', done => {
			exec('ts-node src/cli.ts -is "{greeting=\\"Hello World\\"}{{greeting}}" -re "medium"', (error, stdout) => {
				if (error) {
					throw new Error(error.message)
				}
				expect(stdout).to.include('user')
				expect(stdout).to.include('Hello World')
				expect(stdout).to.include('-----')
				done()
			})
		})
	})

	describe('JSON output functionality', () => {
		it('should accept save-json option without making LLM calls', done => {
			// JSON save only works in interactive/LLM modes, but option should be accepted
			exec('ts-node src/cli.ts -is "{greeting=\\"Hello World\\"}{{greeting}}" -sj "/tmp/test.json" --no-llm', (error, stdout) => {
				if (error) {
					throw new Error(error.message)
				}
				expect(stdout).to.include('user')
				expect(stdout).to.include('Hello World')
				expect(stdout).to.include('-----')
				done()
			})
		})
	})

	describe('Error handling', () => {
		it('should handle invalid JSON string gracefully', done => {
			exec('ts-node src/cli.ts -is "{{test}}" -js "invalid json"', error => {
				if (error) {
					expect(error.message).to.contain('Invalid JSON string provided')
				} else {
					throw new Error('Error not thrown by cli')
				}
				done()
			})
		})

		it('should handle missing JSON file gracefully', done => {
			exec('ts-node src/cli.ts -is "{{test}}" -jf "nonexistent.json"', error => {
				if (error) {
					expect(error.message).to.contain('Could not read JSON file')
				} else {
					throw new Error('Error not thrown by cli')
				}
				done()
			})
		})

		it('should handle missing template file gracefully', done => {
			exec('ts-node src/cli.ts "nonexistent-template.ps.md"', error => {
				if (error) {
					expect(error.message).to.contain('ENOENT')
				} else {
					throw new Error('Error not thrown by cli')
				}
				done()
			})
		})
	})

	describe('Combined options', () => {
		it('should work with multiple options together', done => {
			const outputPath = path.resolve(__dirname, '../combined-output.txt')
			exec(
				`ts-node src/cli.ts -is "{name=\\"PromptShaper\\"}{version=\\"5.0\\"}{{name}} v{{version}}" -d -s combined-output.txt --hide-prompt`,
				error => {
					if (error) {
						throw new Error(error.message)
					}
					expect(fs.readFileSync(outputPath, 'utf8')).to.equal('PromptShaper v5.0')
					// cleanup
					exec(`rm -f ${outputPath}`)
					done()
				},
			)
		})

		it('should work with JSON variables and save together', done => {
			const outputPath = path.resolve(__dirname, '../json-output.txt')
			exec(`ts-node src/cli.ts -is "Hello {{name}}!" -js '{"name": "World"}' -s json-output.txt`, error => {
				if (error) {
					throw new Error(error.message)
				}
				expect(fs.readFileSync(outputPath, 'utf8')).to.equal('Hello World!')
				// cleanup
				exec(`rm -f ${outputPath}`)
				done()
			})
		})
	})
})
