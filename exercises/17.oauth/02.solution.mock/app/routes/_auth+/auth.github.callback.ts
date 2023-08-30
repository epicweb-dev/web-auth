import { authenticator } from '#app/utils/auth.server.ts'
import { sessionStorage } from '#app/utils/session.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { type DataFunctionArgs } from '@remix-run/node'

export async function loader({ request }: DataFunctionArgs) {
	const providerName = 'github'

	if (process.env.GITHUB_CLIENT_ID?.startsWith('MOCK_')) {
		const cookieSession = await sessionStorage.getSession(
			request.headers.get('cookie'),
		)
		const state = cookieSession.get('oauth2:state') ?? 'MOCK_STATE'
		cookieSession.set('oauth2:state', state)
		const reqUrl = new URL(request.url)
		reqUrl.searchParams.set('state', state)
		request.headers.set(
			'cookie',
			await sessionStorage.commitSession(cookieSession),
		)
		request = new Request(reqUrl.toString(), request)
	}

	const data = await authenticator.authenticate(providerName, request, {
		throwOnError: true,
	})

	console.log({ data })

	return redirectWithToast('/login', {
		title: 'Auth Success',
		description: `You have successfully authenticated with GitHub.`,
		type: 'success',
	})
}
