import 'dotenv/config'
import closeWithGrace from 'close-with-grace'
import chalk from 'chalk'

closeWithGrace(async ({ err }) => {
	if (err) {
		console.error(chalk.red(err))
		console.error(chalk.red(err.stack))
		process.exit(1)
	}
})

// 🐨 if process.env.MOCKS === 'true'
// then dynamically import the mocks from './tests/mocks/index.ts'

if (process.env.NODE_ENV === 'production') {
	await import('./server-build/index.js')
} else {
	await import('./server/index.ts')
}
