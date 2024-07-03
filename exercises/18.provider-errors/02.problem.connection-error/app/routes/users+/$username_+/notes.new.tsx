import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '#app/utils/auth.server.ts'
import { invariantResponse } from '#app/utils/misc.tsx'
import { action, NoteEditor } from './__note-editor.tsx'

export async function loader({ request, params }: LoaderFunctionArgs) {
	const user = await requireUser(request)
	invariantResponse(user.username === params.username, 'Not authorized', {
		status: 403,
	})
	return json({})
}

export { action }
export default NoteEditor
