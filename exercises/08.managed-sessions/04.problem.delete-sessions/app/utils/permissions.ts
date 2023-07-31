import { json } from '@remix-run/node'
import { requireUserId } from './auth.server.ts'
import { prisma } from './db.server.ts'
import { type useUser } from './user.ts'

export async function requireUserWithPermission(
	request: Request,
	permission: PermissionString,
) {
	const userId = await requireUserId(request)
	const permissionData = parsePermissionString(permission)
	const user = await prisma.user.findFirst({
		select: { id: true },
		where: {
			id: userId,
			roles: { some: { permissions: { some: permissionData } } },
		},
	})
	if (!user) {
		throw json(
			{
				error: 'Unauthorized',
				requiredPermission: permissionData,
				message: `Unauthorized: required permissions: ${permission}`,
			},
			{ status: 403 },
		)
	}
	return user.id
}

export async function requireUserWithRole(request: Request, name: string) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findFirst({
		select: { id: true },
		where: { id: userId, roles: { some: { name } } },
	})
	if (!user) {
		throw json(
			{
				error: 'Unauthorized',
				requiredRole: name,
				message: `Unauthorized: required role: ${name}`,
			},
			{ status: 403 },
		)
	}
	return user.id
}

type Action = 'create' | 'read' | 'update' | 'delete'
type Entity = 'user' | 'note'
type OwnOnly = 'own' | 'any' | 'either'
type PermissionString = `${Action}:${Entity}:${OwnOnly}`
function parsePermissionString(permissionString: PermissionString): {
	action: Action
	entity: Entity
	ownOnly?: boolean
} {
	const [action, entity, ownOnly] = permissionString.split(':') as [
		Action,
		Entity,
		OwnOnly,
	]
	const ownMap = { own: true, any: false, either: undefined }
	return {
		action,
		entity,
		ownOnly: ownMap[ownOnly],
	}
}

export function userHasPermission(
	user: Pick<ReturnType<typeof useUser>, 'roles'> | null,
	permission: `${Action}:${Entity}:${OwnOnly}`,
) {
	if (!user) return false
	const { action, entity, ownOnly } = parsePermissionString(permission)
	return user.roles.some(role =>
		role.permissions.some(
			permission =>
				permission.entity === entity &&
				permission.action === action &&
				((permission.ownOnly && ownOnly) || !permission.ownOnly),
		),
	)
}

export function userHasRole(
	user: Pick<ReturnType<typeof useUser>, 'roles'> | null,
	role: string,
) {
	if (!user) return false
	return user.roles.some(r => r.name === role)
}
