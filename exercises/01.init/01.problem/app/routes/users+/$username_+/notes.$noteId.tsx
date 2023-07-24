import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import {
	Form,
	Link,
	useLoaderData,
	type V2_MetaFunction,
} from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import { floatingToolbarClassName } from '~/components/floating-toolbar.tsx'
import { Button } from '~/components/ui/button.tsx'
import { prisma } from '~/utils/db.server.ts'
import { invariantResponse } from '~/utils/misc.ts'
import { type loader as notesLoader } from './notes.tsx'

export async function loader({ params }: DataFunctionArgs) {
	const note = await prisma.note.findFirst({
		select: {
			title: true,
			content: true,
			images: {
				select: { id: true, altText: true },
			},
		},
		where: { id: params.noteId },
	})

	invariantResponse(note, 'Note not found', { status: 404 })

	return json({ note })
}

export async function action({ request, params }: DataFunctionArgs) {
	invariantResponse(params.noteId, 'noteId param is required')

	const formData = await request.formData()
	const intent = formData.get('intent')

	invariantResponse(intent === 'delete', 'Invalid intent')

	await prisma.note.delete({ where: { id: params.noteId } })
	return redirect(`/users/${params.username}/notes`)
}

export default function NoteRoute() {
	const data = useLoaderData<typeof loader>()

	return (
		<div className="absolute inset-0 flex flex-col px-10">
			<h2 className="mb-2 pt-12 text-h2 lg:mb-6">{data.note.title}</h2>
			<div className="overflow-y-auto pb-24">
				<ul className="flex flex-wrap gap-5 py-5">
					{data.note.images.map(image => (
						<li key={image.id}>
							<a href={`/resources/images/${image.id}`}>
								<img
									src={`/resources/images/${image.id}`}
									alt={image.altText ?? ''}
									className="h-32 w-32 rounded-lg object-cover"
								/>
							</a>
						</li>
					))}
				</ul>
				<p className="whitespace-break-spaces text-sm md:text-lg">
					{data.note.content}
				</p>
			</div>
			<div className={floatingToolbarClassName}>
				<Form method="post">
					<Button
						type="submit"
						variant="destructive"
						name="intent"
						value="delete"
					>
						Delete
					</Button>
				</Form>
				<Button asChild>
					<Link to="edit">Edit</Link>
				</Button>
			</div>
		</div>
	)
}

export const meta: V2_MetaFunction<
	typeof loader,
	{ 'routes/users+/$username_+/notes': typeof notesLoader }
> = ({ data, params, matches }) => {
	const notesMatch = matches.find(
		m => m.id === 'routes/users+/$username_+/notes',
	)
	const displayName = notesMatch?.data?.owner.name ?? params.username
	const noteTitle = data?.note.title ?? 'Note'
	const noteContentsSummary =
		data && data.note.content.length > 100
			? data?.note.content.slice(0, 97) + '...'
			: 'No content'
	return [
		{ title: `${noteTitle} | ${displayName}'s Notes | Epic Notes` },
		{
			name: 'description',
			content: noteContentsSummary,
		},
	]
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
