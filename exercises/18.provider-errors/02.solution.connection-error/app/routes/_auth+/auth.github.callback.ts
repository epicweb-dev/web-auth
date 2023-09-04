import { type DataFunctionArgs } from '@remix-run/node'
import { authenticator } from '#app/utils/auth.server.ts'
import { sessionStorage } from '#app/utils/session.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'

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

	const authResult = await authenticator
		.authenticate(providerName, request, { throwOnError: true })
		.then(
			data => ({ success: true, data }) as const,
			error => ({ success: false, error }) as const,
		)

	if (!authResult.success) {
		console.error(authResult.error)
		throw await redirectWithToast('/login', {
			title: 'Auth Failed',
			description: `There was an error authenticating with GitHub.`,
			type: 'error',
		})
	}

	const { data: profile } = authResult

	// return
	const { data: profile } = authResult

	const existingConnection = await prisma.connection.findUnique({
		select: { userId: true },
		where: { providerId: profile.id },
	})

	const userId = await getUserId(request)

	if (existingConnection && userId) {
		throw await redirectWithToast(
			'/settings/profile/connections',
			{
				title: 'Already Connected',
				description:
					existingConnection.userId === userId
						? `Your "${profile.username}" ${label} account is already connected.`
						: `The "${profile.username}" ${label} account is already connected to another account.`,
			},
			{ headers: destroyRedirectTo },
		)
	}

	throw await redirectWithToast('/login', {
		title: 'Auth Success',
		description: `You have successfully authenticated with GitHub.`,
		type: 'success',
	})
}
