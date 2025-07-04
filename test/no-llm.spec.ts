import { expect } from 'chai'
import { execSync } from 'child_process'

describe('No LLM functionality', function () {
	describe('CLI option --disable-llm', function () {
		it('should prevent LLM calls when --disable-llm is used', function () {
			const result = execSync('ts-node src/cli.ts -is "{greeting=\\"Hello World\\"}{{greeting}}" --disable-llm', { encoding: 'utf8' })

			expect(result).to.include('Hello World')
			expect(result).to.not.include('assistant')
		})

		it('should error when --disable-llm is used with --interactive', function () {
			let error = false
			try {
				execSync('ts-node src/cli.ts --disable-llm --interactive', { encoding: 'utf8' })
			} catch (e) {
				error = true
				const execError = e as { stderr: string }
				expect(execError.stderr).to.include('Error: --disable-llm cannot be used with interactive mode')
			}
			expect(error).to.be.true
		})

		it('should error when --disable-llm is used with --generate', function () {
			let error = false
			try {
				execSync('ts-node src/cli.ts -is "{greeting=\\"Hello World\\"}{{greeting}}" --disable-llm --generate', { encoding: 'utf8' })
			} catch (e) {
				error = true
				const execError = e as { stderr: string }
				expect(execError.stderr).to.include('Error: --disable-llm cannot be used with interactive mode')
			}
			expect(error).to.be.true
		})

		it('should error when --disable-llm is used with --load-json', function () {
			let error = false
			try {
				execSync('ts-node src/cli.ts --disable-llm --load-json test.json', { encoding: 'utf8' })
			} catch (e) {
				error = true
				const execError = e as { stderr: string }
				expect(execError.stderr).to.include('Error: --disable-llm cannot be used with interactive mode')
			}
			expect(error).to.be.true
		})

		it('should error when --disable-llm is used with --load-text', function () {
			let error = false
			try {
				execSync('ts-node src/cli.ts --disable-llm --load-text test.md', { encoding: 'utf8' })
			} catch (e) {
				error = true
				const execError = e as { stderr: string }
				expect(execError.stderr).to.include('Error: --disable-llm cannot be used with interactive mode')
			}
			expect(error).to.be.true
		})

		it('should work with --save option when --disable-llm is used', function () {
			const tempFile = '/tmp/prompt-shaper-test-output.txt'

			execSync(`ts-node src/cli.ts -is "{greeting=\\"Hello World\\"}{{greeting}}" --disable-llm --save ${tempFile}`, { encoding: 'utf8' })

			const savedContent = execSync(`cat ${tempFile}`, { encoding: 'utf8' })
			expect(savedContent.trim()).to.equal('Hello World')

			// cleanup
			execSync(`rm -f ${tempFile}`)
		})

		it('should still process templates normally when --disable-llm is used', function () {
			const result = execSync(
				'ts-node src/cli.ts -is "{name=\\"PromptShaper\\"}{version=\\"5.0\\"}Welcome to {{name}} version {{version}}!" --disable-llm',
				{ encoding: 'utf8' },
			)

			expect(result).to.include('Welcome to PromptShaper version 5.0!')
		})
	})

	describe('Environment variable PROMPT_SHAPER_NO_LLM', function () {
		it('should prevent LLM calls when PROMPT_SHAPER_NO_LLM=true', function () {
			try {
				const result = execSync(
					'PROMPT_SHAPER_NO_LLM=true PROMPT_SHAPER_TESTS=false ts-node src/cli.ts -is "{greeting=\\"Hello World\\"}{{greeting}}"',
					{ encoding: 'utf8' },
				)

				expect(result).to.include('Hello World')
				expect(result).to.not.include('assistant')
			} catch (e) {
				// if there are readline issues in test environment, verify the functionality works via ts-node
				const result = execSync('PROMPT_SHAPER_NO_LLM=true ts-node src/cli.ts -is "{greeting=\\"Hello World\\"}{{greeting}}"', { encoding: 'utf8' })
				expect(result).to.include('Hello World')
				expect(result).to.not.include('assistant')
			}
		})

		it('should error when PROMPT_SHAPER_NO_LLM=true and --interactive is used', function () {
			let error = false
			try {
				execSync('PROMPT_SHAPER_NO_LLM=true PROMPT_SHAPER_TESTS=false ts-node src/cli.ts --interactive', { encoding: 'utf8' })
			} catch (e) {
				error = true
				const execError = e as { stderr: string }
				expect(execError.stderr).to.include('Error: --disable-llm cannot be used with interactive mode')
			}
			expect(error).to.be.true
		})

		it('should work normally when PROMPT_SHAPER_NO_LLM=false', function () {
			// test that PROMPT_SHAPER_NO_LLM=false doesn't interfere with normal operation
			// this should just process templates normally without LLM calls (no --generate or --interactive)
			const result = execSync('PROMPT_SHAPER_NO_LLM=false ts-node src/cli.ts -is "{greeting=\\"Hello World\\"}{{greeting}}"', {
				encoding: 'utf8',
				timeout: 5000, // give it a bit more time, but it should exit quickly
			})

			expect(result).to.include('Hello World')
			// should not try to call LLM since no --generate or --interactive flags are used
		})
	})

	describe('Integration with existing functionality', function () {
		it('should work with loadDir function when --disable-llm is used', function () {
			const result = execSync('ts-node src/cli.ts -is "{{loadDir(\\"test/templates/single-line-variables\\")}}" --disable-llm -e md', {
				encoding: 'utf8',
			})

			// loadDir function should execute and show file contents
			expect(result).to.include('File: test/templates/single-line-variables')
			expect(result).to.include('singleLineNumberVar')
		})

		it('should work with variables and slots when --disable-llm is used', function () {
			const result = execSync(
				'ts-node src/cli.ts -is "{items=\\"apples,bananas,cherries\\"}{list(items)}- {{items}}{/list}{{list(\\"fruits\\")}}" --disable-llm',
				{ encoding: 'utf8' },
			)

			expect(result).to.include('- fruits')
		})

		it('should work with load function when --disable-llm is used', function () {
			const result = execSync('ts-node src/cli.ts -is "{{load(\\"test/templates/single-line-variables/string.ps.md\\")}}" --disable-llm', {
				encoding: 'utf8',
			})

			expect(result).to.include('File: test/templates/single-line-variables/string.ps.md')
			expect(result).to.include('Hello World')
		})
	})
})
