import { useFormAction, useNavigation } from '@remix-run/react'
import { clsx, type ClassValue } from 'clsx'
import { useEffect, useMemo, useRef } from 'react'
import { useSpinDelay } from 'spin-delay'
import { twMerge } from 'tailwind-merge'
import userFallback from '~/assets/user.png'

export function getUserImgSrc(imageId?: string | null) {
	return imageId ? `/resources/images/${imageId}` : userFallback
}

export function getErrorMessage(error: unknown) {
	if (typeof error === 'string') return error
	if (
		error &&
		typeof error === 'object' &&
		'message' in error &&
		typeof error.message === 'string'
	) {
		return error.message
	}
	console.error('Unable to get error message for error', error)
	return 'Unknown Error'
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

/**
 * Provide a condition and if that condition is falsey, this throws an error
 * with the given message.
 *
 * inspired by invariant from 'tiny-invariant' except will still include the
 * message in production.
 *
 * @example
 * invariant(typeof value === 'string', `value must be a string`)
 *
 * @param condition The condition to check
 * @param message The message to throw (or a callback to generate the message)
 * @param responseInit Additional response init options if a response is thrown
 *
 * @throws {Error} if condition is falsey
 */
export function invariant(
	condition: any,
	message: string | (() => string),
): asserts condition {
	if (!condition) {
		throw new Error(typeof message === 'function' ? message() : message)
	}
}

/**
 * Provide a condition and if that condition is falsey, this throws a 400
 * Response with the given message.
 *
 * inspired by invariant from 'tiny-invariant'
 *
 * @example
 * invariantResponse(typeof value === 'string', `value must be a string`)
 *
 * @param condition The condition to check
 * @param message The message to throw (or a callback to generate the message)
 * @param responseInit Additional response init options if a response is thrown
 *
 * @throws {Response} if condition is falsey
 */
export function invariantResponse(
	condition: any,
	message: string | (() => string),
	responseInit?: ResponseInit,
): asserts condition {
	if (!condition) {
		throw new Response(typeof message === 'function' ? message() : message, {
			status: 400,
			...responseInit,
		})
	}
}

/**
 * Returns true if the current navigation is submitting the current route's
 * form. Defaults to the current route's form action and method POST.
 *
 * If GET, then this uses navigation.state === 'loading' instead of submitting.
 *
 * NOTE: the default formAction will include query params, but the
 * navigation.formAction will not, so don't use the default formAction if you
 * want to know if a form is submitting without specific query params.
 */
export function useIsSubmitting({
	formAction,
	formMethod = 'POST',
}: {
	formAction?: string
	formMethod?: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE'
} = {}) {
	const contextualFormAction = useFormAction()
	const navigation = useNavigation()
	return (
		navigation.state === (formMethod === 'GET' ? 'loading' : 'submitting') &&
		navigation.formAction === (formAction ?? contextualFormAction) &&
		navigation.formMethod === formMethod
	)
}

/**
 * This combines useSpinDelay (from https://npm.im/spin-delay) and useIsSubmitting
 * from our own utilities to give you a nice way to show a loading spinner for
 * a minimum amount of time, even if the request finishes right after the delay.
 *
 * This avoids a flash of loading state regardless of how fast or slow the
 * request is.
 */
export function useDelayedIsSubmitting({
	formAction,
	formMethod,
	delay = 400,
	minDuration = 300,
}: Parameters<typeof useIsSubmitting>[0] &
	Parameters<typeof useSpinDelay>[1] = {}) {
	const isSubmitting = useIsSubmitting({ formAction, formMethod })
	const delayedIsSubmitting = useSpinDelay(isSubmitting, {
		delay,
		minDuration,
	})
	return delayedIsSubmitting
}

/**
 * Simple debounce implementation
 */
function debounce<Callback extends (...args: Parameters<Callback>) => void>(
	fn: Callback,
	delay: number,
) {
	let timer: ReturnType<typeof setTimeout> | null = null
	return (...args: Parameters<Callback>) => {
		if (timer) clearTimeout(timer)
		timer = setTimeout(() => {
			fn(...args)
		}, delay)
	}
}

/**
 * Debounce a callback function
 */
export function useDebounce<
	Callback extends (...args: Parameters<Callback>) => ReturnType<Callback>,
>(callback: Callback, delay: number) {
	const callbackRef = useRef(callback)
	useEffect(() => {
		callbackRef.current = callback
	})
	return useMemo(
		() =>
			debounce(
				(...args: Parameters<Callback>) => callbackRef.current(...args),
				delay,
			),
		[delay],
	)
}
