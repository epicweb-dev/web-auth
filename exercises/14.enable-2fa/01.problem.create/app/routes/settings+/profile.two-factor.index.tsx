import {
	json,
	redirect,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { Link, Form, useLoaderData } from '@remix-run/react'
import { AuthenticityTokenInput } from 'remix-utils/csrf/react'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { validateCSRF } from '#app/utils/csrf.server.ts'
import { useIsPending } from '#app/utils/misc.tsx'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request)
	return json({ isTwoFAEnabled: false })
}

export async function action({ request }: ActionFunctionArgs) {
	// 🐨 get the userId from here:
	await requireUserId(request)
	const formData = await request.formData()
	await validateCSRF(formData, request.headers)
	// 🐨 generate the otp config with generateTOTP (you don't need the otp that's returned, just the config)
	// 🐨 upsert the verification with the config.
	// 🐨 the type should be twoFAVerifyVerificationType which you can get from './profile.two-factor.verify.tsx'
	// 🐨 the target should be the userId
	// 🐨 Set the expiresAt to 10 minutes from now
	return redirect('/settings/profile/two-factor/verify')
}

export default function TwoFactorRoute() {
	const data = useLoaderData<typeof loader>()
	const isPending = useIsPending()

	return (
		<div className="flex flex-col gap-4">
			{data.isTwoFAEnabled ? (
				<>
					<p className="text-lg">
						<Icon name="check">
							You have enabled two-factor authentication.
						</Icon>
					</p>
					<Link to="disable">
						<Icon name="lock-open-1">Disable 2FA</Icon>
					</Link>
				</>
			) : (
				<>
					<p>
						<Icon name="lock-open-1">
							You have not enabled two-factor authentication yet.
						</Icon>
					</p>
					<p className="text-sm">
						Two factor authentication adds an extra layer of security to your
						account. You will need to enter a code from an authenticator app
						like{' '}
						<a className="underline" href="https://1password.com/">
							1Password
						</a>{' '}
						to log in.
					</p>
					<Form method="POST">
						<AuthenticityTokenInput />
						<StatusButton
							type="submit"
							name="intent"
							value="enable"
							status={isPending ? 'pending' : 'idle'}
							disabled={isPending}
							className="mx-auto"
						>
							Enable 2FA
						</StatusButton>
					</Form>
				</>
			)}
		</div>
	)
}
