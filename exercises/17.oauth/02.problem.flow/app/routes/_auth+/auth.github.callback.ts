// 💰 you're gonna need this:
// import { authenticator } from '#app/utils/auth.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'

export async function loader() {
	// 🐨 call authenticator.authenticate with 'github', the request, and
	// the option throwOnError: true

	// 🐨 feel free to log the result

	throw await redirectWithToast('/login', {
		title: 'Auth Success (jk)',
		description: `You have successfully authenticated with GitHub (not really though...).`,
		type: 'success',
	})
}
