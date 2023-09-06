import { useRouteLoaderData } from '@remix-run/react'
import { type loader as rootLoader } from '#app/root.tsx'

export function useOptionalUser() {
	const data = useRouteLoaderData<typeof rootLoader>('root')
	return data?.user ?? null
}

export function useUser() {
	const maybeUser = useOptionalUser()
	if (!maybeUser) {
		throw new Error(
			'No user found in root loader, but user is required by useUser. If user is optional, try useOptionalUser instead.',
		)
	}
	return maybeUser
}
