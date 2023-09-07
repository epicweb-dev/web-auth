import { Outlet } from '@remix-run/react'
import { Icon } from '#app/components/ui/icon.tsx'

export const handle = {
	breadcrumb: <Icon name="lock-closed">2FA</Icon>,
}

// 🐨 export a twoFAVerificationType constant set to '2fa'
// 🦺 make it type-safer by adding "satisifes VerificationTypes"

export default function TwoFactorRoute() {
	return <Outlet />
}
