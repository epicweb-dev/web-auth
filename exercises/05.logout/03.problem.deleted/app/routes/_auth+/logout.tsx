import { type DataFunctionArgs, redirect } from '@remix-run/node'
import { commitSession, getSession } from '~/utils/session.server.ts'

export async function action({ request }: DataFunctionArgs) {
	const cookieSession = await getSession(request.headers.get('cookie'))
	cookieSession.unset('userId')
	return redirect('/', {
		headers: { 'set-cookie': await commitSession(cookieSession) },
	})
}

export async function loader() {
	return redirect('/')
}
