// 💰 bring in useRouteLoaderData from '@remix-run/react'

// 🦺 you can make this type safe by importing the root loader type like this:
// import { type loader as rootLoader } from '#app/root.tsx'

// 🐨 create a useOptionalUser function which get's the root loader data and
// returns the user if it exists, otherwise return null.

// 🐨 create a useUser function which callse useOptionalUser and if the user
// does not exist, throws an error with a informative error message. Otherwise
// return the user
