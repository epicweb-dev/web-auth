import { redirect, type DataFunctionArgs } from '@remix-run/node'
import {
	authenticator,
	getSessionExpirationDate,
	getUserId,
} from '#app/utils/auth.server.ts'
import { handleMockCallback } from '#app/utils/connections.server.ts'
import { ProviderNameSchema, providerLabels } from '#app/utils/connections.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { verifySessionStorage } from '#app/utils/verification.server.ts'
import { handleNewSession } from './login.tsx'
import {
	onboardingEmailSessionKey,
	prefilledProfileKey,
	providerIdKey,
} from './onboarding_.$provider.tsx'

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

	const existingConnection = await prisma.connection.findUnique({
		select: { userId: true },
		where: { providerId: profile.id },
	})

	const userId = await getUserId(request)

	if (existingConnection && userId) {
		throw await redirectWithToast('/settings/profile/connections', {
			title: 'Already Connected',
			description:
				existingConnection.userId === userId
					? `Your "${profile.username}" ${label} account is already connected.`
					: `The "${profile.username}" ${label} account is already connected to another account.`,
		})
	}

	if (existingConnection) {
		const session = await prisma.session.create({
			select: { id: true, expirationDate: true, userId: true },
			data: {
				expirationDate: getSessionExpirationDate(),
				userId: existingConnection.userId,
			},
		})
		return handleNewSession({ request, session, remember: true })
	}

	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie'),
	)
	verifySession.set(onboardingEmailSessionKey, profile.email)
	verifySession.set(prefilledProfileKey, {
		...profile,
		email: profile.email.toLowerCase(),
		username: profile.username?.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase(),
	})
	verifySession.set(providerIdKey, profile.id)
	return redirect(`/onboarding/${providerName}`, {
		headers: {
			'set-cookie': await verifySessionStorage.commitSession(verifySession),
		},
	})
}
