import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import {
	json,
	redirect,
	type DataFunctionArgs,
	type MetaFunction,
} from '@remix-run/node'
import { Form, Link, useActionData } from '@remix-run/react'
import { AuthenticityTokenInput } from 'remix-utils/csrf/react'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ErrorList, Field } from '#app/components/forms.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { validateCSRF } from '#app/utils/csrf.server.ts'
import { checkHoneypot } from '#app/utils/honeypot.server.ts'
import { useIsPending } from '#app/utils/misc.tsx'
import { PasswordSchema, UsernameSchema } from '#app/utils/user-validation.ts'

const LoginFormSchema = z.object({
	username: UsernameSchema,
	password: PasswordSchema,
})

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.formData()
	await validateCSRF(formData, request.headers)
	checkHoneypot(formData)
	const submission = await parse(formData, {
		schema: LoginFormSchema,
		async: true,
	})
	// get the password off the payload that's sent back
	delete submission.payload.password

	if (submission.intent !== 'submit') {
		// @ts-expect-error - conform should probably have support for doing this
		delete submission.value?.password
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	return redirect('/')
}

export default function LoginPage() {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'login-form',
		constraint: getFieldsetConstraint(LoginFormSchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: LoginFormSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="flex min-h-full flex-col justify-center pb-32 pt-20">
			<div className="mx-auto w-full max-w-md">
				<div className="flex flex-col gap-3 text-center">
					<h1 className="text-h1">Welcome back!</h1>
					<p className="text-body-md text-muted-foreground">
						Please enter your details.
					</p>
				</div>
				<Spacer size="xs" />

				<div>
					<div className="mx-auto w-full max-w-md px-8">
						<Form method="POST" {...form.props}>
							<AuthenticityTokenInput />
							<HoneypotInputs />
							<Field
								labelProps={{ children: 'Username' }}
								inputProps={{
									...conform.input(fields.username),
									autoFocus: true,
									className: 'lowercase',
								}}
								errors={fields.username.errors}
							/>

							<Field
								labelProps={{ children: 'Password' }}
								inputProps={conform.input(fields.password, {
									type: 'password',
								})}
								errors={fields.password.errors}
							/>

							<div className="flex justify-between">
								<div />
								<div>
									<Link
										to="/forgot-password"
										className="text-body-xs font-semibold"
									>
										Forgot password?
									</Link>
								</div>
							</div>

							<ErrorList errors={form.errors} id={form.errorId} />

							<div className="flex items-center justify-between gap-6 pt-3">
								<StatusButton
									className="w-full"
									status={isPending ? 'pending' : actionData?.status ?? 'idle'}
									type="submit"
									disabled={isPending}
								>
									Log in
								</StatusButton>
							</div>
						</Form>
						<div className="flex items-center justify-center gap-2 pt-6">
							<span className="text-muted-foreground">New here?</span>
							<Link to="/signup">Create an account</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export const meta: MetaFunction = () => {
	return [{ title: 'Login to Epic Notes' }]
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
