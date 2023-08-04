import { redirect, type DataFunctionArgs } from '@remix-run/node'
import { GitHubStrategy } from 'remix-auth-github'
import { authenticator } from '~/utils/auth.server.ts'
import { getReferrerRoute } from '~/utils/misc.tsx'
import { getRedirectCookieHeader } from '~/utils/redirect-cookie.server.ts'

export async function loader() {
	return redirect('/login')
}

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.formData()
	const rawRedirectTo = formData.get('redirectTo')
	const redirectTo =
		typeof rawRedirectTo === 'string'
			? rawRedirectTo
			: getReferrerRoute(request)

	const redirectToCookie = getRedirectCookieHeader(redirectTo)

	if (process.env.GITHUB_CLIENT_ID.startsWith('MOCK_')) {
		return redirect(`/auth/github/callback?code=MOCK_CODE&state=MOCK_STATE`, {
			headers: redirectToCookie ? { 'set-cookie': redirectToCookie } : {},
		})
	}
	try {
		return await authenticator.authenticate(GitHubStrategy.name, request)
	} catch (error: unknown) {
		if (error instanceof Response && redirectToCookie) {
			error.headers.append('set-cookie', redirectToCookie)
		}
		throw error
	}
}
