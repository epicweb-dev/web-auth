import { json, type DataFunctionArgs } from '@remix-run/node'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import { Spacer } from '~/components/spacer.tsx'

export async function loader({ request }: DataFunctionArgs) {
	// 🐨 lock down this route to only users with the "admin" role
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
			<p className="max-w-md mx-auto text-body-lg text-center">
				Use your imagination. You could display all kinds of admin-y things on
				this page...
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
