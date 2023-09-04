import { type DataFunctionArgs } from '@remix-run/node'
import { authenticator } from '#app/utils/auth.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'

export async function loader({ request }: DataFunctionArgs) {
	const providerName = 'github'

	const data = await authenticator.authenticate(providerName, request, {
		throwOnError: true,
	})

	console.log({ data })

	throw await redirectWithToast('/login', {
		title: 'Auth Success',
		description: `You have successfully authenticated with GitHub.`,
		type: 'success',
	})
}
