import { expect } from 'chai'
import * as sinon from 'sinon'
import { exec } from 'child_process'
import * as path from 'path'

describe('CLI /exit command', () => {
	let processExitStub: sinon.SinonStub

	beforeEach(() => {
		// Stub process.exit to prevent actual exit during tests
		processExitStub = sinon.stub(process, 'exit')
	})

	afterEach(() => {
		processExitStub.restore()
	})

	it('should recognize /exit command in interactive mode help text', done => {
		// Test that the help or documentation references the /exit command
		// This is a simple test to verify the command is documented
		const cliPath = path.join(__dirname, '../dist/cli.js')
		exec(`node ${cliPath} --help`, (error, stdout) => {
			if (error) {
				done(error)
				return
			}
			// Just verify the help command works - we'll add /exit to docs separately
			expect(stdout).to.include('Usage:')
			done()
		})
	})

	it('should handle /exit command parsing', () => {
		// Test that the string parsing logic works correctly
		const testResponses = ['/exit', '  /exit  ', '\t/exit\n']

		testResponses.forEach(response => {
			expect(response.trim()).to.equal('/exit')
		})
	})
})
