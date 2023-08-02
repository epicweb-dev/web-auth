import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher } from '@remix-run/react'
import { Icon } from '~/components/ui/icon.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { useDoubleCheck } from '~/utils/misc.tsx'
import { redirectWithToast } from '~/utils/toast.server.ts'
import { shouldRequestTwoFA } from '../_auth+/login.tsx'
import { getRedirectToUrl } from '../_auth+/verify.tsx'
import { twoFAVerificationType } from './profile.two-factor.tsx'

export const handle = {
	breadcrumb: <Icon name="lock-open-1">Disable</Icon>,
}

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const verification = await prisma.verification.findFirst({
		where: { type: twoFAVerificationType, target: userId },
		select: { id: true },
	})
	if (!verification) {
		return redirect('/settings/profile/two-factor')
	}
	const shouldReverify = await shouldRequestTwoFA(request)
	if (shouldReverify) {
		const redirectUrl = getRedirectToUrl({
			request,
			target: userId,
			type: twoFAVerificationType,
			redirectTo: request.url,
		})
		return redirectWithToast(redirectUrl.toString(), {
			title: 'Please Reverify',
			description: 'Please reverify your account before proceeding',
		})
	}
	return json({})
}

export async function action({ request }: DataFunctionArgs) {
	if (await shouldRequestTwoFA(request)) {
		// looks like they waited too long enter the email
		return redirectWithToast(request.url, {
			title: 'Please Reverify',
			description: 'Please reverify your account before proceeding',
		})
	}
	const userId = await requireUserId(request)
	await prisma.verification.deleteMany({
		where: { type: twoFAVerificationType, target: userId },
	})
	return json({ status: 'success' } as const)
}

export default function TwoFactorDisableRoute() {
	const toggle2FAFetcher = useFetcher<typeof action>()
	const dc = useDoubleCheck()

	return (
		<div className="mx-auto max-w-sm">
			<toggle2FAFetcher.Form method="POST" preventScrollReset>
				<p>
					Disabling two factor authentication is not recommended. However, if
					you would like to do so, click here:
				</p>
				<StatusButton
					variant="destructive"
					status={toggle2FAFetcher.state === 'loading' ? 'pending' : 'idle'}
					{...dc.getButtonProps({
						className: 'mx-auto',
						name: 'intent',
						value: 'disable',
						type: 'submit',
					})}
				>
					{dc.doubleCheck ? 'Are you sure?' : 'Disable 2FA'}
				</StatusButton>
			</toggle2FAFetcher.Form>
		</div>
	)
}
