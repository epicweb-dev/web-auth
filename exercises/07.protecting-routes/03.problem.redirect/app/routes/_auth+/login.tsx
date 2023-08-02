import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import {
	json,
	redirect,
	type DataFunctionArgs,
	type V2_MetaFunction,
} from '@remix-run/node'
import { Form, Link, useActionData } from '@remix-run/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import { CheckboxField, ErrorList, Field } from '~/components/forms.tsx'
import { Spacer } from '~/components/spacer.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import {
	SESSION_EXPIRATION_TIME,
	login,
	requireAnonymous,
	userIdKey,
} from '~/utils/auth.server.ts'
import { useIsSubmitting } from '~/utils/misc.tsx'
import { commitSession, getSession } from '~/utils/session.server.ts'
import { passwordSchema, usernameSchema } from '~/utils/user-validation.ts'
import { checkboxSchema } from '~/utils/zod-extensions.ts'

const LoginFormSchema = z.object({
	username: usernameSchema,
	password: passwordSchema,
	// 🐨 add config for a redirectTo (optional string)
	remember: checkboxSchema(),
})

export async function loader({ request }: DataFunctionArgs) {
	await requireAnonymous(request)
	return json({})
}

export async function action({ request }: DataFunctionArgs) {
	await requireAnonymous(request)
	const formData = await request.formData()
	const submission = await parse(formData, {
		schema: intent =>
			LoginFormSchema.transform(async (data, ctx) => {
				if (intent !== 'submit') return { ...data, user: null }

				const user = await login(data)
				if (!user) {
					ctx.addIssue({
						code: 'custom',
						message: 'Invalid username or password',
					})
					return z.NEVER
				}

				return { ...data, user }
			}),
		async: true,
	})
	// get the password off the payload that's sent back
	delete submission.payload.password

	if (submission.intent !== 'submit') {
		// @ts-expect-error - conform should probably have support for doing this
		delete submission.value?.password
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value?.user) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	// 🐨 get the redirectTo from the submission
	const { user, remember } = submission.value

	const cookieSession = await getSession(request.headers.get('cookie'))
	cookieSession.set(userIdKey, user.id)

	// 🐨 redirect to the redirectTo
	// 🦉 Make sure to use the safeRedirect utility from remix-utils
	return redirect('/', {
		headers: {
			'set-cookie': await commitSession(cookieSession, {
				expires: remember
					? new Date(Date.now() + SESSION_EXPIRATION_TIME)
					: undefined,
			}),
		},
	})
}

export default function LoginPage() {
	const actionData = useActionData<typeof action>()
	const isSubmitting = useIsSubmitting()
	// 🐨 get the search params via useSearchParams from @remix-run/react
	// 🐨 get the redirectTo from the search params

	const [form, fields] = useForm({
		id: 'login-form',
		constraint: getFieldsetConstraint(LoginFormSchema),
		// 🐨 add a defaultValues object with the redirectTo
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
							<input type="hidden" name="form" value={form.id} />
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
								<CheckboxField
									labelProps={{
										htmlFor: fields.remember.id,
										children: 'Remember me',
									}}
									buttonProps={conform.input(fields.remember, {
										type: 'checkbox',
									})}
									errors={fields.remember.errors}
								/>
								<div>
									<Link
										to="/forgot-password"
										className="text-body-xs font-semibold"
									>
										Forgot password?
									</Link>
								</div>
							</div>

							{/* 🐨 add a hidden input here for the redirectTo */}

							<ErrorList errors={form.errors} id={form.errorId} />

							<div className="flex items-center justify-between gap-6 pt-3">
								<StatusButton
									className="w-full"
									status={
										isSubmitting ? 'pending' : actionData?.status ?? 'idle'
									}
									type="submit"
									disabled={isSubmitting}
								>
									Log in
								</StatusButton>
							</div>
						</Form>
						<div className="flex items-center justify-center gap-2 pt-6">
							<span className="text-muted-foreground">New here?</span>
							{/* 🐨 update this to attribute to include the redirectTo if it exists */}
							<Link to="/signup">Create an account</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export const meta: V2_MetaFunction = () => {
	return [{ title: 'Login to Epic Notes' }]
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
