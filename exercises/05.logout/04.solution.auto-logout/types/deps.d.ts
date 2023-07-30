// This module should contain type definitions for modules which do not have
// their own type definitions and are not available on DefinitelyTyped.

declare module 'thirty-two' {
	export function encode(data: string | Buffer): string
	export function decode(data: string): Buffer
}

declare module 'tailwindcss-animate' {
	declare const _default: {
		handler: () => void
	}
	export = _default
}

declare module 'activity-detector' {
	type EventNames = 'idle' | 'active'
	type ActivityState = 'idle' | 'active'
	type UserActivityEvents =
		| 'click'
		| 'mousemove'
		| 'keydown'
		| 'DOMMouseScroll'
		| 'mousewheel'
		| 'mousedown'
		| 'touchstart'
		| 'touchmove'
		| 'focus'
	type InactivityEvents = 'blur'
	type IgnoredEventsWhenIdle = 'mousemove'

	interface ActivityDetectorOptions {
		timeToIdle?: number
		activityEvents?: UserActivityEvents[]
		inactivityEvents?: InactivityEvents[]
		ignoredEventsWhenIdle?: IgnoredEventsWhenIdle[]
		initialState?: ActivityState
		autoInit?: boolean
	}

	interface ActivityDetector {
		start: (initialState?: ActivityState) => void
		on: (event: EventNames, handler: () => void) => void
		stop: () => void
		init: () => void
	}

	function createActivityDetector(
		options?: ActivityDetectorOptions,
	): ActivityDetector

	export = createActivityDetector
}
