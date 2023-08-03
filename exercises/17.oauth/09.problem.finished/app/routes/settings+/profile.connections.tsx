import { json, type DataFunctionArgs, SerializeFrom } from '@remix-run/node'
import { Form, useFetcher, useLoaderData } from '@remix-run/react'
import { Icon } from '~/components/ui/icon.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { invariantResponse, useIsSubmitting } from '~/utils/misc.tsx'
import { createToastHeaders } from '~/utils/toast.server.ts'

export const handle = {
	breadcrumb: <Icon name="link-2">Connections</Icon>,
}

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const rawGitHubConnections = await prisma.gitHubConnection.findMany({
		select: { id: true, providerId: true, createdAt: true },
		where: { userId },
	})
	const githubConnections: Array<{
		id: string
		username: string
		createdAtFormatted: string
	}> = []
	for (const connection of rawGitHubConnections) {
		const response = await fetch(
			`https://api.github.com/user/${connection.providerId}`,
			{
				headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
			},
		)
		const json = await response.json()
		console.log({ json })
		githubConnections.push({
			id: connection.id,
			username: json.login,
			createdAtFormatted: connection.createdAt.toLocaleString(),
		})
	}
	return json({
		githubConnections,
	})
}

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	invariantResponse(
		formData.get('intent') === 'delete-connection',
		'Invalid intent',
	)
	const connectionId = formData.get('connectionId')
	invariantResponse(typeof connectionId === 'string', 'Invalid connectionId')
	await prisma.gitHubConnection.delete({
		where: {
			id: connectionId,
			userId: userId,
		},
	})
	const toastHeaders = await createToastHeaders({
		title: 'Deleted',
		description: 'Your connection has been deleted.',
	})
	return json({ status: 'success' } as const, { headers: toastHeaders })
}

export default function Connections() {
	const data = useLoaderData<typeof loader>()
	const isGitHubSubmitting = useIsSubmitting({
		formAction: '/auth/github',
	})

	return (
		<div className="max-w-md mx-auto">
			{data.githubConnections.length ? (
				<>
					<p>Here are your current connections:</p>
					<ul>
						{data.githubConnections.map(c => (
							<li key={c.id}>
								<Connection connection={c} />
							</li>
						))}
					</ul>
				</>
			) : (
				<p>You don't have any connections yet.</p>
			)}
			<Form
				className="mt-5 flex items-center justify-center gap-2 border-t-2 border-border pt-3"
				action="/auth/github"
				method="POST"
			>
				<StatusButton
					type="submit"
					className="w-full"
					status={isGitHubSubmitting ? 'pending' : 'idle'}
				>
					<Icon name="github-logo">Connect with GitHub</Icon>
				</StatusButton>
			</Form>
		</div>
	)
}

function Connection({
	connection,
}: {
	connection: SerializeFrom<typeof loader>['githubConnections'][number]
}) {
	const deleteFetcher = useFetcher<typeof action>()
	return (
		<div className="flex gap-2 justify-between">
			<Icon name="github-logo">
				GitHub {connection.username} {connection.createdAtFormatted}
			</Icon>
			<deleteFetcher.Form method="POST">
				<input name="connectionId" value={connection.id} type="hidden" />
				<StatusButton
					name="intent"
					value="delete-connection"
					variant="destructive"
					size="sm"
					status={
						deleteFetcher.state !== 'idle'
							? 'pending'
							: deleteFetcher.data?.status ?? 'idle'
					}
				>
					<Icon name="cross-1">Disconnect</Icon>
				</StatusButton>
			</deleteFetcher.Form>
		</div>
	)
}
