import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import {
	json,
	type DataFunctionArgs,
	type V2_MetaFunction,
} from '@remix-run/node'
import {
	Form,
	useActionData,
	useFormAction,
	useLoaderData,
	useNavigation,
} from '@remix-run/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import { ErrorList, Field } from '~/components/forms.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { passwordSchema } from '~/utils/user-validation.ts'
import { type VerifyFunctionArgs } from './verify.tsx'

export async function handleVerification({
	request,
	submission,
}: VerifyFunctionArgs) {
	// 🐨 the submission.value.target is the user's email or username. Use that to
	// find the user in the database.
	// 💰 You'll probably want to use OR to match either the email or username
	// 📜 https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#or
	// 🐨 if the user doesn't exist, then set submission.error.code = 'Invlid code'
	// and return a json response with a 400 status code
	// 🐨 otherwise, get the session from the request and set the
	// user's username in the session
	// 🐨 then redirect to the reset password page
	// 💰 don't forget to commit the session.
}

const ResetPasswordSchema = z
	.object({
		password: passwordSchema,
		confirmPassword: passwordSchema,
	})
	.refine(({ confirmPassword, password }) => password === confirmPassword, {
		message: 'The passwords did not match',
		path: ['confirmPassword'],
	})

export async function loader() {
	const resetPasswordUsername = 'get this from the session'
	return json({ resetPasswordUsername })
}

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: ResetPasswordSchema,
		acceptMultipleErrors: () => true,
	})
	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value?.password) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	throw new Error('This has not yet been implemented')
}

export const meta: V2_MetaFunction = () => {
	return [{ title: 'Reset Password | Epic Notes' }]
}

export default function ResetPasswordPage() {
	const data = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const formAction = useFormAction()
	const navigation = useNavigation()

	const [form, fields] = useForm({
		id: 'reset-password',
		constraint: getFieldsetConstraint(ResetPasswordSchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: ResetPasswordSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="container flex flex-col justify-center pb-32 pt-20">
			<div className="text-center">
				<h1 className="text-h1">Password Reset</h1>
				<p className="mt-3 text-body-md text-muted-foreground">
					Hi, {data.resetPasswordUsername}. No worries. It happens all the time.
				</p>
			</div>
			<Form
				method="POST"
				className="mx-auto mt-16 min-w-[368px] max-w-sm"
				{...form.props}
			>
				<Field
					labelProps={{
						htmlFor: fields.password.id,
						children: 'New Password',
					}}
					inputProps={{
						...conform.input(fields.password, { type: 'password' }),
						autoComplete: 'new-password',
						autoFocus: true,
					}}
					errors={fields.password.errors}
				/>
				<Field
					labelProps={{
						htmlFor: fields.confirmPassword.id,
						children: 'Confirm Password',
					}}
					inputProps={{
						...conform.input(fields.confirmPassword, { type: 'password' }),
						autoComplete: 'new-password',
					}}
					errors={fields.confirmPassword.errors}
				/>

				<ErrorList errors={form.errors} id={form.errorId} />

				<StatusButton
					className="w-full"
					status={
						navigation.state === 'submitting' &&
						navigation.formAction === formAction &&
						navigation.formMethod === 'POST'
							? 'pending'
							: actionData?.status ?? 'idle'
					}
					type="submit"
					disabled={navigation.state !== 'idle'}
				>
					Reset password
				</StatusButton>
			</Form>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
