import { type DataFunctionArgs, redirect } from '@remix-run/node'
import { GitHubStrategy } from 'remix-auth-github'
import { authenticator } from '~/utils/auth.server.ts'

export async function loader() {
	return redirect('/login')
}

export async function action({ request }: DataFunctionArgs) {
	return authenticator.authenticate(GitHubStrategy.name, request)
}
