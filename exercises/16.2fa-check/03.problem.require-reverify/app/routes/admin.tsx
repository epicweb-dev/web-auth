import { json, type DataFunctionArgs } from '@remix-run/node'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import { requireUserWithRole } from '#app/utils/permissions.ts'

export async function loader({ request }: DataFunctionArgs) {
	await requireUserWithRole(request, 'admin')
	return json({})
}

export default function AdminRoute() {
	return (
		<div className="container pb-32 pt-20">
			<div className="flex flex-col justify-center">
				<div className="text-center">
					<h1 className="text-h1">Admin</h1>
					<p className="mt-3 text-body-md text-muted-foreground">
						Yep, you've got admin permissions alright!
					</p>
				</div>
			</div>
			<Spacer size="xs" />
			<p className="mx-auto max-w-md text-center text-body-lg">
				Use your imagination. You could display all kinds of admin-y things on
				this page... For example, maybe a way to manage permissions?
			</p>
		</div>
	)
}
export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				403: () => <p>Yeah, you can't be here...</p>,
			}}
		/>
	)
}
