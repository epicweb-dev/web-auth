import os from 'node:os'
import { useForm } from '@conform-to/react'
import { parse } from '@conform-to/zod'
import { cssBundleHref } from '@remix-run/css-bundle'
import {
	json,
	redirect,
	type DataFunctionArgs,
	type LinksFunction,
} from '@remix-run/node'
import {
	Form,
	Link,
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useFetcher,
	useFetchers,
	useLoaderData,
	useMatches,
	type MetaFunction,
} from '@remix-run/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import { Toaster, toast as showToast } from 'sonner'
import { z } from 'zod'
import faviconAssetUrl from './assets/favicon.svg'
import { GeneralErrorBoundary } from './components/error-boundary.tsx'
import { ErrorList } from './components/forms.tsx'
import { SearchBar } from './components/search-bar.tsx'
import { Spacer } from './components/spacer.tsx'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from './components/ui/alert-dialog.tsx'
import { Button } from './components/ui/button.tsx'
import { Icon, href as iconHref } from './components/ui/icon.tsx'
import { KCDShop } from './kcdshop.tsx'
import fontStylestylesheetUrl from './styles/font.css'
import tailwindStylesheetUrl from './styles/tailwind.css'
import { csrf } from './utils/csrf.server.ts'
import { prisma } from './utils/db.server.ts'
import { getEnv } from './utils/env.server.ts'
import { honeypot } from './utils/honeypot.server.ts'
import {
	combineHeaders,
	getUserImgSrc,
	invariantResponse,
} from './utils/misc.tsx'
import { sessionStorage } from './utils/session.server.ts'
import { getTheme, setTheme, type Theme } from './utils/theme.server.ts'
import { getToast, type Toast } from './utils/toast.server.ts'
import { useOptionalUser } from './utils/user.ts'

export const links: LinksFunction = () => {
	return [
		// Preload svg sprite as a resource to avoid render blocking
		{ rel: 'preload', href: iconHref, as: 'image' },
		{ rel: 'icon', type: 'image/svg+xml', href: faviconAssetUrl },
		{ rel: 'stylesheet', href: fontStylestylesheetUrl },
		{ rel: 'stylesheet', href: tailwindStylesheetUrl },
		cssBundleHref ? { rel: 'stylesheet', href: cssBundleHref } : null,
	].filter(Boolean)
}

export async function loader({ request }: DataFunctionArgs) {
	const [csrfToken, csrfCookieHeader] = await csrf.commitToken()
	const honeyProps = honeypot.getInputProps()
	const { toast, headers: toastHeaders } = await getToast(request)
	const cookieSession = await sessionStorage.getSession(
		request.headers.get('cookie'),
	)
	const userId = cookieSession.get('userId')
	const user = userId
		? await prisma.user.findUnique({
				select: {
					id: true,
					name: true,
					username: true,
					image: { select: { id: true } },
				},
				where: { id: userId },
		  })
		: null
	if (userId && !user) {
		cookieSession.unset('userId')
		// something weird happened... The user is authenticated but we can't find
		// them in the database. Maybe they were deleted? Let's log them out.
		throw redirect('/', {
			headers: {
				'set-cookie': await sessionStorage.commitSession(cookieSession),
			},
		})
	}
	return json(
		{
			username: os.userInfo().username,
			user,
			theme: getTheme(request),
			toast,
			ENV: getEnv(),
			csrfToken,
			honeyProps,
		},
		{
			headers: combineHeaders({ 'set-cookie': csrfCookieHeader }, toastHeaders),
		},
	)
}

const ThemeFormSchema = z.object({
	theme: z.enum(['light', 'dark']),
})

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.formData()
	invariantResponse(
		formData.get('intent') === 'update-theme',
		'Invalid intent',
		{ status: 400 },
	)
	const submission = parse(formData, {
		schema: ThemeFormSchema,
	})
	if (submission.intent !== 'submit') {
		return json({ status: 'success', submission } as const)
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}
	const { theme } = submission.value

	const responseInit = {
		headers: { 'set-cookie': setTheme(theme) },
	}
	return json({ success: true, submission }, responseInit)
}

function Document({
	children,
	theme,
	env, // 🐨 add an isLoggedIn boolean that defaults to false
}: {
	children: React.ReactNode
	theme?: Theme
	env?: Record<string, string>
	// 🐨 add the type for isLoggedIn:
}) {
	return (
		<html lang="en" className={`${theme} h-full overflow-x-hidden`}>
			<head>
				<Meta />
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				<Links />
			</head>
			<body className="flex h-full flex-col justify-between bg-background text-foreground">
				{children}
				<script
					dangerouslySetInnerHTML={{
						__html: `window.ENV = ${JSON.stringify(env)}`,
					}}
				/>
				{/* 🐨 if isLoggedIn is true, then render the LogoutTimer */}
				<Toaster closeButton position="top-center" />
				<ScrollRestoration />
				<Scripts />
				<KCDShop />
				<LiveReload />
			</body>
		</html>
	)
}

function App() {
	const data = useLoaderData<typeof loader>()
	const theme = useTheme()
	const user = useOptionalUser()
	const matches = useMatches()
	const isOnSearchPage = matches.find(m => m.id === 'routes/users+/index')
	return (
		// 🐨 pass isLoggedIn (true if the user exists, false if not)
		<Document theme={theme} env={data.ENV}>
			<header className="container mx-auto py-6">
				<nav className="flex items-center justify-between gap-6">
					<Link to="/">
						<div className="font-light">epic</div>
						<div className="font-bold">notes</div>
					</Link>
					{isOnSearchPage ? null : (
						<div className="ml-auto max-w-sm flex-1">
							<SearchBar status="idle" />
						</div>
					)}
					<div className="flex items-center gap-10">
						{user ? (
							<div className="flex items-center gap-2">
								<Button asChild variant="secondary">
									<Link
										to={`/users/${user.username}`}
										className="flex items-center gap-2"
									>
										<img
											className="h-8 w-8 rounded-full object-cover"
											alt={user.name ?? user.username}
											src={getUserImgSrc(user.image?.id)}
										/>
										<span className="text-body-sm font-bold">
											{user.name ?? user.username}
										</span>
									</Link>
								</Button>
							</div>
						) : (
							<Button asChild variant="default" size="sm">
								<Link to="/login">Log In</Link>
							</Button>
						)}
					</div>
				</nav>
			</header>

			<div className="flex-1">
				<Outlet />
			</div>

			<div className="container mx-auto flex justify-between">
				<Link to="/">
					<div className="font-light">epic</div>
					<div className="font-bold">notes</div>
				</Link>
				<div className="flex gap-2 items-center">
					<p>Built with ♥️ by {data.username}</p>
					<ThemeSwitch userPreference={theme} />
				</div>
			</div>
			<Spacer size="3xs" />
			{data.toast ? <ShowToast toast={data.toast} /> : null}
		</Document>
	)
}

export default function AppWithProviders() {
	const data = useLoaderData<typeof loader>()
	return (
		<HoneypotProvider {...data.honeyProps}>
			<AuthenticityTokenProvider token={data.csrfToken}>
				<App />
			</AuthenticityTokenProvider>
		</HoneypotProvider>
	)
}

function useTheme() {
	const data = useLoaderData<typeof loader>()
	const fetchers = useFetchers()
	const themeFetcher = fetchers.find(
		f => f.formData?.get('intent') === 'update-theme',
	)
	const optimisticTheme = themeFetcher?.formData?.get('theme')
	if (optimisticTheme === 'light' || optimisticTheme === 'dark') {
		return optimisticTheme
	}
	return data.theme
}

function ThemeSwitch({ userPreference }: { userPreference?: Theme }) {
	const fetcher = useFetcher<typeof action>()

	const [form] = useForm({
		id: 'theme-switch',
		lastSubmission: fetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: ThemeFormSchema })
		},
	})

	const mode = userPreference ?? 'light'
	const nextMode = mode === 'light' ? 'dark' : 'light'
	const modeLabel = {
		light: (
			<Icon name="sun">
				<span className="sr-only">Light</span>
			</Icon>
		),
		dark: (
			<Icon name="moon">
				<span className="sr-only">Dark</span>
			</Icon>
		),
	}

	return (
		<fetcher.Form method="POST" {...form.props}>
			<input type="hidden" name="theme" value={nextMode} />
			<div className="flex gap-2">
				<button
					name="intent"
					value="update-theme"
					type="submit"
					className="flex h-8 w-8 cursor-pointer items-center justify-center"
				>
					{modeLabel[mode]}
				</button>
			</div>
			<ErrorList errors={form.errors} id={form.errorId} />
		</fetcher.Form>
	)
}

// 💣 you can remove this eslint line once you've rendered the LogoutTimer
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LogoutTimer() {
	const [status, setStatus] = useState<'idle' | 'show-modal'>('idle')
	// 🐨 bring in the location via useLocation so we can access location.key
	// 🐨 get a submit function via useSubmit
	// 🦉 normally you'd want these numbers to be much higher, but for the purpose
	// of this exercise, we'll make it short:
	const logoutTime = 5000
	const modalTime = 2000
	// 🦉 here's what would be more likely:
	// const logoutTime = 1000 * 60 * 60;
	// const modalTime = logoutTime - 1000 * 60 * 2;
	const modalTimer = useRef<ReturnType<typeof setTimeout>>()
	const logoutTimer = useRef<ReturnType<typeof setTimeout>>()

	const logout = useCallback(
		() => {
			// 🐨 call submit in here. The submit body can be null,
			// but the requestInit should be method POST and action '/logout'
		},
		[
			// 🐨 don't forget to include submit here in your dependencies!
		],
	)

	const cleanupTimers = useCallback(() => {
		clearTimeout(modalTimer.current)
		clearTimeout(logoutTimer.current)
	}, [])

	const resetTimers = useCallback(() => {
		cleanupTimers()
		modalTimer.current = setTimeout(() => {
			setStatus('show-modal')
		}, modalTime)
		logoutTimer.current = setTimeout(logout, logoutTime)
	}, [cleanupTimers, logout, logoutTime, modalTime])

	useEffect(
		() => resetTimers(),
		[
			resetTimers,
			// 🐨 whenever the location changes, we want to reset the timers, so you
			// can add location.key to this array:
		],
	)
	useEffect(() => cleanupTimers, [cleanupTimers])

	function closeModal() {
		setStatus('idle')
		resetTimers()
	}

	return (
		<AlertDialog
			aria-label="Pending Logout Notification"
			open={status === 'show-modal'}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you still there?</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription>
					You are going to be logged out due to inactivity. Close this modal to
					stay logged in.
				</AlertDialogDescription>
				<AlertDialogFooter className="flex items-end gap-8">
					<AlertDialogCancel onClick={closeModal}>
						Remain Logged In
					</AlertDialogCancel>
					{/* 🐨 make sure to set the method and action on this form so clicking
					logout submits a POST to the /logout route. */}
					<Form>
						<AlertDialogAction type="submit">Logout</AlertDialogAction>
					</Form>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

function ShowToast({ toast }: { toast: Toast }) {
	const { id, type, title, description } = toast
	useEffect(() => {
		setTimeout(() => {
			showToast[type](title, { id, description })
		}, 0)
	}, [description, id, title, type])
	return null
}

export const meta: MetaFunction = () => {
	return [
		{ title: 'Epic Notes' },
		{ name: 'description', content: `Your own captain's log` },
	]
}

export function ErrorBoundary() {
	return (
		<Document>
			<div className="flex-1">
				<GeneralErrorBoundary />
			</div>
		</Document>
	)
}
