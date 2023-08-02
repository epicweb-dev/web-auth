import { $ } from 'execa'

try {
	console.log(`🏗  generating prisma client in playground`)
	await $({ all: true })`prisma generate`
	console.log('✅ prisma client generated')
} catch (prismaGenerateResult) {
	console.log(prismaGenerateResult.all)
	throw new Error(`❌  prisma generate failed when setting playground`)
}
