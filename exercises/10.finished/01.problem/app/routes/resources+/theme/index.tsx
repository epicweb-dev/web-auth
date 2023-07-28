import { useForm } from '@conform-to/react'
import { parse } from '@conform-to/zod'
import { json, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher, useRouteLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { ErrorList } from '~/components/forms.tsx'
import { Icon } from '~/components/ui/icon.tsx'
import { type loader as rootLoader } from '~/root.tsx'
import { setTheme } from './theme.server.ts'

const ROUTE_PATH = '/resources/theme'

const ThemeFormSchema = z.object({
	redirectTo: z.string().optional(),
	theme: z.enum(['light', 'dark']),
})

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: ThemeFormSchema,
	})
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}
	if (submission.intent !== 'submit') {
		return json({ status: 'success', submission } as const)
	}
	const { theme } = submission.value

	const responseInit = {
		headers: { 'Set-Cookie': setTheme(theme) },
	}
	return json({ success: true }, responseInit)
}

export function ThemeSwitch({
	userPreference,
}: {
	userPreference?: 'light' | 'dark'
}) {
	const fetcher = useFetcher()

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
		<fetcher.Form method="POST" action={ROUTE_PATH} {...form.props}>
			<div className="flex gap-2">
				<button
					name="theme"
					value={nextMode}
					className="flex h-8 w-8 cursor-pointer items-center justify-center"
				>
					{modeLabel[mode]}
				</button>
			</div>
			<ErrorList errors={form.errors} id={form.errorId} />
		</fetcher.Form>
	)
}

/**
 * @returns the user's theme preference, or the client hint theme if the user
 * has not set a preference.
 */
export function useTheme() {
	const root = useRouteLoaderData<typeof rootLoader>('root')
	return root?.theme ?? 'light'
}
