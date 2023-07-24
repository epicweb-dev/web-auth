import { PrismaClient } from '@prisma/client'
import chalk from 'chalk'
import { singleton } from './singleton.server.ts'

const prisma = singleton('prisma', () => {
	// NOTE: if you change anything in this function you'll need to restart
	// the dev server to see your changes.

	// we'll set the logThreshold to 0 so you see all the queries, but in a
	// production app you'd probably want to fine-tune this value to something
	// you're more comfortable with.
	const logThreshold = 0

	const client = new PrismaClient({
		log: [
			{ level: 'query', emit: 'event' },
			{ level: 'error', emit: 'stdout' },
			{ level: 'info', emit: 'stdout' },
			{ level: 'warn', emit: 'stdout' },
		],
	})
	client.$on('query', async e => {
		if (e.duration < logThreshold) return
		const color =
			e.duration < logThreshold * 1.1
				? 'green'
				: e.duration < logThreshold * 1.2
				? 'blue'
				: e.duration < logThreshold * 1.3
				? 'yellow'
				: e.duration < logThreshold * 1.4
				? 'redBright'
				: 'red'
		const dur = chalk[color](`${e.duration}ms`)
		console.info(`prisma:query - ${dur} - ${e.query}`)
	})
	client.$connect()
	return client
})

export { prisma }
