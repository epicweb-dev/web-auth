import { type DataFunctionArgs } from '@remix-run/node'
import { authenticator } from '#app/utils/auth.server.ts'
import { connectionSessionStorage } from '#app/utils/connections.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'

export async function loader({ request }: DataFunctionArgs) {
	const providerName = 'github'

	if (process.env.GITHUB_CLIENT_ID?.startsWith('MOCK_')) {
		const connectionSession = await connectionSessionStorage.getSession(
			request.headers.get('cookie'),
		)
		const state = connectionSession.get('oauth2:state') ?? 'MOCK_STATE'
		connectionSession.set('oauth2:state', state)
		const reqUrl = new URL(request.url)
		reqUrl.searchParams.set('state', state)
		request.headers.set(
			'cookie',
			await connectionSessionStorage.commitSession(connectionSession),
		)
		request = new Request(reqUrl.toString(), request)
	}

	const data = await authenticator.authenticate(providerName, request, {
		throwOnError: true,
	})

	console.log({ data })

	throw await redirectWithToast('/login', {
		title: 'Auth Success (jk)',
		description: `You have successfully authenticated with GitHub (not really though...).`,
		type: 'success',
	})
}
