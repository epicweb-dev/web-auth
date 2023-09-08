import os from 'node:os'
import path from 'node:path'
import * as esbuild from 'esbuild'
import fsExtra from 'fs-extra'

const {
	KCDSHOP_PLAYGROUND_TIMESTAMP,
	KCDSHOP_PLAYGROUND_SRC_DIR,
	KCDSHOP_PLAYGROUND_DEST_DIR,
} = process.env

const tempDir = path.join(
	os.tmpdir(),
	'kcdshop',
	'playground-storage',
	KCDSHOP_PLAYGROUND_TIMESTAMP,
)

const schemaIsSame = await isSameFile(
	path.join(KCDSHOP_PLAYGROUND_DEST_DIR, 'prisma', 'schema.prisma'),
	path.join(KCDSHOP_PLAYGROUND_SRC_DIR, 'prisma', 'schema.prisma'),
)

if (schemaIsSame) {
	await fsExtra.ensureDir(tempDir)
	await fsExtra.copy(
		path.join(KCDSHOP_PLAYGROUND_DEST_DIR, 'node_modules/.prisma'),
		path.join(tempDir, 'node_modules/.prisma'),
	)
}

const seedIsSame = await isSameFile(
	path.join(KCDSHOP_PLAYGROUND_DEST_DIR, 'prisma', 'seed.ts'),
	path.join(KCDSHOP_PLAYGROUND_SRC_DIR, 'prisma', 'seed.ts'),
)

if (seedIsSame && schemaIsSame) {
	// save the database in a temp directory by the timestamp so it can be
	// restored in the post script.
	await fsExtra.ensureDir(tempDir)
	await fsExtra.copy(
		path.join(KCDSHOP_PLAYGROUND_DEST_DIR, 'prisma', 'data.db'),
		path.join(tempDir, 'data.db'),
	)
}

async function isSameFile(file1, file2) {
	const f1IsFile = await isFile(file1)
	const f2IsFile = await isFile(file2)
	if (!f1IsFile && !f2IsFile) return true
	if (f1IsFile !== f2IsFile) return false

	if (/.(ts|js|tsx|jsx)$/.test(file1)) {
		try {
			// doing this comparison of the bundled/minified code accounts for code
			// comments and whitespace changes that should not affect the outcome of
			// the code.
			const bundle1 = await getBundle(file1)
			const bundle2 = await getBundle(file2)
			return bundle1 === bundle2
		} catch {
			return false
		}
	} else {
		const [content1, content2] = await Promise.all([
			fsExtra.readFile(file1),
			fsExtra.readFile(file2),
		])
		return content1.equals(content2)
	}
}

async function isFile(p) {
	try {
		const stat = await fsExtra.stat(p)
		return stat.isFile()
	} catch (error) {
		return false
	}
}

async function getBundle(filepath) {
	const {
		outputFiles: [{ text }],
	} = await esbuild.build({
		entryPoints: [filepath],
		bundle: true,
		platform: 'node',
		format: 'esm',
		write: false,
		packages: 'external',
		external: ['*.png'],
		minify: true,
	})
	return text
}
