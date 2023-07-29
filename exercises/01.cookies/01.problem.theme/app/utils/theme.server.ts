// 🐨 you're going to need the cookie module here:
// 💰 import * as cookie from 'cookie'

export type Theme = 'light' | 'dark'

// 🦉 The default for us will be 'light', so if we can't determine the theme,
// then you'll want to return 'light'

export function getTheme(request: Request): Theme {
	// 🐨 get the cookie header from the request
	// 🐨 if the cookie header is `null`, return the default
	// 🐨 parse the cookie header
	// 🐨 get the value for the cookie called 'theme'
	// 🐨 if the value is a valid cookie value, return it, otherwise return the default
	return 'light'
}

export function setTheme(theme: Theme) {
	// 🐨 serialize the theme as a cookie called 'theme'
	// 💰 make sure to set the path to '/' so it applies to the entire site.
	return ''
}
