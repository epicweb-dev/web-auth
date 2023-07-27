import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import {
	json,
	redirect,
	unstable_createMemoryUploadHandler,
	unstable_parseMultipartFormData,
	type DataFunctionArgs,
} from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import { ServerOnly } from 'remix-utils'
import { z } from 'zod'
import { ErrorList } from '~/components/forms.tsx'
import { Button } from '~/components/ui/button.tsx'
import { Icon } from '~/components/ui/icon.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { authenticator, requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import {
	getUserImgSrc,
	transformFile,
	useDoubleCheck,
	useIsSubmitting,
} from '~/utils/misc.tsx'

export const handle = {
	breadcrumb: <Icon name="avatar">Photo</Icon>,
}

const MAX_SIZE = 1024 * 1024 * 3 // 3MB

const PhotoFormSchema = z.object({
	photoFile: z
		.instanceof(File)
		.refine(file => file.size > 0, 'Image is required')
		.refine(file => file.size <= MAX_SIZE, 'Image size must be less than 3MB'),
})

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			username: true,
			image: { select: { id: true } },
		},
	})
	if (!user) {
		throw await authenticator.logout(request, { redirectTo: '/' })
	}
	return json({ user })
}

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await unstable_parseMultipartFormData(
		request,
		unstable_createMemoryUploadHandler({ maxPartSize: MAX_SIZE }),
	)
	const intent = formData.get('intent')
	if (intent === 'delete') {
		await prisma.image.deleteMany({ where: { userId } })
		return redirect('/settings/profile')
	}

	const submission = await parse(formData, {
		schema: PhotoFormSchema.transform(async data => {
			const file = await transformFile(data.photoFile)
			if (!file) return z.NEVER
			return { file }
		}),
		async: true,
	})

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	const { file } = submission.value

	await prisma.$transaction(async $prisma => {
		await $prisma.image.deleteMany({ where: { userId } })
		await $prisma.user.update({
			where: { id: userId },
			data: { image: { create: { file: { create: file } } } },
		})
	})

	return redirect('/settings/profile')
}

export default function PhotoRoute() {
	const data = useLoaderData<typeof loader>()

	const doubleCheckDeleteImage = useDoubleCheck()

	const actionData = useActionData<typeof action>()

	const [form, fields] = useForm({
		id: 'profile-photo',
		constraint: getFieldsetConstraint(PhotoFormSchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: PhotoFormSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	const isSubmitting = useIsSubmitting()

	const [newImageSrc, setNewImageSrc] = useState<string | null>(null)

	return (
		<div>
			<Form
				method="POST"
				encType="multipart/form-data"
				className="flex flex-col items-center justify-center gap-10"
				onReset={() => setNewImageSrc(null)}
				{...form.props}
			>
				<img
					src={
						newImageSrc ?? (data.user ? getUserImgSrc(data.user.image?.id) : '')
					}
					className="h-52 w-52 rounded-full object-cover"
					alt={data.user?.name ?? data.user?.username}
				/>
				<ErrorList errors={fields.photoFile.errors} id={fields.photoFile.id} />
				<input
					{...conform.input(fields.photoFile, { type: 'file' })}
					accept="image/*"
					className="peer sr-only"
					tabIndex={newImageSrc ? -1 : 0}
					onChange={e => {
						const file = e.currentTarget.files?.[0]
						if (file) {
							const reader = new FileReader()
							reader.onload = event => {
								setNewImageSrc(event.target?.result?.toString() ?? null)
							}
							reader.readAsDataURL(file)
						}
					}}
				/>
				{newImageSrc ? (
					<div className="flex gap-4">
						<StatusButton
							type="submit"
							status={isSubmitting ? 'pending' : actionData?.status ?? 'idle'}
							disabled={isSubmitting}
						>
							Save Photo
						</StatusButton>
						<Button type="reset" variant="secondary">
							Reset
						</Button>
					</div>
				) : (
					<div className="flex gap-4 peer-invalid:[&>.server-only[type='submit']]:hidden">
						<Button asChild className="cursor-pointer">
							<label htmlFor={fields.photoFile.id}>
								<Icon name="pencil-1">Change</Icon>
							</label>
						</Button>

						{/* This is here for progressive enhancement. If the client doesn't
						hydrate (or hasn't yet) this button will be available to submit the
						selected photo. */}
						<ServerOnly>
							{() => (
								<Button type="submit" className="server-only">
									Save Photo
								</Button>
							)}
						</ServerOnly>
						{data.user.image?.id ? (
							<Button
								variant="destructive"
								{...doubleCheckDeleteImage.getButtonProps({
									type: 'submit',
									name: 'intent',
									value: 'delete',
								})}
							>
								<Icon name="trash">
									{doubleCheckDeleteImage.doubleCheck
										? 'Are you sure?'
										: 'Delete'}
								</Icon>
							</Button>
						) : null}
					</div>
				)}
				<ErrorList errors={form.errors} />
			</Form>
		</div>
	)
}
