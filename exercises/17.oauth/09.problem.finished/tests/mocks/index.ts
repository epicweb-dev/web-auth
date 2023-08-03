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

	// test this github stuff out without going through github's oauth flow by
	// going to http://localhost:3000/auth/github/callback?code=MOCK_CODE&state=MOCK_STATE
	rest.post(
		'https://github.com/login/oauth/access_token',
		async (req, res, ctx) => {
			const params = new URLSearchParams(await req.text())
			if (params.get('code') !== 'MOCK_CODE') {
				return req.passthrough()
			}

			return res(
				ctx.body(
					new URLSearchParams({
						access_token: '__MOCK_ACCESS_TOKEN__',
						token_type: '__MOCK_TOKEN_TYPE__',
					}).toString(),
				),
			)
		},
	),
	rest.get('https://api.github.com/user/:id', async (req, res, ctx) => {
		if (req.params.id !== 'MOCK_ID') {
			return req.passthrough()
		}

		return res(
			ctx.json({
				login: 'mocked-login',
				id: 123456789,
				name: 'Mocked User',
				avatar_url: 'https://github.com/ghost.png',
				emails: ['mock@example.com'],
			}),
		)
	}),
	rest.get('https://api.github.com/user', async (req, res, ctx) => {
		if (!req.headers.get('authorization')?.includes('__MOCK_ACCESS_TOKEN__')) {
			return req.passthrough()
		}

		return res(
			ctx.json({
				login: 'mocked-login',
				id: 123456789,
				name: 'Mocked User',
				avatar_url: 'https://github.com/ghost.png',
				emails: ['mock@example.com'],
			}),
		)
	}),
	rest.get('https://api.github.com/user/emails', async (req, res, ctx) => {
		if (!req.headers.get('authorization')?.includes('__MOCK_ACCESS_TOKEN__')) {
			return req.passthrough()
		}

		return res(ctx.json([{ email: 'mock@example.com' }]))
	}),
].filter(Boolean)

const server = setupServer(...handlers)

server.listen({ onUnhandledRequest: 'warn' })
console.info('🔶 Mock server installed')

closeWithGrace(() => {
	server.close()
})
