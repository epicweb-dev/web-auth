import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { type LoaderFunctionArgs } from '@remix-run/node'
import { prisma } from '#app/utils/db.server.ts'
import { invariantResponse } from '#app/utils/misc.tsx'

const fallbackImageId = 'fallback'
const fallbackImagePath = path.resolve(
	process.cwd(),
	'app',
	'assets',
	'user.png',
)

export async function loader({ params }: LoaderFunctionArgs) {
	invariantResponse(params.imageId, 'Image ID is required', { status: 400 })

	if (params.imageId === fallbackImageId) {
		const blob = await readFile(fallbackImagePath)
		return new Response(blob, {
			headers: {
				'content-type': 'image/png',
				'content-length': blob.length.toString(),
				'content-disposition': 'inline; filename="user.png"',
				'cache-control': 'public, max-age=31536000, immutable',
			},
		})
	}

	const image = await prisma.userImage.findUnique({
		where: { id: params.imageId },
		select: { contentType: true, blob: true },
	})

	invariantResponse(image, 'Not found', { status: 404 })

	return new Response(image.blob, {
		headers: {
			'content-type': image.contentType,
			'content-length': Buffer.byteLength(image.blob).toString(),
			'content-disposition': `inline; filename="${params.imageId}"`,
			'cache-control': 'public, max-age=31536000, immutable',
		},
	})
}
