import { json, type DataFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { Icon } from '~/components/ui/icon.tsx'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'

export const handle = {
	breadcrumb: <Icon name="link-2">Connections</Icon>,
}

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const githubConnections = await prisma.gitHubConnection.findMany({
		select: { providerId: true, createdAt: true },
		where: { userId },
	})
	return json({ githubConnections })
}

export default function Connections() {
	const data = useLoaderData<typeof loader>()

	return (
		<div>
			<h2>Connections</h2>
		</div>
	)
}
