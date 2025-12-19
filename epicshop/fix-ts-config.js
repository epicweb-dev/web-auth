import fsExtra from 'fs-extra'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const here = (...p) => path.join(__dirname, ...p)

const workshopRoot = here('..')
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
