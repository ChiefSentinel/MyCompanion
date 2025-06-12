import {
  _electron as electron,
  BrowserContext,
  ElectronApplication,
  expect,
  Page,
  test as base,
} from '@playwright/test'
import {
  ElectronAppInfo,
  findLatestBuild,
  parseElectronApp,
  stubDialog,
} from 'electron-playwright-helpers'
import { Constants } from './constants'
import { HubPage } from '../pages/hubPage'
import { CommonActions } from '../pages/commonActions'
import { rmSync } from 'fs'
import * as path from 'path'

export let electronApp: ElectronApplication
export let page: Page
export let appInfo: ElectronAppInfo
export const TIMEOUT = parseInt(process.env.TEST_TIMEOUT || Constants.TIMEOUT, 10)

/* ───────── Setup / Teardown helpers ────────────────────────────────────── */

export async function setupElectron() {
  console.log(`TEST TIMEOUT: ${TIMEOUT}`)
  process.env.CI = 'e2e'

  const latestBuild = findLatestBuild('dist')
  expect(latestBuild).toBeTruthy()

  appInfo = parseElectronApp(latestBuild)
  expect(appInfo).toBeTruthy()

  electronApp = await electron.launch({
    args: [appInfo.main, '--no-sandbox'],
    executablePath: appInfo.executable,
  })

  await stubDialog(electronApp, 'showMessageBox', { response: 1 })
  page = await electronApp.firstWindow({ timeout: TIMEOUT })
}

export async function teardownElectron() {
  await page.close()
  await electronApp.close()
}

/* ───────── Playwright fixture extension ────────────────────────────────── */

export const test = base.extend<
  {
    commonActions: CommonActions
    hubPage: HubPage
    attachVideoPage: Page
    attachScreenshotsToReport: void
  },
  { createVideoContext: BrowserContext }
>({
  commonActions: async ({ request }, use, testInfo) => {
    await use(new CommonActions(page, testInfo))
  },

  hubPage: async ({ commonActions }, use) => {
    await use(new HubPage(page, commonActions))
  },

  createVideoContext: [
    async ({ playwright }, use) => {
      const context = electronApp.context()
      await use(context)
    },
    { scope: 'worker' },
  ],

  attachVideoPage: [
    async ({ createVideoContext }, use, testInfo) => {
      await use(page)

      if (testInfo.status !== testInfo.expectedStatus) {
        const videoPath = await createVideoContext.pages()[0].video()?.path()
        await createVideoContext.close()
        if (videoPath) {
          await testInfo.attach('video', { path: videoPath })
        }
      }
    },
    { scope: 'test', auto: true },
  ],

  attachScreenshotsToReport: [
    async ({ commonActions }, use, testInfo) => {
      await use()
      if (testInfo.status !== testInfo.expectedStatus) {
        await commonActions.takeScreenshot('')
      }
    },
    { auto: true },
  ],
})

/* ───────── Global hooks ───────────────────────────────────────────────── */

test.beforeAll(async () => {
  rmSync(path.join(__dirname, '../../test-data'), { recursive: true, force: true });

  test.setTimeout(TIMEOUT);
  await setupElectron();

  // Wait until the first renderer has finished parsing the document.
  await page.waitForLoadState('domcontentloaded', { timeout: TIMEOUT });
});


test.afterAll(async () => {
  // If you want to fully close Electron at the end of the suite, uncomment:
  // await teardownElectron()
})

