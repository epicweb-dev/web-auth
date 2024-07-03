import { type LoaderFunctionArgs } from '@remix-run/node'
import { authenticator } from '#app/utils/auth.server.ts'
import { ProviderNameSchema, providerLabels } from '#app/utils/connections.tsx'
import { redirectWithToast } from '#app/utils/toast.server.ts'

export async function loader({ request, params }: LoaderFunctionArgs) {
	const providerName = ProviderNameSchema.parse(params.provider)

	const label = providerLabels[providerName]

	const profile = await authenticator
		.authenticate(providerName, request, { throwOnError: true })
		.catch(async error => {
			console.error(error)
			throw await redirectWithToast('/login', {
				type: 'error',
				title: 'Auth Failed',
				description: `There was an error authenticating with ${label}.`,
			})
		})

	console.log({ profile })
	// 🐨 check the database for an existing connection
	// via the providerName and providerId (profile.id) and select the userId

	// 🐨 get the userId from the session (getUserId(request))

	// 🐨 if there's an existing connection and a userId, then there's a conflict... Either:
	// 1. The account is already connected to their own account
	// 2. The account is already connected to someone else's account
	// 🐨 redirect to the /settings/profile/connections route with an apprpropriate toast message

	throw await redirectWithToast('/login', {
		title: 'Auth Success (jk)',
		description: `You have successfully authenticated with ${label} (not really though...).`,
		type: 'success',
	})
}
