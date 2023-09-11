import { type DataFunctionArgs } from '@remix-run/node'
import { authenticator } from '#app/utils/auth.server.ts'
// 💰 you'll need this:
// import { connectionSessionStorage } from '#app/utils/connections.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'

export async function loader({ request }: DataFunctionArgs) {
	const providerName = 'github'

	// 🐨 add an if statement to check whether process.env.GITHUB_CLIENT_ID starts with "MOCK_"
	// 🐨 if it does, get the connectionSession
	// 🐨 get the connectionSession's oauth2:state value and set it to a variable called state (fallback to "MOCK_STATE")
	// 🐨 make a new URL object (reqUrl) from the request.url and set the "state" search param to the state value
	// 🐨 set the request.headers cookie to the committed connectionSession.
	// 🐨 reassign the request variable to a new Request instance with the updated URL and headers
	// 💰 request = new Request(reqUrl.toString(), request)

	const data = await authenticator.authenticate(providerName, request, {
		throwOnError: true,
	})

	console.log({ data })

	throw await redirectWithToast('/login', {
		title: 'Auth Success (jk)',
		description: `You have successfully authenticated with GitHub (not really though...).`,
		type: 'success',
	})
}
