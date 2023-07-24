import React, { useId } from 'react'
import { Input } from '~/components/ui/input.tsx'
import { Label } from '~/components/ui/label.tsx'
import { Textarea } from '~/components/ui/textarea.tsx'

export type ListOfErrors = Array<string | null | undefined> | null | undefined

export function ErrorList({
	id,
	errors,
}: {
	errors?: ListOfErrors
	id?: string
}) {
	const errorsToRender = errors?.filter(Boolean)
	if (!errorsToRender?.length) return null
	return (
		<ul id={id} className="flex flex-col gap-1">
			{errorsToRender.map(e => (
				<li key={e} className="text-[10px] text-foreground-danger">
					{e}
				</li>
			))}
		</ul>
	)
}

export function Field({
	labelProps,
	inputProps,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	inputProps: React.InputHTMLAttributes<HTMLInputElement>
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = inputProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={className}>
			<Label htmlFor={id} {...labelProps} />
			<Input
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...inputProps}
			/>
			<div className="min-h-[32px] px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function TextareaField({
	labelProps,
	textareaProps,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	textareaProps: React.InputHTMLAttributes<HTMLTextAreaElement>
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = textareaProps.id ?? textareaProps.name ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={className}>
			<Label htmlFor={id} {...labelProps} />
			<Textarea
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...textareaProps}
			/>
			<div className="min-h-[32px] px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}
