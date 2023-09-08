import { json, type DataFunctionArgs } from '@remix-run/node'
import { Form } from '@remix-run/react'
import { AuthenticityTokenInput } from 'remix-utils/csrf/react'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { validateCSRF } from '#app/utils/csrf.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { useDoubleCheck, useIsPending } from '#app/utils/misc.tsx'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { twoFAVerificationType } from './profile.two-factor.tsx'

export const handle = {
	breadcrumb: <Icon name="lock-open-1">Disable</Icon>,
}

// 🐨 create a "requireRecentVerification" function that accepts a request and the userId
// 🐨 call shouldRequestTwoFA with the request and userId
// 🐨 if we should reverify, then get a verification URL with getRedirectToUrl
// from '#app/routes/_auth+/verify.tsx'
// 🐨 redirect to that URL
// 💯 as a bonus, use redirectWithToast and let the user know why they're being
// required to reverify.

export async function loader({ request }: DataFunctionArgs) {
	await requireUserId(request)
	// 🐨 call requireRecentVerification with the request and userId (from requireUserId)
	return json({})
}

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	// 🐨 call requireRecentVerification with the request and userId
	const formData = await request.formData()
	await validateCSRF(formData, request.headers)
	await prisma.verification.delete({
		where: { target_type: { target: userId, type: twoFAVerificationType } },
	})
	throw await redirectWithToast('/settings/profile/two-factor', {
		title: '2FA Disabled',
		description: 'Two factor authentication has been disabled.',
	})
}

export default function TwoFactorDisableRoute() {
	const isPending = useIsPending()
	const dc = useDoubleCheck()

	return (
		<div className="mx-auto max-w-sm">
			<Form method="POST">
				<AuthenticityTokenInput />
				<p>
					Disabling two factor authentication is not recommended. However, if
					you would like to do so, click here:
				</p>
				<StatusButton
					variant="destructive"
					status={isPending ? 'pending' : 'idle'}
					disabled={isPending}
					{...dc.getButtonProps({
						className: 'mx-auto',
						name: 'intent',
						value: 'disable',
						type: 'submit',
					})}
				>
					{dc.doubleCheck ? 'Are you sure?' : 'Disable 2FA'}
				</StatusButton>
			</Form>
		</div>
	)
}
