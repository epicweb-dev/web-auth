# Changelog

This file will keep track of significant changes that have happened in the
workshop material that is different from what you'll see in the videos.

## DataFunctionArgs

`DataFunctionArgs` was deprecated in Remix and will be removed in the future. It
is recommended to use `LoaderFunctionArgs` and `ActionFunctionArgs` instead
which are the exact same.

## Prisma v6

Updated everything to use Prisma v6. The only substantial change is instead of
using `Buffer.from` to convert a file to a `Uint8Array`, we now use
`new Uint8Array(await file.arrayBuffer())`.
