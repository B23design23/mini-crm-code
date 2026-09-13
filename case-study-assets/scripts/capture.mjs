// Génère les visuels du case study (screenshots PNG + vidéos WebM) avec Playwright,
// à partir de l'app tournant en local sur Vite.
//
// Prérequis : avoir lancé `node case-study-assets/scripts/seed.mjs` au moins une fois.
// Usage : node case-study-assets/scripts/capture.mjs
//
// Le script démarre `npm run dev` automatiquement s'il ne tourne pas déjà sur
// http://localhost:5173, et l'arrête à la fin s'il l'a démarré lui-même.

import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { BASE_URL, DEMO_EMAIL, DEMO_PASSWORD, projectRoot, outDir } from './config.mjs'

const DESKTOP = { name: 'desktop', viewport: { width: 1440, height: 900 } }
const MOBILE = { name: 'mobile', viewport: { width: 390, height: 844 } }

async function isServerUp() {
  try {
    const res = await fetch(BASE_URL, { signal: AbortSignal.timeout(1500) })
    return res.ok
  } catch {
    return false
  }
}

async function ensureDevServer() {
  if (await isServerUp()) {
    console.log(`Serveur déjà disponible sur ${BASE_URL}.`)
    return null
  }

  console.log('Démarrage de `npm run dev`...')
  const child = spawn('npm', ['run', 'dev', '--', '--port', '5173', '--strictPort'], {
    cwd: projectRoot,
    detached: true,
    stdio: 'ignore',
  })

  const start = Date.now()
  while (Date.now() - start < 30000) {
    if (await isServerUp()) {
      console.log('Serveur prêt.')
      return child
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Le serveur dev n'a pas démarré à temps sur ${BASE_URL}.`)
}

function stopDevServer(child) {
  if (!child) return
  try {
    process.kill(-child.pid)
  } catch {
    try {
      child.kill()
    } catch {}
  }
}

async function login(page) {
  await page.goto(BASE_URL)
  await page.waitForSelector('#email')
  await page.fill('#email', DEMO_EMAIL)
  await page.fill('#password', DEMO_PASSWORD)
  await page.click('button:has-text("Se connecter")')
  await page.waitForSelector('text=CA encaissé (Payé)', { timeout: 15000 })
}

async function captureScreenshots(browser) {
  for (const device of [DESKTOP, MOBILE]) {
    console.log(`\n--- Screenshots ${device.name} ---`)
    const context = await browser.newContext({ viewport: device.viewport })
    const page = await context.newPage()

    // Login
    await page.goto(BASE_URL)
    await page.waitForSelector('#email')
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(outDir, `login-${device.name}.png`), fullPage: true })
    console.log(`✓ login-${device.name}.png`)

    // Dashboard
    await page.fill('#email', DEMO_EMAIL)
    await page.fill('#password', DEMO_PASSWORD)
    await page.click('button:has-text("Se connecter")')
    await page.waitForSelector('text=CA encaissé (Payé)', { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(outDir, `dashboard-${device.name}.png`), fullPage: true })
    console.log(`✓ dashboard-${device.name}.png`)

    // Clients (liste)
    await page.locator('button:has-text("Clients"):visible').first().click()
    await page.waitForSelector('text=Techno Solutions SARL')
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(outDir, `clients-${device.name}.png`), fullPage: true })
    console.log(`✓ clients-${device.name}.png`)

    // Fiche client (détail avec historique de commandes)
    await page.locator('.cursor-pointer:has-text("Techno Solutions SARL"):visible').first().click()
    await page.waitForSelector('text=Historique des commandes')
    await page.waitForTimeout(300)
    await page.screenshot({ path: path.join(outDir, `client-detail-${device.name}.png`), fullPage: true })
    console.log(`✓ client-detail-${device.name}.png`)

    await context.close()
  }
}

async function renameLatestVideo(page, destName) {
  const videoPath = await page.video().path()
  const dest = path.join(outDir, destName)
  fs.renameSync(videoPath, dest)
  console.log(`✓ ${destName}`)
}

async function captureSidebarAnimation(browser) {
  console.log('\n--- Vidéo : animation du menu latéral ---')
  const context = await browser.newContext({
    viewport: DESKTOP.viewport,
    recordVideo: { dir: outDir, size: DESKTOP.viewport },
  })
  const page = await context.newPage()
  await login(page)
  await page.waitForTimeout(500)

  const toggleButton = page.locator('aside button[aria-label*="sidebar"]')
  await toggleButton.click() // fermeture
  await page.waitForTimeout(700)
  await toggleButton.click() // ouverture
  await page.waitForTimeout(700)

  await context.close()
  await renameLatestVideo(page, 'sidebar-animation.webm')
}

async function captureRelanceAction(browser) {
  console.log('\n--- Vidéo : envoi de la relance depuis le Dashboard ---')
  const context = await browser.newContext({
    viewport: DESKTOP.viewport,
    recordVideo: { dir: outDir, size: DESKTOP.viewport },
  })
  const page = await context.newPage()

  // On intercepte l'appel au webhook Make pour ne pas déclencher une vraie
  // automatisation (email/SMS réel) pendant cette capture de démo.
  await page.route('**hook.eu1.make.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
  )
  page.on('dialog', (dialog) => dialog.accept())

  await login(page)
  await page.waitForSelector('text=Factures à relancer')
  await page.waitForTimeout(500)

  await page.locator('button:has-text("Envoyer la relance"):visible').first().click()
  await page.waitForTimeout(1200)

  await context.close()
  await renameLatestVideo(page, 'relance-dashboard.webm')
}

async function captureClientDrawer(browser) {
  console.log('\n--- Vidéo : panneau latéral de création client ---')
  const context = await browser.newContext({
    viewport: DESKTOP.viewport,
    recordVideo: { dir: outDir, size: DESKTOP.viewport },
  })
  const page = await context.newPage()
  await login(page)

  await page.locator('button:has-text("Clients"):visible').first().click()
  await page.waitForSelector('text=Techno Solutions SARL')
  await page.waitForTimeout(400)

  await page.click('button:has-text("Ajouter un client")')
  await page.waitForTimeout(700)
  await page.click('button[aria-label="Fermer"]')
  await page.waitForTimeout(700)

  await context.close()
  await renameLatestVideo(page, 'client-drawer.webm')
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true })
  const devServer = await ensureDevServer()
  const browser = await chromium.launch()

  try {
    await captureScreenshots(browser)
    await captureSidebarAnimation(browser)
    await captureRelanceAction(browser)
    await captureClientDrawer(browser)
  } finally {
    await browser.close()
    stopDevServer(devServer)
  }

  console.log(`\nTerminé. Fichiers générés dans ${outDir}`)
}

main().catch((err) => {
  console.error('\n❌', err)
  process.exit(1)
})
