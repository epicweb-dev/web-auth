import { json, type DataFunctionArgs } from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'
import { Icon } from '~/components/ui/icon.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { useIsSubmitting } from '~/utils/misc.tsx'

export const handle = {
	breadcrumb: <Icon name="link-2">Connections</Icon>,
}

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const rawGitHubConnections = await prisma.gitHubConnection.findMany({
		select: { providerId: true, createdAt: true },
		where: { userId },
	})
	// const githubConnections: Array<{id: string, username: string, createdAtFormatted: string}> = []
	// for (const connection of rawGitHubConnections) {

	// }
	return json({
		githubConnections: rawGitHubConnections.map(c => ({
			providerId: c.providerId,
			createdAtFormatted: c.createdAt.toLocaleString(),
		})),
	})
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
							<li key={c.providerId}>
								<Icon name="github-logo">GitHub {c.createdAtFormatted}</Icon>
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
