import { getErrorMessage } from './misc.tsx'

export async function sendEmail(options: {
	to: string
	subject: string
	html?: string
	text: string
}) {
	const from = 'hello@epicstack.dev'

	const email = {
		from,
		...options,
	}

	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		body: JSON.stringify(email),
		headers: {
			Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
			'content-type': 'application/json',
		},
	})
	const data = await response.json()

	if (response.ok) {
		return { status: 'success' } as const
	} else {
		return {
			status: 'error',
			error: getErrorMessage(data),
		} as const
	}
}
