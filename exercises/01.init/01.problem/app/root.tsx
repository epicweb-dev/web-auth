import { cssBundleHref } from '@remix-run/css-bundle'
import {
	json,
	type DataFunctionArgs,
	type LinksFunction,
} from '@remix-run/node'
import {
	Link,
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
	useMatches,
	type V2_MetaFunction,
} from '@remix-run/react'
import os from 'node:os'
import faviconAssetUrl from './assets/favicon.svg'
import { GeneralErrorBoundary } from './components/error-boundary.tsx'
import { SearchBar } from './components/search-bar.tsx'
import { Button } from './components/ui/button.tsx'
import { href as iconHref } from './components/ui/icon.tsx'
import { KCDShop } from './kcdshop.tsx'
import { ThemeSwitch, useTheme } from './routes/resources+/theme/index.tsx'
import { getTheme } from './routes/resources+/theme/theme.server.ts'
import fontStylestylesheetUrl from './styles/font.css'
import tailwindStylesheetUrl from './styles/tailwind.css'
import { getEnv } from './utils/env.server.ts'

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
	return json({
		username: os.userInfo().username,
		theme: getTheme(request),
		ENV: getEnv(),
	})
}

function Document({
	children,
	theme,
	env,
}: {
	children: React.ReactNode
	theme?: 'dark' | 'light'
	env?: Record<string, string>
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
				<ScrollRestoration />
				<Scripts />
				<KCDShop />
				<LiveReload />
			</body>
		</html>
	)
}

export default function App() {
	const data = useLoaderData<typeof loader>()
	const theme = useTheme()
	const matches = useMatches()
	const isOnSearchPage = matches.find(m => m.id === 'routes/users+/index')
	return (
		<Document theme={theme} env={data.ENV}>
			<header className="container mx-auto py-6">
				<nav className="flex items-center justify-between">
					<Link to="/">
						<div className="font-light">epic</div>
						<div className="font-bold">notes</div>
					</Link>
					{isOnSearchPage ? null : (
						<div className="ml-auto max-w-sm flex-1 pr-10">
							<SearchBar status="idle" />
						</div>
					)}
					<div className="flex items-center gap-10">
						<Button asChild variant="default" size="sm">
							<Link to="/login">Log In</Link>
						</Button>
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
					<ThemeSwitch userPreference={data.theme} />
				</div>
			</div>
			<div className="h-5" />
		</Document>
	)
}

export const meta: V2_MetaFunction = () => {
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
