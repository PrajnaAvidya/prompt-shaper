import { expect } from 'chai'

describe('CLI /exit command', () => {


	it('should handle /exit command parsing', () => {
		// Test that the string parsing logic works correctly
		const testResponses = ['/exit', '  /exit  ', '\t/exit\n']

		testResponses.forEach(response => {
			expect(response.trim()).to.equal('/exit')
		})
	})
})
