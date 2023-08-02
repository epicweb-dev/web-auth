import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { verifyTOTP } from '@epic-web/totp'
import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import {
	Form,
	useActionData,
	useLoaderData,
	useSearchParams,
} from '@remix-run/react'
import { z } from 'zod'
import { ErrorList, Field } from '~/components/forms.tsx'
import { Spacer } from '~/components/spacer.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { prisma } from '~/utils/db.server.ts'
import { useIsSubmitting } from '~/utils/misc.tsx'
import { commitSession, getSession } from '~/utils/session.server.ts'
import { onboardingEmailSessionKey } from './onboarding.tsx'

export const codeQueryParam = 'code'
export const targetQueryParam = 'target'
export const redirectToQueryParam = 'redirectTo'

const VerifySchema = z.object({
	[codeQueryParam]: z.string().min(6).max(6),
	[targetQueryParam]: z.string(),
	[redirectToQueryParam]: z.string().optional(),
})

export async function loader({ request }: DataFunctionArgs) {
	const params = new URL(request.url).searchParams
	if (!params.has(codeQueryParam)) {
		// we don't want to show an error message on page load if the otp hasn't be
		// prefilled in yet, so we'll send a response with an empty submission.
		return json({
			status: 'idle',
			submission: {
				intent: '',
				payload: Object.fromEntries(params),
				error: {},
			},
		} as const)
	}
	return validateRequest(request, params)
}

export async function action({ request }: DataFunctionArgs) {
	return validateRequest(request, await request.formData())
}

async function validateRequest(
	request: Request,
	body: URLSearchParams | FormData,
) {
	const submission = await parse(body, {
		schema: () =>
			VerifySchema.superRefine(async (data, ctx) => {
				const verification = await prisma.verification.findUnique({
					select: { secret: true, period: true, digits: true, algorithm: true },
					where: {
						target_type: {
							target: data[targetQueryParam],
							type: 'onboarding',
						},
					},
				})
				if (!verification) {
					ctx.addIssue({
						path: ['code'],
						code: z.ZodIssueCode.custom,
						message: `Invalid code`,
					})
					return
				}
				const codeIsValid = verifyTOTP({
					otp: data[codeQueryParam],
					...verification,
				})
				if (!codeIsValid) {
					ctx.addIssue({
						path: ['code'],
						code: z.ZodIssueCode.custom,
						message: `Invalid code`,
					})
					return
				}
			}),
		acceptMultipleErrors: () => true,
		async: true,
	})

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	await prisma.verification.delete({
		where: {
			target_type: {
				target: submission.value[targetQueryParam],
				type: 'onboarding',
			},
		},
	})

	const session = await getSession(request.headers.get('cookie'))
	session.set(onboardingEmailSessionKey, submission.value[targetQueryParam])
	return redirect('/onboarding', {
		headers: { 'set-cookie': await commitSession(session) },
	})
}

export default function VerifyRoute() {
	const data = useLoaderData<typeof loader>()
	const [searchParams] = useSearchParams()
	const isSubmitting = useIsSubmitting()
	const actionData = useActionData<typeof action>()

	const [form, fields] = useForm({
		id: 'verify-form',
		constraint: getFieldsetConstraint(VerifySchema),
		lastSubmission: actionData?.submission ?? data.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: VerifySchema })
		},
		defaultValue: {
			code: searchParams.get('code') ?? '',
			type: searchParams.get('type') ?? '',
			target: searchParams.get('target') ?? '',
			redirectTo: searchParams.get('redirectTo') ?? '',
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

			<div className="mx-auto flex flex-col justify-center gap-1 w-72 max-w-full">
				<div>
					<ErrorList errors={form.errors} id={form.errorId} />
				</div>
				<div className="flex w-full gap-2">
					<Form method="POST" {...form.props} className="flex-1">
						<Field
							labelProps={{
								htmlFor: fields[codeQueryParam].id,
								children: 'Code',
							}}
							inputProps={conform.input(fields[codeQueryParam])}
							errors={fields[codeQueryParam].errors}
						/>
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
							status={isSubmitting ? 'pending' : actionData?.status ?? 'idle'}
							type="submit"
							disabled={isSubmitting}
						>
							Submit
						</StatusButton>
					</Form>
				</div>
			</div>
		</div>
	)
}
