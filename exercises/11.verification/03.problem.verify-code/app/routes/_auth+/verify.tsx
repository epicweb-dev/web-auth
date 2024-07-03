import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import {
	Form,
	useActionData,
	useLoaderData,
	useSearchParams,
} from '@remix-run/react'
import { AuthenticityTokenInput } from 'remix-utils/csrf/react'
import { z } from 'zod'
import { ErrorList, Field } from '#app/components/forms.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { validateCSRF } from '#app/utils/csrf.server.ts'
import { useIsPending } from '#app/utils/misc.tsx'

export const codeQueryParam = 'code'
export const targetQueryParam = 'target'
// 🐨 add a typeQueryParam here
export const redirectToQueryParam = 'redirectTo'

// 🐨 create a schema for the typeQueryParam
// 💰 for right now, it should really just be a z.enum(['onboarding'])

const VerifySchema = z.object({
	[codeQueryParam]: z.string().min(6).max(6),
	// 🐨 add the typeQueryParam to the schema here
	[targetQueryParam]: z.string(),
	[redirectToQueryParam]: z.string().optional(),
})

export async function loader({ request }: LoaderFunctionArgs) {
	const params = new URL(request.url).searchParams
	if (!params.has(codeQueryParam)) {
		// we don't want to show an error message on page load if the otp hasn't be
		// prefilled in yet, so we'll send a response with an empty submission.
		return json({
			status: 'idle',
			submission: {
				intent: '',
				payload: Object.fromEntries(params) as Record<string, unknown>,
				error: {} as Record<string, Array<string>>,
			},
		} as const)
	}
	return validateRequest(request, params)
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	await validateCSRF(formData, request.headers)
	return validateRequest(request, formData)
}

async function validateRequest(
	request: Request,
	body: URLSearchParams | FormData,
) {
	const submission = await parse(body, {
		schema: () =>
			VerifySchema.superRefine(async (data, ctx) => {
				console.log('verify this', data)
				// 🐨 retrieve the verification secret, period, digits, charSet, and algorithm
				// by the target and type and ensure it's not expired
				// 🐨 if there's no verification, then add an issue to the code field
				// that it's invalid (similar to the one below)
				// 🐨 set codeIsValid to the result of calling verifyTOTP (from '@epic-web/totp')
				// with the verification config and the otp from the submitted data
				const codeIsValid = true
				if (!codeIsValid) {
					ctx.addIssue({
						path: [codeQueryParam],
						code: z.ZodIssueCode.custom,
						message: `Invalid code`,
					})
					return z.NEVER
				}
			}),

		async: true,
	})

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	// 💣 delete this. We're implementing it now!
	// we'll implement this later
	throw new Error('This is not yet implemented')

	// 🐨 grab the value from the submission

	// 🐨 delete the verification from the database

	// 🐨 uncomment all this stuff (this is the same stuff we just deleted from
	// the signup route in the last exercise):
	// const verifySession = await verifySessionStorage.getSession(
	// 	request.headers.get('cookie'),
	// )
	// verifySession.set(
	// 	onboardingEmailSessionKey,
	// 	submission.value[targetQueryParam],
	// )
	// return redirect('/onboarding', {
	// 	headers: {
	// 		'set-cookie': await verifySessionStorage.commitSession(verifySession),
	// 	},
	// })
}

export default function VerifyRoute() {
	const data = useLoaderData<typeof loader>()
	const [searchParams] = useSearchParams()
	const isPending = useIsPending()
	const actionData = useActionData<typeof action>()

	const [form, fields] = useForm({
		id: 'verify-form',
		constraint: getFieldsetConstraint(VerifySchema),
		lastSubmission: actionData?.submission ?? data.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: VerifySchema })
		},
		defaultValue: {
			code: searchParams.get(codeQueryParam) ?? '',
			// 🐨 add the typeQueryParam here
			target: searchParams.get(targetQueryParam) ?? '',
			redirectTo: searchParams.get(redirectToQueryParam) ?? '',
		},
	})

	return (
		<div className="container flex flex-col justify-center pb-32 pt-20">
			<div className="text-center">
				<h1 className="text-h1">Check your email</h1>
				<p className="mt-3 text-body-md text-muted-foreground">
					We've sent you a code to verify your email address.
				</p>
			</div>

			<Spacer size="xs" />

			<div className="mx-auto flex w-72 max-w-full flex-col justify-center gap-1">
				<div>
					<ErrorList errors={form.errors} id={form.errorId} />
				</div>
				<div className="flex w-full gap-2">
					<Form method="POST" {...form.props} className="flex-1">
						<AuthenticityTokenInput />
						<Field
							labelProps={{
								htmlFor: fields[codeQueryParam].id,
								children: 'Code',
							}}
							inputProps={conform.input(fields[codeQueryParam])}
							errors={fields[codeQueryParam].errors}
						/>
						{/* 🐨 add a hidden field for the type here */}
						<input
							{...conform.input(fields[targetQueryParam], { type: 'hidden' })}
						/>
						<input
							{...conform.input(fields[redirectToQueryParam], {
								type: 'hidden',
							})}
						/>
						<StatusButton
							className="w-full"
							status={isPending ? 'pending' : actionData?.status ?? 'idle'}
							type="submit"
							disabled={isPending}
						>
							Submit
						</StatusButton>
					</Form>
				</div>
			</div>
		</div>
	)
}
