import {
	json,
	type DataFunctionArgs,
	type SerializeFrom,
} from '@remix-run/node'
import { Form, useFetcher, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '#app/components/ui/tooltip.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { invariantResponse, useIsPending } from '#app/utils/misc.tsx'
import { createToastHeaders } from '#app/utils/toast.server.ts'

export const handle = {
	breadcrumb: <Icon name="link-2">Connections</Icon>,
}

const GitHubUserSchema = z.object({
	login: z.string(),
})

async function userCanDeleteConnections(userId: string) {
	const user = await prisma.user.findUnique({
		select: {
			password: { select: { userId: true } },
			_count: { select: { gitHubConnections: true } },
		},
		where: { id: userId },
	})
	// user can delete their connections if they have a password
	if (user?.password) return true
	// users have to have more than one remaining connection to delete one
	return Boolean(
		user?._count.gitHubConnections && user?._count.gitHubConnections > 1,
	)
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
				headers: {
					Authorization: `token ${process.env.GITHUB_TOKEN}`,
				},
			},
		)
		const rawJson = await response.json()
		const result = GitHubUserSchema.safeParse(rawJson)
		githubConnections.push({
			id: connection.id,
			username: result.success ? result.data.login : 'Unknown',
			createdAtFormatted: connection.createdAt.toLocaleString(),
		})
	}

	return json({
		githubConnections,
		canDeleteConnections: await userCanDeleteConnections(userId),
	})
}

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	invariantResponse(
		formData.get('intent') === 'delete-connection',
		'Invalid intent',
	)
	invariantResponse(
		await userCanDeleteConnections(userId),
		'You cannot delete your last connection unless you have a password.',
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
	const isGitHubSubmitting = useIsPending({ formAction: '/auth/github' })

	return (
		<div className="max-w-md mx-auto">
			{data.githubConnections.length ? (
				<div className="flex gap-2 flex-col">
					<p>Here are your current connections:</p>
					<ul className="flex flex-col gap-4">
						{data.githubConnections.map(c => (
							<li key={c.id}>
								<Connection
									connection={c}
									canDelete={data.canDeleteConnections}
								/>
							</li>
						))}
					</ul>
				</div>
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
	canDelete,
}: {
	connection: SerializeFrom<typeof loader>['githubConnections'][number]
	canDelete: boolean
}) {
	const deleteFetcher = useFetcher<typeof action>()
	return (
		<div className="flex gap-2 justify-between">
			<Icon name="github-logo">
				<a
					href={`https://github.com/${connection.username}`}
					className="underline"
				>
					{connection.username}
				</a>{' '}
				({connection.createdAtFormatted})
			</Icon>
			{canDelete ? (
				<deleteFetcher.Form method="POST">
					<input name="connectionId" value={connection.id} type="hidden" />
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
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
									<Icon name="cross-1" />
								</StatusButton>
							</TooltipTrigger>
							<TooltipContent>Disconnect this account</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</deleteFetcher.Form>
			) : (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger>
							<Icon name="question-mark-circled"></Icon>
						</TooltipTrigger>
						<TooltipContent>
							You cannot delete your last connection unless you have a password.
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
		</div>
	)
}
