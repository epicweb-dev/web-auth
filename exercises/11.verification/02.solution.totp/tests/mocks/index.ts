import { rest } from 'msw'
import { setupServer } from 'msw/node'
import closeWithGrace from 'close-with-grace'
import { faker } from '@faker-js/faker'

const handlers = [
	process.env.REMIX_DEV_HTTP_ORIGIN
		? rest.post(`${process.env.REMIX_DEV_HTTP_ORIGIN}ping`, req =>
				req.passthrough(),
		  )
		: null,

	rest.post(`https://api.resend.com/emails`, async (req, res, ctx) => {
		const body = await req.json()
		console.info('🔶 mocked email contents:', body)

		return res(
			ctx.json({
				id: faker.string.uuid(),
				from: body.from,
				to: body.to,
				created_at: new Date().toISOString(),
			}),
		)
	}),
].filter(Boolean)

const server = setupServer(...handlers)

server.listen({ onUnhandledRequest: 'warn' })
console.info('🔶 Mock server installed')

closeWithGrace(() => {
	server.close()
})
