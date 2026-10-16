import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const tma = process.env.AXIOMEET_TMA === '1';
const base = 'http://127.0.0.1:4173';
const meetingPath = (id) => tma ? '/tma/meeting/' + id : '/meetings/' + id;
const server = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173'], { stdio: 'ignore' });
let browser;
try {
  for (let attempt = 0; ; attempt++) {
    try { await fetch(base); break; } catch {
      if (attempt >= 100) throw new Error('Vite did not start');
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  browser = await chromium.launch();
  for (const returnToA of [false, true]) {
    const page = await browser.newPage();
    let releaseSave;
    let saveStarted;
    const started = new Promise((resolve) => { saveStarted = resolve; });
    const pending = new Promise((resolve) => { releaseSave = resolve; });
    const user = { id: 1, role: 'admin', organization_id: 7, display_name: 'Test', name: 'Test', email: 'test@example.invalid' };
    await page.addInitScript((user) => {
      localStorage.setItem('axiomeet_token', 'test');
      localStorage.setItem('axiomeet_user', JSON.stringify(user));
    }, user);
    await page.route('**/api/**', async (route) => {
      const url = new URL(route.request().url());
      const match = url.pathname.match(/\/client\/meetings\/([AB])$/);
      let body = {};
      if (url.pathname.endsWith('/auth/me')) body = { user };
      else if (url.pathname.endsWith('/auth/refresh')) body = { tokens: { access_token: 'test', refresh_token: 'test' } };
      else if (url.pathname.endsWith('/A/protocol') && route.request().method() === 'PATCH') {
        saveStarted();
        await pending;
        body = { protocol_md: 'Late saved A', protocol_generated_at: '2037-01-01T00:00:00Z', drive_synced: true };
      } else if (match) {
        body = { uuid: match[1], topic: 'Meeting ' + match[1], state: 'PUBLISHED',
          protocol_md: 'Protocol ' + match[1], protocol_generated_at: '2026-01-01T00:00:00Z',
          protocol_template: 'standard', participants: [], tasks: [], files: [], processing: {} };
      } else if (url.pathname.includes('protocol-templates')) body = { templates: [{ id: 'standard', name: 'Standard' }] };
      else if (url.pathname.endsWith('/share-links')) body = { links: [] };
      else if (url.pathname.endsWith('/versions')) body = { versions: [] };
      else if (url.pathname.endsWith('/transcript')) body = { segments: [], revision: 0 };
      else if (url.pathname.endsWith('/connections')) body = { connections: [] };
      else if (url.pathname.endsWith('/summary')) body = { total_steps: 1, completed_steps: 1 };
      await route.fulfill({ json: body });
    });
    await page.goto(base + meetingPath('A'));
    await page.getByRole('heading', { name: 'Meeting A', exact: true }).waitFor();
    if (tma) {
      await page.getByRole('button', { name: /Редактировать/ }).click();
      await page.locator('[contenteditable=true]').waitFor();
    }
    await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
    await started;
    const navigate = async (id) => {
      await page.evaluate((path) => {
        history.pushState({}, '', path);
        dispatchEvent(new PopStateEvent('popstate'));
      }, meetingPath(id));
      await page.getByRole('heading', { name: 'Meeting ' + id, exact: true }).waitFor();
    };
    await navigate('B');
    if (returnToA) await navigate('A');
    const response = page.waitForResponse((res) => res.url().endsWith('/A/protocol') && res.request().method() === 'PATCH');
    releaseSave();
    await response;
    // Flush the response handler and React's state update.
    await page.waitForTimeout(100);
    const expected = returnToA ? 'A' : 'B';
    assert.equal(await page.locator('h1').last().textContent(), 'Meeting ' + expected);
    const text = await page.locator('body').innerText();
    assert.ok(!text.includes('Late saved A'), 'late save changed the active protocol');
    assert.ok(!text.includes('2037'), 'late save changed active meeting metadata');
    assert.equal(await page.locator('[contenteditable=true]').count(), 0, 'editor leaked across navigation');
    await page.close();
  }
  console.log('PASS: late save is isolated for A -> B and A -> B -> A');
} finally {
  await browser?.close();
  server.kill();
}
