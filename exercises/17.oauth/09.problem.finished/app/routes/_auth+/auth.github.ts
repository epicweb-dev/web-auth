import { type DataFunctionArgs, redirect } from '@remix-run/node'
import { GitHubStrategy } from 'remix-auth-github'
import { authenticator } from '~/utils/auth.server.ts'

export async function loader() {
	return redirect('/login')
}

export async function action({ request }: DataFunctionArgs) {
	if (process.env.GITHUB_CLIENT_ID.startsWith('MOCK_')) {
		return redirect(`/auth/github/callback?code=MOCK_CODE&state=MOCK_STATE`)
	}
	return authenticator.authenticate(GitHubStrategy.name, request)
}
