import { type Password, type User } from '@prisma/client'
import { redirect } from '@remix-run/node'
import bcrypt from 'bcryptjs'
import { safeRedirect } from 'remix-utils/safe-redirect'
import { prisma } from '#app/utils/db.server.ts'
import { combineResponseInits } from './misc.tsx'
import { sessionStorage } from './session.server.ts'

export const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30
export const getSessionExpirationDate = () =>
	new Date(Date.now() + SESSION_EXPIRATION_TIME)

// 🐨 update this from 'userId' to 'sessionId'
// but don't change the variable name just yet. We'll do that in the next step
export const userIdKey = 'userId'

export async function getUserId(request: Request) {
	const cookieSession = await sessionStorage.getSession(
		request.headers.get('cookie'),
	)
	// 🐨 this isn't a userId anymore, it's a sessionId
	const userId = cookieSession.get(userIdKey)
	if (!userId) return null
	// 🐨 query the sessionId table instead. Do a subquery to get the user id
	// 💰 make sure to only select sessions that have not yet expired!
	// 📜 https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#gt
	const user = await prisma.user.findUnique({
		select: { id: true },
		where: { id: userId },
	})
	// 🐨 if the session you get back doesn't exist or doesn't have a user, then
	// we'll log the user out.
	if (!user) {
		throw await logout({ request })
	}
	// 🐨 return the user id from the session
	return user.id
}

export async function requireUserId(
	request: Request,
	{ redirectTo }: { redirectTo?: string | null } = {},
) {
	const userId = await getUserId(request)
	if (!userId) {
		const requestUrl = new URL(request.url)
		redirectTo =
			redirectTo === null
				? null
				: redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`
		const loginParams = redirectTo ? new URLSearchParams({ redirectTo }) : null
		const loginRedirect = ['/login', loginParams?.toString()]
			.filter(Boolean)
			.join('?')
		throw redirect(loginRedirect)
	}
	return userId
}

export async function requireAnonymous(request: Request) {
	const userId = await getUserId(request)
	if (userId) {
		throw redirect('/')
	}
}

export async function requireUser(request: Request) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUnique({
		select: { id: true, username: true },
		where: { id: userId },
	})
	if (!user) {
		throw await logout({ request })
	}
	return user
}

export async function login({
	username,
	password,
}: {
	username: User['username']
	password: string
}) {
	// 🐨 this will be a little more involved now...
	const user = await verifyUserPassword({ username }, password)
	// 🐨 if there's no user, then return null
	// 🐨 if there is a user, then create a session with the expiration date
	// set to new Date(Date.now() + SESSION_EXPIRATION_TIME)
	// and set the userId to the user.id
	// 💰 make sure to select both the session id and the session experation date

	// 🐨 return the session instead of the user:
	return user
}

export async function signup({
	email,
	username,
	password,
	name,
}: {
	email: User['email']
	username: User['username']
	name: User['name']
	password: string
}) {
	const hashedPassword = await getPasswordHash(password)

	// this bit will be a little more complicated
	// 🐨 create a session in the session table
	// 🐨 set the expiration date to new Date(Date.now() + SESSION_EXPIRATION_TIME)
	// 🐨 do a sub-query to create the user along with the session.
	// 💰 The existing query we have will work well as the sub-query there.
	// 🐨 make sure to select the id and expirationDate of the session you just
	// created.
	const user = await prisma.user.create({
		select: { id: true },
		data: {
			email: email.toLowerCase(),
			username: username.toLowerCase(),
			name,
			roles: { connect: { name: 'user' } },
			password: {
				create: {
					hash: hashedPassword,
				},
			},
		},
	})

	// 🐨 return the session instead of the user.
	return user
}

export async function logout(
	{
		request,
		redirectTo = '/',
	}: {
		request: Request
		redirectTo?: string
	},
	responseInit?: ResponseInit,
) {
	const cookieSession = await sessionStorage.getSession(
		request.headers.get('cookie'),
	)
	// 🐨 get the sessionId from the cookieSession
	// 🐨 delete the session from the database by that sessionId
	// 💯 it's possible the session doesn't exist, so handle that case gracefully
	// and make sure we don't prevent the user from logging out if that happens
	// 💯 don't wait for the session to be deleted before proceeding with the logout
	throw redirect(
		safeRedirect(redirectTo),
		combineResponseInits(responseInit, {
			headers: {
				'set-cookie': await sessionStorage.destroySession(cookieSession),
			},
		}),
	)
}

export async function getPasswordHash(password: string) {
	const hash = await bcrypt.hash(password, 10)
	return hash
}

export async function verifyUserPassword(
	where: Pick<User, 'username'> | Pick<User, 'id'>,
	password: Password['hash'],
) {
	const userWithPassword = await prisma.user.findUnique({
		where,
		select: { id: true, password: { select: { hash: true } } },
	})

	if (!userWithPassword || !userWithPassword.password) {
		return null
	}

	const isValid = await bcrypt.compare(password, userWithPassword.password.hash)

	if (!isValid) {
		return null
	}

	return { id: userWithPassword.id }
}
