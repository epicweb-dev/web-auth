import { type DataFunctionArgs, redirect } from '@remix-run/node'
import { sessionStorage } from '#app/utils/session.server.ts'

export async function loader() {
	return redirect('/')
}

export async function action({ request }: DataFunctionArgs) {
	const cookieSession = await sessionStorage.getSession(
		request.headers.get('cookie'),
	)
	return redirect('/', {
		headers: {
			'set-cookie': await sessionStorage.destroySession(cookieSession),
		},
	})
}
