import { expect, test } from '@playwright/test'

test('renders the home page integration shell', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', {
      name: /Auth routes, protected pages, and AI endpoints are now reachable/i,
    })
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()
})

test('redirects protected pages to sign-in when unauthenticated', async ({ page }) => {
  await page.goto('/dashboard')

  await expect(page).toHaveURL(/\/auth\/sign-in/)
  await expect(page.getByRole('heading', { name: /Sign in to continue/i })).toBeVisible()
})
