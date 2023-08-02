import { redirect } from '@remix-run/node'

export async function loader() {
	return redirect('/')
}

export async function action() {
	return redirect('/')
}
