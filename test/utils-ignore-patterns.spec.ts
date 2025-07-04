import { expect } from 'chai'
import sinon from 'sinon'
import { loadDirectoryContents } from '../src/utils'

const fs = require('fs')
const path = require('path')

describe('utils ignore patterns', () => {
	let readdirSyncStub: sinon.SinonStub
	let statSyncStub: sinon.SinonStub
	let readFileSyncStub: sinon.SinonStub

	beforeEach(() => {
		readdirSyncStub = sinon.stub(fs, 'readdirSync')
		statSyncStub = sinon.stub(fs, 'statSync')
		readFileSyncStub = sinon.stub(fs, 'readFileSync')
	})

	afterEach(() => {
		sinon.restore()
	})

	describe('shouldIgnore functionality', () => {
		it('should ignore exact directory names', () => {
			readdirSyncStub.returns(['src', 'node_modules', 'dist', 'test'])
			statSyncStub.returns({ isDirectory: () => false })
			readFileSyncStub.returns('content')

			const result = loadDirectoryContents('test', ['.js'], false, ['node_modules', 'dist'])

			expect(Object.keys(result)).to.have.length(0) // no .js files, but we're testing filtering
			expect(readdirSyncStub.calledOnce).to.be.true
			// statSync should not be called for ignored directories
			expect(statSyncStub.callCount).to.equal(2) // only for 'src' and 'test', not ignored ones
		})

		it('should ignore files with glob patterns', () => {
			readdirSyncStub.returns(['index.js', 'test.log', 'app.js', 'debug.log', 'temp123.tmp'])
			statSyncStub.returns({ isDirectory: () => false })
			readFileSyncStub.returns('content')

			const result = loadDirectoryContents('test', ['.js', '.log', '.tmp'], false, ['*.log', 'temp*'])

			// should only have .js files, ignoring .log files and temp* files
			expect(Object.keys(result)).to.have.length(2)
			expect(result[path.join('test', 'index.js')]).to.equal('content')
			expect(result[path.join('test', 'app.js')]).to.equal('content')
		})

		it('should handle complex glob patterns', () => {
			readdirSyncStub.returns(['file.test.js', 'app.spec.ts', 'main.js', 'utils.ts'])
			statSyncStub.returns({ isDirectory: () => false })
			readFileSyncStub.returns('content')

			const result = loadDirectoryContents('test', ['.js', '.ts'], false, ['*.test.*', '*.spec.*'])

			expect(Object.keys(result)).to.have.length(2)
			expect(result[path.join('test', 'main.js')]).to.equal('content')
			expect(result[path.join('test', 'utils.ts')]).to.equal('content')
		})

		it('should handle empty ignore patterns', () => {
			readdirSyncStub.returns(['index.js', 'app.js'])
			statSyncStub.returns({ isDirectory: () => false })
			readFileSyncStub.returns('content')

			const result = loadDirectoryContents('test', ['.js'], false, [])

			expect(Object.keys(result)).to.have.length(2)
		})

		it('should handle recursive directory ignoring', () => {
			// set up directory structure
			readdirSyncStub.withArgs('test').returns(['src', 'node_modules', 'dist'])
			readdirSyncStub.withArgs(path.join('test', 'src')).returns(['index.js'])

			statSyncStub.withArgs(path.join('test', 'src')).returns({ isDirectory: () => true })
			statSyncStub.withArgs(path.join('test', 'src', 'index.js')).returns({ isDirectory: () => false })

			readFileSyncStub.withArgs(path.join('test', 'src', 'index.js')).returns('content')

			const result = loadDirectoryContents('test', ['.js'], true, ['node_modules', 'dist'])

			expect(Object.keys(result)).to.have.length(1)
			expect(result[path.join('test', 'src', 'index.js')]).to.equal('content')

			// should not try to read ignored directories
			expect(readdirSyncStub.neverCalledWith(path.join('test', 'node_modules'))).to.be.true
			expect(readdirSyncStub.neverCalledWith(path.join('test', 'dist'))).to.be.true
		})

		it('should handle dotfiles and dotdirectories', () => {
			readdirSyncStub.returns(['.git', '.env', '.DS_Store', 'src', '.gitignore', 'config.js'])
			statSyncStub.returns({ isDirectory: () => false })
			readFileSyncStub.returns('content')

			const result = loadDirectoryContents('test', ['.js'], false, ['.git', '.DS_Store'])

			expect(Object.keys(result)).to.have.length(1)
			expect(result[path.join('test', 'config.js')]).to.equal('content')
			// .env and .gitignore don't have .js extension so they're not included
			// .git and .DS_Store are ignored
		})

		it('should handle case-sensitive pattern matching', () => {
			readdirSyncStub.returns(['Node_Modules', 'node_modules', 'NODE_MODULES'])
			statSyncStub.returns({ isDirectory: () => false })

			loadDirectoryContents('test', ['.js'], false, ['node_modules'])

			// should only ignore exact match
			expect(statSyncStub.callCount).to.equal(2) // Node_Modules and NODE_MODULES should be processed
		})

		it('should handle overlapping patterns', () => {
			readdirSyncStub.returns(['test.log', 'debug.log', 'app.test.js'])
			statSyncStub.returns({ isDirectory: () => false })
			readFileSyncStub.returns('content')

			const result = loadDirectoryContents('test', ['.log', '.js'], false, ['*.log', 'test.*'])

			// test.log should be ignored by both '*.log' and 'test.*' patterns
			// debug.log should be ignored by '*.log' pattern
			// app.test.js should NOT be ignored (test.* matches from start, not substring)
			expect(Object.keys(result)).to.have.length(1)
			expect(result[path.join('test', 'app.test.js')]).to.equal('content')
		})

		it('should handle special characters in file names', () => {
			readdirSyncStub.returns(['file-name.js', 'file_name.js', 'file.name.js', 'file@name.js'])
			statSyncStub.returns({ isDirectory: () => false })
			readFileSyncStub.returns('content')

			const result = loadDirectoryContents('test', ['.js'], false, ['file-*', 'file@*'])

			expect(Object.keys(result)).to.have.length(2)
			expect(result[path.join('test', 'file_name.js')]).to.equal('content')
			expect(result[path.join('test', 'file.name.js')]).to.equal('content')
		})
	})

	describe('performance considerations', () => {
		it('should not stat ignored files', () => {
			readdirSyncStub.returns(['node_modules', 'src'])

			loadDirectoryContents('test', ['.js'], false, ['node_modules'])

			// should only call statSync for non-ignored files
			expect(statSyncStub.calledOnce).to.be.true
			expect(statSyncStub.calledWith(path.join('test', 'src'))).to.be.true
		})
	})
})
