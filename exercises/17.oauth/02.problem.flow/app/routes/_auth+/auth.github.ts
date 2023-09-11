import { redirect } from '@remix-run/node'
// 💰 you're gonna need this:
// import { authenticator } from '#app/utils/auth.server.ts'

export async function loader() {
	return redirect('/login')
}

export async function action() {
	// 🐨 call authenticator.authenticate with 'github', the request. Return the
	// result.
	return new Response('not implemented', { status: 500 })
}
