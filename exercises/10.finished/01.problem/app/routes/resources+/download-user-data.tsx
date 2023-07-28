import { json, type DataFunctionArgs } from '@remix-run/node'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { getDomainUrl } from '~/utils/misc.tsx'

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUniqueOrThrow({
		where: { id: userId },
		include: {
			image: {
				select: { id: true },
			},
			notes: {
				include: {
					images: {
						select: { id: true },
					},
				},
			},
			password: false, // <-- intentionally omit password
			roles: { include: { permissions: true } },
			sessions: true,
		},
	})

	const domain = getDomainUrl(request)

	return json({
		user: {
			...user,
			image: user.image
				? `${domain}/resources/user-images/${user.image.id}`
				: null,
			notes: user.notes.map(note => ({
				...note,
				images: note.images.map(
					image => `${domain}/resources/note-images/${image.id}`,
				),
			})),
		},
	})
}
