import { type DataFunctionArgs, redirect } from '@remix-run/node'
import { validateCSRF } from '#app/utils/csrf.server.ts'
import { sessionStorage } from '#app/utils/session.server.ts'

export async function loader() {
	return redirect('/')
}

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.formData()
	await validateCSRF(formData, request.headers)
	const cookieSession = await sessionStorage.getSession(
		request.headers.get('cookie'),
	)
	return redirect('/', {
		headers: {
			'set-cookie': await sessionStorage.destroySession(cookieSession),
		},
	})
}
