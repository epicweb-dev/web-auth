import { authenticator } from '#app/utils/auth.server.ts'
import { redirect, type DataFunctionArgs } from '@remix-run/node'

export async function loader() {
	return redirect('/login')
}

export async function action({ request }: DataFunctionArgs) {
	const providerName = 'github'

	return await authenticator.authenticate(providerName, request)
}
