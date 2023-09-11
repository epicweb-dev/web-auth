import { redirect, type DataFunctionArgs } from '@remix-run/node'
import { authenticator } from '#app/utils/auth.server.ts'

export async function loader() {
	return redirect('/login')
}

export async function action({ request }: DataFunctionArgs) {
	const providerName = 'github'

	// 🐨 add an if statement here to check if the process.env.GITHUB_CLIENT_ID starts with "MOCK_"
	// 🐨 if it does, redirect to `/auth/github/callback?code=MOCK_GITHUB_CODE_KODY&state=MOCK_STATE`

	return await authenticator.authenticate(providerName, request)
}
