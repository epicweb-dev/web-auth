import { redirect, type DataFunctionArgs } from '@remix-run/node'
import { authenticator } from '#app/utils/auth.server.ts'

export async function loader() {
	return redirect('/login')
}

export async function action({ request }: DataFunctionArgs) {
	const providerName = 'github'

	if (process.env.GITHUB_CLIENT_ID?.startsWith('MOCK_')) {
		throw redirect(
			`/auth/github/callback?code=MOCK_GITHUB_CODE_KODY&state=MOCK_STATE`,
		)
	}

	return await authenticator.authenticate(providerName, request)
}
