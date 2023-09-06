import { type DataFunctionArgs } from '@remix-run/node'
import { authenticator } from '#app/utils/auth.server.ts'
import { handleMockCallback } from '#app/utils/connections.server.ts'
import { ProviderNameSchema, providerLabels } from '#app/utils/connections.tsx'
import { redirectWithToast } from '#app/utils/toast.server.ts'

export async function loader({ request, params }: DataFunctionArgs) {
	const providerName = ProviderNameSchema.parse(params.provider)
	request = await handleMockCallback(providerName, request)
	const label = providerLabels[providerName]

	const authResult = await authenticator
		.authenticate(providerName, request, { throwOnError: true })
		.then(
			data => ({ success: true, data }) as const,
			error => ({ success: false, error }) as const,
		)

	if (!authResult.success) {
		console.error(authResult.error)
		throw await redirectWithToast('/login', {
			title: 'Auth Failed',
			description: `There was an error authenticating with ${label}.`,
			type: 'error',
		})
	}

	const { data: profile } = authResult

	console.log({ profile })

	throw await redirectWithToast('/login', {
		title: 'Auth Success',
		description: `You have successfully authenticated with ${label}.`,
		type: 'success',
	})
}
