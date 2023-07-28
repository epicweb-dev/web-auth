import { json } from '@remix-run/node'
import { requireUserId } from './auth.server.ts'
import { prisma } from './db.server.ts'

export async function requireUserWithPermission(
	name: string,
	request: Request,
) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findFirst({
		select: { id: true },
		where: { id: userId, roles: { some: { permissions: { some: { name } } } } },
	})
	if (!user) {
		throw json({ error: 'Unauthorized', requiredRole: name }, { status: 403 })
	}
	return user.id
}

export async function requireAdminPermission(request: Request) {
	return requireUserWithPermission('admin', request)
}
