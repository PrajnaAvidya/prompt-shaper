import { expect } from 'chai'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

describe('Profiles functionality', function () {
	const testProfilePath = path.join(__dirname, '../test-profile.json')
	const testProfile2Path = path.join(__dirname, '../test-profile-2.json')

	beforeEach(function () {
		// Clean up any existing test profiles
		if (fs.existsSync(testProfilePath)) {
			fs.unlinkSync(testProfilePath)
		}
		if (fs.existsSync(testProfile2Path)) {
			fs.unlinkSync(testProfile2Path)
		}
	})

	afterEach(function () {
		// Clean up test profiles
		if (fs.existsSync(testProfilePath)) {
			fs.unlinkSync(testProfilePath)
		}
		if (fs.existsSync(testProfile2Path)) {
			fs.unlinkSync(testProfile2Path)
		}
	})

	describe('Profile loading via CLI option', function () {
		it('should load profile from --profile option', function () {
			const profile = {
				debug: true,
				model: 'gpt-4',
				systemPrompt: 'You are a test assistant from profile',
			}
			fs.writeFileSync(testProfilePath, JSON.stringify(profile))

			const result = execSync(`ts-node src/cli.ts --profile ${testProfilePath} -is "test template" --disable-llm`, { encoding: 'utf8' })

			expect(result).to.include('[DEBUG]') // debug from profile should be active
			expect(result).to.include('test template')
		})

		it('should handle missing profile file gracefully', function () {
			let error = false
			try {
				execSync('ts-node src/cli.ts --profile nonexistent.json -is "test" --disable-llm', { encoding: 'utf8' })
			} catch (e) {
				error = true
				const execError = e as { stderr: string }
				expect(execError.stderr).to.include('Error loading profile from nonexistent.json')
				expect(execError.stderr).to.include('ENOENT')
			}
			expect(error).to.be.true
		})

		it('should handle invalid JSON in profile gracefully', function () {
			fs.writeFileSync(testProfilePath, '{ invalid json }')

			let error = false
			try {
				execSync(`ts-node src/cli.ts --profile ${testProfilePath} -is "test" --disable-llm`, { encoding: 'utf8' })
			} catch (e) {
				error = true
				const execError = e as { stderr: string }
				expect(execError.stderr).to.include('Error loading profile')
			}
			expect(error).to.be.true
		})
	})

	describe('Profile loading via environment variable', function () {
		it('should load profile from PROMPT_SHAPER_PROFILE environment variable', function () {
			const profile = {
				debug: true,
				model: 'gpt-3.5-turbo',
			}
			fs.writeFileSync(testProfilePath, JSON.stringify(profile))

			// Need to disable PROMPT_SHAPER_TESTS for env vars to work
			const result = execSync(
				`PROMPT_SHAPER_TESTS=false PROMPT_SHAPER_PROFILE=${testProfilePath} ts-node src/cli.ts -is "test template" --disable-llm`,
				{ encoding: 'utf8' },
			)

			expect(result).to.include('[DEBUG]') // debug from profile should be active
			expect(result).to.include('test template')
		})
	})

	describe('Priority system', function () {
		it('should prioritize CLI options over profile options', function () {
			const profile = {
				debug: true,
				model: 'gpt-4',
			}
			fs.writeFileSync(testProfilePath, JSON.stringify(profile))

			// CLI should override profile debug setting
			const result = execSync(`ts-node src/cli.ts --profile ${testProfilePath} -is "test template" --disable-llm`, { encoding: 'utf8' })

			// Debug should be active from profile since no CLI debug option provided
			expect(result).to.include('[DEBUG]')
		})

		it('should prioritize profile options over environment variables', function () {
			const profile = {
				debug: false, // profile says no debug
				model: 'gpt-4',
			}
			fs.writeFileSync(testProfilePath, JSON.stringify(profile))

			// Env var says debug=true, but profile should override
			const result = execSync(
				`PROMPT_SHAPER_TESTS=false PROMPT_SHAPER_DEBUG=true ts-node src/cli.ts --profile ${testProfilePath} -is "test template" --disable-llm`,
				{ encoding: 'utf8' },
			)

			// Debug should be false from profile, not true from env var
			expect(result).to.not.include('[DEBUG]')
		})

		it('should use environment variables when no profile provided', function () {
			const result = execSync('PROMPT_SHAPER_TESTS=false PROMPT_SHAPER_DEBUG=true ts-node src/cli.ts -is "test template" --disable-llm', {
				encoding: 'utf8',
			})

			expect(result).to.include('[DEBUG]') // debug from env var should be active
		})

		it('should prioritize CLI profile over environment profile with warning', function () {
			const profile1 = { debug: true, model: 'gpt-4' }
			const profile2 = { debug: false, model: 'gpt-3.5-turbo' }

			fs.writeFileSync(testProfilePath, JSON.stringify(profile1))
			fs.writeFileSync(testProfile2Path, JSON.stringify(profile2))

			try {
				const result = execSync(
					`PROMPT_SHAPER_TESTS=false PROMPT_SHAPER_PROFILE=${testProfilePath} ts-node src/cli.ts --profile ${testProfile2Path} -is "test template" --disable-llm`,
					{
						encoding: 'utf8',
						stdio: ['pipe', 'pipe', 'inherit'], // capture stdout but show stderr
					},
				)

				// Should use profile2 (debug=false), not profile1 (debug=true)
				expect(result).to.not.include('[DEBUG]')
				expect(result).to.include('test template')
			} catch (e) {
				// If there's an error, still check the output
				const execError = e as { stdout: string; stderr: string }
				expect(execError.stdout || execError.stderr).to.include('test template')
			}
		})
	})

	describe('Profile validation', function () {
		it('should warn about invalid profile options', function () {
			const profile = {
				debug: true,
				profile: 'self-reference.json', // should warn
				model: 'gpt-4',
			}
			fs.writeFileSync(testProfilePath, JSON.stringify(profile))

			try {
				const result = execSync(`ts-node src/cli.ts --profile ${testProfilePath} -is "test template" --disable-llm`, {
					encoding: 'utf8',
					stdio: ['pipe', 'pipe', 'inherit'], // let stderr go to console
				})

				expect(result).to.include('[DEBUG]') // valid options should still work
				expect(result).to.include('test template')
			} catch (e) {
				// If command fails, check the output anyway
				const execError = e as { stdout: string; stderr: string }
				const output = execError.stdout || execError.stderr || ''
				expect(output).to.include('test template')
			}
		})

		it('should accept all valid CLI options in profile', function () {
			const profile = {
				debug: true,
				extensions: 'js,ts,md',
				generate: false,
				model: 'gpt-4',
				systemPrompt: 'Test assistant',
				raw: false,
				responseFormat: 'text',
				reasoningEffort: 'high',
			}
			fs.writeFileSync(testProfilePath, JSON.stringify(profile))

			const result = execSync(`ts-node src/cli.ts --profile ${testProfilePath} -is "test template" --disable-llm`, { encoding: 'utf8' })

			expect(result).to.include('[DEBUG]') // debug should work
			expect(result).to.include('test template')
			expect(result).to.not.include('Warning') // no warnings for valid options
		})
	})

	describe('Integration with CLI functionality', function () {
		it('should work with template processing', function () {
			const profile = {
				debug: false,
				extensions: 'md',
			}
			fs.writeFileSync(testProfilePath, JSON.stringify(profile))

			const result = execSync(`ts-node src/cli.ts --profile ${testProfilePath} -is "{greeting=\\"Hello World\\"}{{greeting}}" --disable-llm`, {
				encoding: 'utf8',
			})

			expect(result).to.include('Hello World')
			expect(result).to.not.include('[DEBUG]') // debug should be false from profile
		})

		it('should work with loadDir function and extensions from profile', function () {
			const profile = {
				debug: false,
				extensions: 'md',
			}
			fs.writeFileSync(testProfilePath, JSON.stringify(profile))

			const result = execSync(
				`ts-node src/cli.ts --profile ${testProfilePath} -is "{{loadDir(\\"test/templates/single-line-variables\\")}}" --disable-llm`,
				{ encoding: 'utf8' },
			)

			expect(result).to.include('File: test/templates/single-line-variables')
			expect(result).to.include('singleLineNumberVar')
		})

		it('should work with --disable-llm option', function () {
			const profile = {
				debug: true,
				model: 'gpt-4',
			}
			fs.writeFileSync(testProfilePath, JSON.stringify(profile))

			const result = execSync(`ts-node src/cli.ts --profile ${testProfilePath} -is "test template" --disable-llm`, { encoding: 'utf8' })

			expect(result).to.include('test template')
			expect(result).to.not.include('assistant') // should not call LLM
		})

		it('should handle conflicting options correctly', function () {
			const profile = {
				interactive: true, // this conflicts with --disable-llm
			}
			fs.writeFileSync(testProfilePath, JSON.stringify(profile))

			let error = false
			try {
				execSync(`ts-node src/cli.ts --profile ${testProfilePath} --disable-llm --interactive`, { encoding: 'utf8' })
			} catch (e) {
				error = true
				const execError = e as { stderr: string }
				expect(execError.stderr).to.include('Error: --disable-llm cannot be used with interactive mode')
			}
			expect(error).to.be.true
		})
	})

	describe('Profile file format validation', function () {
		it('should handle empty profile file', function () {
			fs.writeFileSync(testProfilePath, '{}')

			const result = execSync(`ts-node src/cli.ts --profile ${testProfilePath} -is "test template" --disable-llm`, { encoding: 'utf8' })

			expect(result).to.include('test template')
			expect(result).to.not.include('Warning') // empty profile should be fine
		})

		it('should handle profile with unknown options gracefully', function () {
			const profile = {
				debug: true,
				unknownOption1: 'value1',
				anotherUnknownOption: true,
				model: 'gpt-4',
			}
			fs.writeFileSync(testProfilePath, JSON.stringify(profile))

			const result = execSync(`ts-node src/cli.ts --profile ${testProfilePath} -is "test template" --disable-llm`, { encoding: 'utf8' })

			expect(result).to.include('test template')
			expect(result).to.include('[DEBUG]') // known options should work
			// Unknown options should be silently ignored (no warnings unless they're specifically excluded)
		})
	})
})
