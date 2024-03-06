import { conform, useForm, type Submission } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { generateTOTP, verifyTOTP } from '@epic-web/totp'
import { json, type DataFunctionArgs } from '@remix-run/node'
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
import { prisma } from '#app/utils/db.server.ts'
import { getDomainUrl, useIsPending } from '#app/utils/misc.tsx'
import { handleVerification as handleOnboardingVerification } from './onboarding.tsx'

export const codeQueryParam = 'code'
export const targetQueryParam = 'target'
export const typeQueryParam = 'type'
export const redirectToQueryParam = 'redirectTo'
// 🐨 add a 'reset-password' verification type to this type array
const types = ['onboarding'] as const
const VerificationTypeSchema = z.enum(types)
export type VerificationTypes = z.infer<typeof VerificationTypeSchema>

const VerifySchema = z.object({
	[codeQueryParam]: z.string().min(6).max(6),
	[typeQueryParam]: VerificationTypeSchema,
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
				payload: Object.fromEntries(params) as Record<string, unknown>,
				error: {} as Record<string, Array<string>>,
			},
		} as const)
	}
	return validateRequest(request, params)
}

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.formData()
	await validateCSRF(formData, request.headers)
	return validateRequest(request, formData)
}

export function getRedirectToUrl({
	request,
	type,
	target,
	redirectTo,
}: {
	request: Request
	type: VerificationTypes
	target: string
	redirectTo?: string
}) {
	const redirectToUrl = new URL(`${getDomainUrl(request)}/verify`)
	redirectToUrl.searchParams.set(typeQueryParam, type)
	redirectToUrl.searchParams.set(targetQueryParam, target)
	if (redirectTo) {
		redirectToUrl.searchParams.set(redirectToQueryParam, redirectTo)
	}
	return redirectToUrl
}

export async function prepareVerification({
	period,
	request,
	type,
	target,
	redirectTo: postVerificationRedirectTo,
}: {
	period: number
	request: Request
	type: VerificationTypes
	target: string
	redirectTo?: string
}) {
	const verifyUrl = getRedirectToUrl({
		request,
		type,
		target,
		redirectTo: postVerificationRedirectTo,
	})
	const redirectTo = new URL(verifyUrl.toString())

	const { otp, ...verificationConfig } = generateTOTP({
		algorithm: 'SHA256',
		period,
	})

	const verificationData = {
		type,
		target,
		...verificationConfig,
		expiresAt: new Date(Date.now() + verificationConfig.period * 1000),
	}
	await prisma.verification.upsert({
		where: { target_type: { target, type } },
		create: verificationData,
		update: verificationData,
	})

	// add the otp to the url we'll email the user.
	verifyUrl.searchParams.set(codeQueryParam, otp)

	return { otp, redirectTo, verifyUrl }
}

export type VerifyFunctionArgs = {
	request: Request
	submission: Submission<z.infer<typeof VerifySchema>>
	body: FormData | URLSearchParams
}

export async function isCodeValid({
	code,
	type,
	target,
}: {
	code: string
	type: VerificationTypes
	target: string
}) {
	const verification = await prisma.verification.findUnique({
		where: {
			target_type: { target, type },
			OR: [{ expiresAt: { gt: new Date() } }, { expiresAt: null }],
		},
		select: { algorithm: true, secret: true, period: true, charSet: true },
	})
	if (!verification) return false
	const result = verifyTOTP({
		otp: code,
		secret: verification.secret,
		algorithm: verification.algorithm,
		period: verification.period,
		charSet: verification.charSet,
	})
	if (!result) return false

	return true
}

async function validateRequest(
	request: Request,
	body: URLSearchParams | FormData,
) {
	const submission = await parse(body, {
		schema: () =>
			VerifySchema.superRefine(async (data, ctx) => {
				const codeIsValid = await isCodeValid({
					code: data[codeQueryParam],
					type: data[typeQueryParam],
					target: data[targetQueryParam],
				})
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

	const { value: submissionValue } = submission

	await prisma.verification.delete({
		where: {
			target_type: {
				target: submissionValue[targetQueryParam],
				type: submissionValue[typeQueryParam],
			},
		},
	})

	switch (submissionValue[typeQueryParam]) {
		// 🐨 add 'reset-password' case to this switch statement
		// and call the handler in ./reset-password.tsx file
		case 'onboarding': {
			return handleOnboardingVerification({ request, body, submission })
		}
	}
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
			type: searchParams.get(typeQueryParam) ?? '',
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
						<input
							{...conform.input(fields[typeQueryParam], { type: 'hidden' })}
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
