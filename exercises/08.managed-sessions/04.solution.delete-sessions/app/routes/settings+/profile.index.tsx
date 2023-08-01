import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { Link, useFetcher, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { ErrorList, Field } from '~/components/forms.tsx'
import { Button } from '~/components/ui/button.tsx'
import { Icon } from '~/components/ui/icon.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { requireUserId, sessionKey } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import {
	getUserImgSrc,
	invariantResponse,
	useDoubleCheck,
} from '~/utils/misc.tsx'
import { getSession } from '~/utils/session.server.ts'
import {
	emailSchema,
	nameSchema,
	usernameSchema,
} from '~/utils/user-validation.ts'

const ProfileFormSchema = z.object({
	name: nameSchema.optional(),
	username: usernameSchema,
	email: emailSchema,
})

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			username: true,
			email: true,
			image: {
				select: { id: true },
			},
			_count: {
				select: { sessions: true },
			},
		},
	})

	invariantResponse(user, 'User not found', { status: 404 })

	return json({ user })
}

type ProfileActionArgs = {
	request: Request
	userId: string
	formData: FormData
}
const profileUpdateActionIntent = 'update-profile'
const signOutOfSessionsActionIntent = 'sign-out-of-sessions'
const deleteDataActionIntent = 'delete-data'

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const intent = formData.get('intent')
	switch (intent) {
		case profileUpdateActionIntent: {
			return profileUpdateAction({ request, userId, formData })
		}
		case signOutOfSessionsActionIntent: {
			return signOutOfSessionsAction({ request, userId, formData })
		}
		case deleteDataActionIntent: {
			return deleteDataAction({ request, userId, formData })
		}
		default: {
			throw new Response(`Invalid intent "${intent}"`, { status: 400 })
		}
	}
}

export default function EditUserProfile() {
	const data = useLoaderData<typeof loader>()

	return (
		<div className="flex flex-col gap-12">
			<div className="flex justify-center">
				<div className="relative h-52 w-52">
					<img
						src={getUserImgSrc(data.user.image?.id)}
						alt={data.user.username}
						className="h-full w-full rounded-full object-cover"
					/>
					<Button
						asChild
						variant="outline"
						className="absolute -right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full p-0"
					>
						<Link
							preventScrollReset
							to="photo"
							title="Change profile photo"
							aria-label="Change profile photo"
						>
							<Icon name="camera" className="h-4 w-4" />
						</Link>
					</Button>
				</div>
			</div>
			<UpdateProfile />

			<div className="col-span-6 mb-12 mt-6 h-1 border-b-[1.5px]" />
			<div className="col-span-full flex flex-col gap-6">
				<div>
					<Link to="password">
						<Icon name="dots-horizontal">Change Password</Icon>
					</Link>
				</div>
				<div>
					<a
						download="my-epic-notes-data.json"
						href="/resources/download-user-data"
					>
						<Icon name="download">Download your data</Icon>
					</a>
				</div>
				<SignOutOfSessions />
				<DeleteData />
			</div>
		</div>
	)
}

async function profileUpdateAction({ userId, formData }: ProfileActionArgs) {
	const submission = await parse(formData, {
		async: true,
		schema: ProfileFormSchema.superRefine(async ({ email, username }, ctx) => {
			const existingUsername = await prisma.user.findUnique({
				where: { username },
				select: { id: true },
			})
			if (existingUsername && existingUsername.id !== userId) {
				ctx.addIssue({
					path: ['username'],
					code: 'custom',
					message: 'A user already exists with this username',
				})
			}
			const existingEmail = await prisma.user.findUnique({
				where: { email },
				select: { id: true },
			})
			if (existingEmail && existingEmail.id !== userId) {
				ctx.addIssue({
					path: ['email'],
					code: 'custom',
					message: 'A user already exists with this email',
				})
			}
		}),
	})
	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	const data = submission.value

	await prisma.user.update({
		select: { username: true },
		where: { id: userId },
		data: {
			name: data.name,
			username: data.username,
			email: data.email,
		},
	})

	return json({ status: 'success', submission } as const)
}

function UpdateProfile() {
	const data = useLoaderData<typeof loader>()

	const fetcher = useFetcher<typeof profileUpdateAction>()

	const [form, fields] = useForm({
		id: 'edit-profile',
		constraint: getFieldsetConstraint(ProfileFormSchema),
		lastSubmission: fetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: ProfileFormSchema })
		},
		defaultValue: {
			username: data.user.username,
			name: data.user.name ?? '',
			email: data.user.email,
		},
	})

	return (
		<fetcher.Form method="POST" {...form.props}>
			<div className="grid grid-cols-6 gap-x-10">
				<Field
					className="col-span-3"
					labelProps={{
						htmlFor: fields.username.id,
						children: 'Username',
					}}
					inputProps={conform.input(fields.username)}
					errors={fields.username.errors}
				/>
				<Field
					className="col-span-3"
					labelProps={{ htmlFor: fields.name.id, children: 'Name' }}
					inputProps={conform.input(fields.name)}
					errors={fields.name.errors}
				/>
				<Field
					className="col-span-3"
					labelProps={{ htmlFor: fields.email.id, children: 'Email' }}
					inputProps={conform.input(fields.email)}
					errors={fields.email.errors}
				/>
			</div>

			<ErrorList errors={form.errors} id={form.errorId} />

			<div className="mt-8 flex justify-center">
				<StatusButton
					type="submit"
					size="wide"
					name="intent"
					value={profileUpdateActionIntent}
					status={
						fetcher.state !== 'idle'
							? 'pending'
							: fetcher.data?.status ?? 'idle'
					}
				>
					Save changes
				</StatusButton>
			</div>
		</fetcher.Form>
	)
}

async function signOutOfSessionsAction({ request, userId }: ProfileActionArgs) {
	const cookieSession = await getSession(request.headers.get('cookie'))
	const sessionId = cookieSession.get(sessionKey)
	invariantResponse(
		sessionId,
		'You must be authenticated to sign out of other sessions',
	)
	await prisma.session.deleteMany({
		where: {
			userId,
			id: { not: sessionId },
		},
	})
	return json({ status: 'success' } as const)
}

function SignOutOfSessions() {
	const data = useLoaderData<typeof loader>()
	const dc = useDoubleCheck()

	const fetcher = useFetcher<typeof signOutOfSessionsAction>()
	const otherSessionsCount = data.user._count.sessions - 1
	return (
		<div>
			{otherSessionsCount ? (
				<fetcher.Form method="POST">
					<StatusButton
						{...dc.getButtonProps({
							type: 'submit',
							name: 'intent',
							value: signOutOfSessionsActionIntent,
						})}
						variant={dc.doubleCheck ? 'destructive' : 'default'}
						status={
							fetcher.state !== 'idle'
								? 'pending'
								: fetcher.data?.status ?? 'idle'
						}
					>
						<Icon name="avatar">
							{dc.doubleCheck
								? `Are you sure?`
								: `Sign out of ${otherSessionsCount} other sessions`}
						</Icon>
					</StatusButton>
				</fetcher.Form>
			) : (
				<Icon name="avatar">This is your only session</Icon>
			)}
		</div>
	)
}

async function deleteDataAction({ userId }: ProfileActionArgs) {
	await prisma.user.delete({ where: { id: userId } })
	return redirect('/')
}

function DeleteData() {
	const dc = useDoubleCheck()

	const fetcher = useFetcher<typeof deleteDataAction>()
	return (
		<div>
			<fetcher.Form method="POST">
				<StatusButton
					{...dc.getButtonProps({
						type: 'submit',
						name: 'intent',
						value: deleteDataActionIntent,
					})}
					variant={dc.doubleCheck ? 'destructive' : 'default'}
					status={fetcher.state !== 'idle' ? 'pending' : 'idle'}
				>
					<Icon name="trash">
						{dc.doubleCheck ? `Are you sure?` : `Delete all your data`}
					</Icon>
				</StatusButton>
			</fetcher.Form>
		</div>
	)
}
