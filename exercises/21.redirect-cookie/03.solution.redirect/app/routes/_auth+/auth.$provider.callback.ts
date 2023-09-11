import { redirect, type DataFunctionArgs } from '@remix-run/node'
import {
	authenticator,
	getSessionExpirationDate,
	getUserId,
} from '#app/utils/auth.server.ts'
import { ProviderNameSchema, providerLabels } from '#app/utils/connections.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { combineHeaders, combineResponseInits } from '#app/utils/misc.tsx'
import {
	destroyRedirectToHeader,
	getRedirectCookieValue,
} from '#app/utils/redirect-cookie.server.ts'
import {
	createToastHeaders,
	redirectWithToast,
} from '#app/utils/toast.server.ts'
import { verifySessionStorage } from '#app/utils/verification.server.ts'
import { handleNewSession } from './login.tsx'
import {
	onboardingEmailSessionKey,
	prefilledProfileKey,
	providerIdKey,
} from './onboarding_.$provider.tsx'

const destroyRedirectTo = { 'set-cookie': destroyRedirectToHeader }

export async function loader({ request, params }: DataFunctionArgs) {
	const providerName = ProviderNameSchema.parse(params.provider)

	const redirectTo = getRedirectCookieValue(request)
	const label = providerLabels[providerName]

	const profile = await authenticator
		.authenticate(providerName, request, { throwOnError: true })
		.catch(async error => {
			console.error(error)
			throw await redirectWithToast(
				'/login',
				{
					title: 'Auth Failed',
					description: `There was an error authenticating with ${label}.`,
					type: 'error',
				},
				{ headers: destroyRedirectTo },
			)
		})

	const existingConnection = await prisma.connection.findUnique({
		select: { userId: true },
		where: {
			providerName_providerId: { providerName, providerId: profile.id },
		},
	})

	const userId = await getUserId(request)

	if (existingConnection && userId) {
		throw await redirectWithToast(
			'/settings/profile/connections',
			{
				title: 'Already Connected',
				description:
					existingConnection.userId === userId
						? `Your "${profile.username}" ${label} account is already connected.`
						: `The "${profile.username}" ${label} account is already connected to another account.`,
			},
			{ headers: destroyRedirectTo },
		)
	}

	// If we're already logged in, then link the account
	if (userId) {
		await prisma.connection.create({
			data: { providerName, providerId: profile.id, userId },
		})
		throw await redirectWithToast(
			'/settings/profile/connections',
			{
				title: 'Connected',
				type: 'success',
				description: `Your "${profile.username}" ${label} account has been connected.`,
			},
			{ headers: destroyRedirectTo },
		)
	}

	// Connection exists already? Make a new session
	if (existingConnection) {
		return makeSession({
			request,
			userId: existingConnection.userId,
			redirectTo,
		})
	}

	// if the email matches a user in the db, then link the account and
	// make a new session
	const user = await prisma.user.findUnique({
		select: { id: true },
		where: { email: profile.email.toLowerCase() },
	})
	if (user) {
		await prisma.connection.create({
			data: { providerName, providerId: profile.id, userId: user.id },
		})
		return makeSession(
			{
				request,
				userId: user.id,
				// send them to the connections page to see their new connection
				redirectTo: redirectTo ?? '/settings/profile/connections',
			},
			{
				headers: await createToastHeaders({
					title: 'Connected',
					description: `Your "${profile.username}" ${label} account has been connected.`,
				}),
			},
		)
	}

	// this is a new user, so let's get them onboarded
	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie'),
	)
	verifySession.set(onboardingEmailSessionKey, profile.email)
	verifySession.set(prefilledProfileKey, {
		...profile,
		username: profile.username
			?.replace(/[^a-zA-Z0-9_]/g, '_')
			.toLowerCase()
			.slice(0, 20)
			.padEnd(3, '_'),
	})
	verifySession.set(providerIdKey, profile.id)
	const onboardingRedirect = [
		`/onboarding/${providerName}`,
		redirectTo ? new URLSearchParams({ redirectTo }) : null,
	]
		.filter(Boolean)
		.join('?')
	return redirect(onboardingRedirect, {
		headers: combineHeaders(
			{ 'set-cookie': await verifySessionStorage.commitSession(verifySession) },
			destroyRedirectTo,
		),
	})
}

async function makeSession(
	{
		request,
		userId,
		redirectTo,
	}: { request: Request; userId: string; redirectTo?: string | null },
	responseInit?: ResponseInit,
) {
	redirectTo ??= '/'
	const session = await prisma.session.create({
		select: { id: true, expirationDate: true, userId: true },
		data: {
			expirationDate: getSessionExpirationDate(),
			userId,
		},
	})
	return handleNewSession(
		{ request, session, redirectTo, remember: true },
		combineResponseInits({ headers: destroyRedirectTo }, responseInit),
	)
}
