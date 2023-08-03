export async function sendEmail(options: {
	to: string
	subject: string
	html?: string
	text: string
}) {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const email = {
		// 🐨 set the from to whatever address you'd like
		...options,
	}

	// 📜 https://resend.com/docs/api-reference/emails/send-email
	// 🐨 await a fetch call to the resend API: 'https://api.resend.com/emails'
	// 🐨 the method should be POST
	// 🐨 the body should be JSON.stringify(email)
	// 🐨 the headers should include:
	//   Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
	//   'Content-Type': 'application/json'
	// 🐨 await the response.json() and store it in a variable called data
	// 🐨 if the response.ok is truthy, then return {status: 'success'}
	// 🐨 otherwise, return {status: 'error', error: getErrorMessage(data)}
	// 💰 getErrorMessage comes from misc.tsx
}
