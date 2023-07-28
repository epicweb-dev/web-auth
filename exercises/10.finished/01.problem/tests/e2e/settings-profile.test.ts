import { faker } from '@faker-js/faker'
import { verifyUserPassword } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { createUser } from '../../tests/db-utils.ts'
import { expect, insertNewUser, test } from '../playwright-utils.ts'

test('Users can update their basic info', async ({ login, page }) => {
	const user = await login()
	await page.goto('/settings/profile')

	const newUserData = createUser()

	await page.getByRole('textbox', { name: /^name/i }).fill(newUserData.name)
	await page
		.getByRole('textbox', { name: /^username/i })
		.fill(newUserData.username)
	await page.getByRole('textbox', { name: /^email/i }).fill(newUserData.email)

	await page.getByRole('button', { name: /^save/i }).click()

	await page.waitForLoadState('networkidle')

	const updatedUser = await prisma.user.findUniqueOrThrow({
		where: { id: user.id },
	})
	expect(updatedUser.name).toEqual(newUserData.name)
	expect(updatedUser.username).toEqual(newUserData.username)
	expect(updatedUser.email).toEqual(newUserData.email)
})

test('Users can update their password', async ({ login, page }) => {
	const oldPassword = faker.internet.password()
	const newPassword = faker.internet.password()
	const user = await insertNewUser({ password: oldPassword })
	await login(user)
	await page.goto('/settings/profile')

	await page.getByRole('link', { name: /change password/i }).click()

	await page
		.getByRole('textbox', { name: /^current password/i })
		.fill(oldPassword)
	await page.getByRole('textbox', { name: /^new password/i }).fill(newPassword)
	await page
		.getByRole('textbox', { name: /^confirm new password/i })
		.fill(newPassword)

	await page.getByRole('button', { name: /change password/i }).click()

	await expect(page).toHaveURL(`/settings/profile`)

	const { username } = user
	expect(
		await verifyUserPassword({ username }, oldPassword),
		'Old password still works',
	).toEqual(null)
	expect(
		await verifyUserPassword({ username }, newPassword),
		'New password does not work',
	).toEqual({ id: user.id })
})

test('Users can update their profile photo', async ({ login, page }) => {
	const user = await login()
	await page.goto('/settings/profile')

	const beforeSrc = await page
		.getByRole('img', { name: user.name ?? user.username })
		.getAttribute('src')

	await page.getByRole('link', { name: /change profile photo/i }).click()

	await expect(page).toHaveURL(`/settings/profile/photo`)

	await page
		.getByRole('textbox', { name: /change/i })
		.setInputFiles('./tests/fixtures/images/user/0.jpg')

	await page.getByRole('button', { name: /save/i }).click()

	const afterSrc = await page
		.getByRole('img', { name: user.name ?? user.username })
		.getAttribute('src')

	expect(beforeSrc).not.toEqual(afterSrc)
})
