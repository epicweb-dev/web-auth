import { redirect } from '@remix-run/node'

export async function loader() {
	// 🦉 we'll keep this around in case the user ends up on this route. They
	// shouldn't see anything here anyway, so we'll just redirect them to the
	// home page.
	return redirect('/')
}

export async function action() {
	// 🐨 get the user's session from the request that's passed to the action
	// 🐨 unset the 'userId'
	// 🐨 commit the session and set the 'set-cookie' header
	return redirect('/')
}
