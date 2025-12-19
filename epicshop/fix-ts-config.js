import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const here = (...p) => path.join(__dirname, ...p)

const workshopRoot = here('..')

function relativeToWorkshopRoot(dir) {
	return dir.replace(`${workshopRoot}${path.sep}`, '')
}

const exercises = (await readDir(here('../exercises')))
	.map(name => here(`../exercises/${name}`))
	.filter(filepath => fs.statSync(filepath).isDirectory())
const exerciseApps = (
	await Promise.all(
		exercises.flatMap(async exercise => {
			return (await readDir(exercise))
				.filter(dir => {
					return /(problem|solution)/.test(dir)
				})
				.map(dir => path.join(exercise, dir))
		}),
	)
).flat()

const appsWithPkgJson = exerciseApps.filter(app => {
	const pkgjsonPath = path.join(app, 'package.json')
	return exists(pkgjsonPath)
})

const tsconfig = {
	files: [],
	exclude: ['node_modules'],
	references: appsWithPkgJson.map(a => ({
		path: relativeToWorkshopRoot(a).replace(/\\/g, '/'),
	})),
}
const written = await writeIfNeeded(
	path.join(workshopRoot, 'tsconfig.json'),
	`${JSON.stringify(tsconfig, null, 2)}\n`,
	{ parser: 'json' },
)

if (written) {
	// delete node_modules/.cache
	const cacheDir = path.join(workshopRoot, 'node_modules', '.cache')
	if (exists(cacheDir)) {
		await fs.promises.rm(cacheDir, { recursive: true })
	}
	console.log('all fixed up')
}

function exists(p) {
	if (!p) return false
	try {
		fs.statSync(p)
		return true
	} catch (error) {
		return false
	}
}

async function readDir(dir) {
	if (exists(dir)) {
		return fs.promises.readdir(dir)
	}
	return []
}

async function writeIfNeeded(filepath, content) {
	let oldContent = ''
	try {
		oldContent = await fs.promises.readFile(filepath, 'utf8')
	} catch (error) {
		// File doesn't exist, so we'll write it
		oldContent = ''
	}
	if (oldContent !== content) {
		await fs.promises.writeFile(filepath, content)
	}
	return oldContent !== content
}

function rel(dir) {
	return path.relative(process.cwd(), dir)
}
