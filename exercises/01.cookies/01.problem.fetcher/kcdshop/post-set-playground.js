import os from 'node:os'
import path from 'node:path'
import { $ } from 'execa'
import fsExtra from 'fs-extra'

const { EPICSHOP_PLAYGROUND_TIMESTAMP, EPICSHOP_PLAYGROUND_DEST_DIR } =
	process.env

const tempDir = path.join(
	os.tmpdir(),
	'epicshop',
	'playground-storage',
	EPICSHOP_PLAYGROUND_TIMESTAMP,
)

const savedDbPath = path.join(tempDir, 'data.db')
const savedDbExists = await fsExtra.exists(savedDbPath)
if (savedDbExists) {
	await fsExtra.copy(
		savedDbPath,
		path.join(EPICSHOP_PLAYGROUND_DEST_DIR, 'prisma', 'data.db'),
	)
}

const savedPrismaClientPath = path.join(tempDir, 'node_modules/.prisma')
const savedPrismaClientExists = await fsExtra.exists(savedPrismaClientPath)
if (savedPrismaClientExists) {
	await fsExtra.copy(
		savedPrismaClientPath,
		path.join(EPICSHOP_PLAYGROUND_DEST_DIR, 'node_modules/.prisma'),
	)
} else {
	try {
		await $({ all: true, cwd: EPICSHOP_PLAYGROUND_DEST_DIR })`prisma generate`
		console.log('🏗  prisma client generated')
	} catch (prismaGenerateResult) {
		console.log(prismaGenerateResult.all)
		throw new Error(`❌  prisma generate failed when setting playground`)
	}
}

await fsExtra.remove(tempDir)
await fsExtra.remove(path.join(EPICSHOP_PLAYGROUND_DEST_DIR, 'epicshop'))
