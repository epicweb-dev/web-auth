import { redirect, type DataFunctionArgs } from '@remix-run/node'
import { GitHubStrategy } from 'remix-auth-github'
import {
	SESSION_EXPIRATION_TIME,
	authenticator,
	getUserId,
	sessionKey,
} from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { verifySessionStorage } from '~/utils/verification.server.ts'
import { twoFAVerificationType } from '../settings+/profile.two-factor.tsx'
import { unverifiedSessionIdKey } from './login.tsx'
import {
	githubIdKey,
	onboardingEmailSessionKey,
	prefilledProfileKey,
} from './onboarding_.github.tsx'
import { getRedirectToUrl } from './verify.tsx'
import { commitSession, getSession } from '~/utils/session.server.ts'

export async function loader({ request }: DataFunctionArgs) {
	const reqUrl = new URL(request.url)
	if (process.env.MOCKS && reqUrl.searchParams.get('state') === 'MOCK_STATE') {
		const cookieSession = await getSession(request.headers.get('cookie'))
		const state = cookieSession.get('oauth2:state') ?? 'MOCK_STATE'
		cookieSession.set('oauth2:state', state)
		reqUrl.searchParams.set('state', state)
		request.headers.set('cookie', await commitSession(cookieSession))
		request = new Request(reqUrl.toString(), request)
	}

	const profile = await authenticator.authenticate(
		GitHubStrategy.name,
		request,
		{ failureRedirect: '/login' },
	)

	// Connection exists already? Make a new session
	const existingConnection = await prisma.gitHubConnection.findUnique({
		select: { userId: true },
		where: { providerId: profile.id },
	})
	if (existingConnection) {
		const session = await prisma.session.create({
			select: { id: true, expirationDate: true, userId: true },
			data: {
				expirationDate: new Date(Date.now() + SESSION_EXPIRATION_TIME),
				userId: existingConnection.userId,
			},
		})
		const verification = await prisma.verification.findUnique({
			select: { id: true },
			where: {
				target_type: {
					target: session.userId,
					type: twoFAVerificationType,
				},
			},
		})

		// has 2FA? redirect to verify
		const userHasTwoFactor = Boolean(verification)
		if (userHasTwoFactor) {
			const verifySession = await verifySessionStorage.getSession(
				request.headers.get('cookie'),
			)
			verifySession.set(unverifiedSessionIdKey, session.id)
			const reqUrl = new URL(request.url)
			const redirectUrl = getRedirectToUrl({
				request,
				type: twoFAVerificationType,
				target: session.userId,
				redirectTo: reqUrl.searchParams.get('redirectTo') ?? '/',
			})
			throw redirect(redirectUrl.toString(), {
				headers: {
					'set-cookie': await verifySessionStorage.commitSession(verifySession),
				},
			})
		} else {
			const cookieSession = await getSession(request.headers.get('cookie'))
			cookieSession.set(sessionKey, session.id)
			return redirect('/', {
				headers: {
					'set-cookie': await commitSession(cookieSession),
				},
			})
		}
	}

	// If we're already logged in, then link the GitHub account
	const userId = await getUserId(request)
	if (userId) {
		await prisma.gitHubConnection.create({
			data: { providerId: profile.id, userId },
		})
		return redirect('/settings/profile/connections')
	}

	// if the github email matches a user in the db, then link the account and
	// make a new session
	const user = await prisma.user.findUnique({
		select: { id: true },
		where: { email: profile.email },
	})
	if (user) {
		await prisma.gitHubConnection.create({
			data: { providerId: profile.id, userId: user.id },
		})
		const session = await prisma.session.create({
			select: { id: true },
			data: {
				expirationDate: new Date(Date.now() + SESSION_EXPIRATION_TIME),
				userId: user.id,
			},
		})
		return session.id
	}

	// this is a new user, so let's get them onboarded
	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie'),
	)
	verifySession.set(onboardingEmailSessionKey, profile.email)
	verifySession.set(prefilledProfileKey, profile)
	verifySession.set(githubIdKey, profile.id)
	throw redirect('/onboarding/github', {
		headers: {
			'Set-Cookie': await verifySessionStorage.commitSession(verifySession),
		},
	})
}
