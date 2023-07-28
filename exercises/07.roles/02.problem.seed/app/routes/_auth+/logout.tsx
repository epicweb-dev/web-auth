import { redirect, type DataFunctionArgs } from '@remix-run/node'
import { userIdKey } from '~/utils/auth.server.ts'
import { commitSession, getSession } from '~/utils/session.server.ts'

export async function action({ request }: DataFunctionArgs) {
	const cookieSession = await getSession(request.headers.get('cookie'))
	cookieSession.unset(userIdKey)
	return redirect('/', {
		headers: { 'Set-Cookie': await commitSession(cookieSession) },
	})
}

export async function loader() {
	return redirect('/')
}
