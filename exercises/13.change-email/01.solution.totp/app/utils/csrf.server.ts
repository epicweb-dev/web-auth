import { createCookie } from '@remix-run/node'
import { CSRF, CSRFError } from 'remix-utils/csrf/server'
import { singleton } from './singleton.server.ts'

const cookie = createCookie('csrf', {
	path: '/',
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax',
	secrets: process.env.SESSION_SECRET.split(','),
})

export const csrf = singleton(
	'csrf',
	() => new CSRF({ cookie, formDataKey: 'csrf' }),
)

export async function validateCSRF(formData: FormData, headers: Headers) {
	try {
		await csrf.validate(formData, headers)
	} catch (error) {
		if (error instanceof CSRFError) {
			throw new Response('Invalid CSRF token', { status: 403 })
		}
		throw error
	}
}
