import {
	conform,
	list,
	useFieldList,
	useFieldset,
	useForm,
	type FieldConfig,
} from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import {
	unstable_createMemoryUploadHandler as createMemoryUploadHandler,
	json,
	unstable_parseMultipartFormData as parseMultipartFormData,
	redirect,
	type DataFunctionArgs,
} from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { createId as cuid } from '@paralleldrive/cuid2'
import { useRef, useState } from 'react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import { floatingToolbarClassName } from '~/components/floating-toolbar.tsx'
import { ErrorList, Field, TextareaField } from '~/components/forms.tsx'
import { Button } from '~/components/ui/button.tsx'
import { Icon } from '~/components/ui/icon.tsx'
import { Label } from '~/components/ui/label.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { Textarea } from '~/components/ui/textarea.tsx'
import { prisma } from '~/utils/db.server.ts'
import { cn, invariantResponse, useIsSubmitting } from '~/utils/misc.ts'

export async function loader({ params }: DataFunctionArgs) {
	const note = await prisma.note.findFirst({
		where: { id: params.noteId },
		select: {
			title: true,
			content: true,
			images: {
				select: { id: true, altText: true },
			},
		},
	})

	invariantResponse(note, 'Note not found', { status: 404 })

	return json({ note })
}

const titleMinLength = 1
const titleMaxLength = 100
const contentMinLength = 1
const contentMaxLength = 10000

const MAX_UPLOAD_SIZE = 1024 * 1024 * 3 // 3MB

const ImageFieldsetSchema = z.object({
	id: z.string().optional(),
	file: z.instanceof(File).refine(file => {
		return file.size <= MAX_UPLOAD_SIZE
	}, 'File size must be less than 3MB'),
	altText: z.string().optional(),
})

const NoteEditorSchema = z.object({
	title: z.string().min(titleMinLength).max(titleMaxLength),
	content: z.string().min(contentMinLength).max(contentMaxLength),
	images: z.array(ImageFieldsetSchema).optional(),
})

async function transformFile(file: File) {
	return file.size > 0
		? { contentType: file.type, blob: Buffer.from(await file.arrayBuffer()) }
		: null
}

export async function action({ request, params }: DataFunctionArgs) {
	invariantResponse(params.noteId, 'noteId param is required')

	const formData = await parseMultipartFormData(
		request,
		createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
	)

	const submission = await parse(formData, {
		schema: NoteEditorSchema.transform(async ({ images = [], ...data }) => {
			return {
				...data,
				images: await Promise.all(
					images.map(async image => ({
						...image,
						file: await transformFile(image.file),
					})),
				),
			}
		}),
		async: true,
		acceptMultipleErrors: () => true,
	})

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}

	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	const { title, content, images = [] } = submission.value

	await prisma.$transaction(async $prisma => {
		await $prisma.image.deleteMany({
			where: {
				noteId: params.noteId,
				id: { notIn: images.map(i => i.id).filter(Boolean) },
			},
		})

		const updatedImages = await Promise.all(
			images.map(async image => {
				if (image.file) {
					const id = image.id ?? cuid()
					return await prisma.image.upsert({
						select: { id: true },
						where: { id },
						create: { altText: image.altText, file: { create: image.file } },
						update: {
							// update the id since it is used for caching
							id: cuid(),
							altText: image.altText,
							file: { update: image.file },
						},
					})
				} else if (image.id) {
					return await $prisma.image.update({
						select: { id: true },
						where: { id: image.id },
						data: { altText: image.altText },
					})
				}
			}),
		)

		await $prisma.note.update({
			select: { id: true },
			where: { id: params.noteId },
			data: {
				title,
				content,
				images: {
					set: updatedImages.filter(Boolean),
				},
			},
		})
	})

	return redirect(`/users/${params.username}/notes/${params.noteId}`)
}

export default function NoteEdit() {
	const data = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const isSubmitting = useIsSubmitting()

	const [form, fields] = useForm({
		id: 'note-editor',
		constraint: getFieldsetConstraint(NoteEditorSchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: NoteEditorSchema })
		},
		defaultValue: {
			title: data.note.title,
			content: data.note.content,
			images: data.note.images,
		},
	})
	const imageList = useFieldList(form.ref, fields.images)

	return (
		<div className="absolute inset-0">
			<Form
				method="post"
				className="flex h-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-10 pb-28 pt-12"
				{...form.props}
				encType="multipart/form-data"
			>
				{/*
					This hidden submit button is here to ensure that when the user hits
					"enter" on an input field, the primary form function is submitted
					rather than the first button in the form (which is delete/add image).
				*/}
				<button type="submit" className="hidden" />
				<div className="flex flex-col gap-1">
					<Field
						labelProps={{ children: 'Title' }}
						inputProps={{
							autoFocus: true,
							...conform.input(fields.title, { ariaAttributes: true }),
						}}
						errors={fields.title.errors}
					/>
					<TextareaField
						labelProps={{ children: 'Content' }}
						textareaProps={{
							...conform.textarea(fields.content, { ariaAttributes: true }),
						}}
						errors={fields.content.errors}
					/>
					<div>
						<Label>Images</Label>
						<ul className="flex flex-col gap-4">
							{imageList.map((image, index) => (
								<li
									key={image.key}
									className="relative border-b-2 border-muted-foreground"
								>
									<button
										className="absolute right-0 top-0 text-destructive"
										{...list.remove(fields.images.name, { index })}
									>
										<span aria-hidden>
											<Icon name="cross-1" />
										</span>{' '}
										<span className="sr-only">Remove image {index + 1}</span>
									</button>
									<ImageChooser config={image} />
								</li>
							))}
						</ul>
					</div>
					<Button
						className="mt-3"
						{...list.append(fields.images.name, { defaultValue: {} })}
					>
						<span aria-hidden>
							<Icon name="plus">Image</Icon>
						</span>{' '}
						<span className="sr-only">Add image</span>
					</Button>
				</div>
				<ErrorList id={form.errorId} errors={form.errors} />
			</Form>
			<div className={floatingToolbarClassName}>
				<Button form={form.id} variant="destructive" type="reset">
					Reset
				</Button>
				<StatusButton
					form={form.id}
					type="submit"
					disabled={isSubmitting}
					status={isSubmitting ? 'pending' : 'idle'}
				>
					Submit
				</StatusButton>
			</div>
		</div>
	)
}

function ImageChooser({
	config,
}: {
	config: FieldConfig<z.infer<typeof ImageFieldsetSchema>>
}) {
	const ref = useRef<HTMLFieldSetElement>(null)
	const fields = useFieldset(ref, config)
	const existingImage = Boolean(fields.id.defaultValue)
	const [previewImage, setPreviewImage] = useState<string | null>(
		existingImage ? `/resources/images/${fields.id.defaultValue}` : null,
	)
	const [altText, setAltText] = useState(fields.altText.defaultValue ?? '')

	return (
		<fieldset
			ref={ref}
			aria-invalid={Boolean(config.errors?.length) || undefined}
			aria-describedby={config.errors?.length ? config.errorId : undefined}
		>
			<div className="flex gap-3">
				<div className="w-32">
					<div className="relative h-32 w-32">
						<label
							htmlFor={fields.file.id}
							className={cn('group absolute h-32 w-32 rounded-lg', {
								'bg-accent opacity-40 focus-within:opacity-100 hover:opacity-100':
									!previewImage,
								'cursor-pointer focus-within:ring-4': !existingImage,
							})}
						>
							{previewImage ? (
								<div className="relative">
									<img
										src={previewImage}
										alt={altText ?? ''}
										className="h-32 w-32 rounded-lg object-cover"
									/>
									{existingImage ? null : (
										<div className="pointer-events-none absolute -right-0.5 -top-0.5 rotate-12 rounded-sm bg-secondary px-2 py-1 text-xs text-secondary-foreground shadow-md">
											new
										</div>
									)}
								</div>
							) : (
								<div className="flex h-32 w-32 items-center justify-center rounded-lg border border-muted-foreground text-4xl text-muted-foreground">
									<Icon name="plus" />
								</div>
							)}
							{existingImage ? (
								<input
									{...conform.input(fields.id, {
										type: 'hidden',
										ariaAttributes: true,
									})}
								/>
							) : null}
							<input
								aria-label="Image"
								className="absolute left-0 top-0 z-0 h-32 w-32 cursor-pointer opacity-0"
								onChange={event => {
									const file = event.target.files?.[0]

									if (file) {
										const reader = new FileReader()
										reader.onloadend = () => {
											setPreviewImage(reader.result as string)
										}
										reader.readAsDataURL(file)
									} else {
										setPreviewImage(null)
									}
								}}
								accept="image/*"
								{...conform.input(fields.file, {
									type: 'file',
									ariaAttributes: true,
								})}
							/>
						</label>
					</div>
					<div className="min-h-[32px] px-4 pb-3 pt-1">
						<ErrorList id={fields.file.errorId} errors={fields.file.errors} />
					</div>
				</div>
				<div className="flex-1">
					<Label htmlFor={fields.altText.id}>Alt Text</Label>
					<Textarea
						onChange={e => setAltText(e.currentTarget.value)}
						{...conform.textarea(fields.altText, { ariaAttributes: true })}
					/>
					<div className="min-h-[32px] px-4 pb-3 pt-1">
						<ErrorList
							id={fields.altText.errorId}
							errors={fields.altText.errors}
						/>
					</div>
				</div>
			</div>
			<div className="min-h-[32px] px-4 pb-3 pt-1">
				<ErrorList id={config.errorId} errors={config.errors} />
			</div>
		</fieldset>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No note with the id "{params.noteId}" exists</p>
				),
			}}
		/>
	)
}
