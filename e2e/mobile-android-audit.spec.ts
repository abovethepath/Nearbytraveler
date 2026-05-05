import { test, chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Self-contained Android Chrome mobile audit.
// Run with: npx playwright test e2e/mobile-android-audit.spec.ts --project=chromium
//
// Output dir is controlled by AUDIT_OUT (default ./audit-output).
// Screenshots: audit-output/<viewport>/<route>-{top,full,bottom,menu}.png
// Report:      audit-output/report.json

const VIEWPORTS = [
  { name: 'pixel7', width: 412, height: 915 },
  { name: 'pixel5', width: 393, height: 851 },
  { name: 'w360x800', width: 360, height: 800 },
  { name: 'w390x844', width: 390, height: 844 },
  { name: 'w412x915', width: 412, height: 915 },
];

const ROUTES = [
  { name: 'landing', path: '/' },
  { name: 'auth', path: '/auth' },
  { name: 'signin', path: '/signin' },
  { name: 'join', path: '/join' },
  { name: 'signup-account', path: '/signup/account' },
  { name: 'about', path: '/about' },
  { name: 'privacy', path: '/privacy' },
  { name: 'blog', path: '/blog' },
];

const BASE = process.env.AUDIT_BASE_URL || 'https://nearbytraveler.org';
const OUT_DIR = process.env.AUDIT_OUT
  ? path.resolve(process.env.AUDIT_OUT)
  : path.resolve(process.cwd(), 'audit-output');

test('android-mobile-audit', async () => {
  test.setTimeout(30 * 60_000);
  const browser = await chromium.launch();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const report: any = {
    startedAt: new Date().toISOString(),
    base: BASE,
    viewports: {} as Record<string, any>,
  };

  for (const vp of VIEWPORTS) {
    const vpDir = path.join(OUT_DIR, vp.name);
    fs.mkdirSync(vpDir, { recursive: true });
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
      userAgent:
        'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
    });
    const page = await ctx.newPage();
    report.viewports[vp.name] = { dim: vp, routes: {} as Record<string, any> };

    for (const r of ROUTES) {
      const url = `${BASE}${r.path}`;
      const entry: any = { url };
      try {
        const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        entry.status = resp?.status() ?? null;
        entry.finalUrl = page.url();
        await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {});
        await page.waitForTimeout(400);

        // Screenshots: top viewport
        await page
          .screenshot({ path: path.join(vpDir, `${r.name}-top.png`), fullPage: false })
          .catch(() => {});

        // Detection (top of page)
        entry.findingsTop = await page.evaluate(detectFn);

        // Force-reveal scroll-gated sections so the fullPage capture isn't blank.
        // The site uses .animate-on-scroll { opacity:0 } until an IntersectionObserver
        // fires; that observer doesn't reliably trigger during Playwright's fullPage
        // expansion. We slow-scroll the page first to give it a chance, then inject
        // a fallback stylesheet that forces visibility.
        await page.evaluate(async () => {
          const step = 600;
          const total = document.documentElement.scrollHeight;
          for (let y = 0; y < total; y += step) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 80));
          }
          window.scrollTo(0, 0);
          const s = document.createElement('style');
          s.textContent =
            '.animate-on-scroll{opacity:1 !important;animation:none !important;transform:none !important;}';
          document.head.appendChild(s);
        });
        await page.waitForTimeout(400);

        // Full-page screenshot BEFORE any menu interaction
        await page
          .screenshot({ path: path.join(vpDir, `${r.name}-full.png`), fullPage: true })
          .catch(() => {});

        // Scroll to bottom and re-check
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(700);
        await page
          .screenshot({ path: path.join(vpDir, `${r.name}-bottom.png`), fullPage: false })
          .catch(() => {});
        entry.findingsBottom = await page.evaluate(detectFn);

        // Scroll back to top before menu interaction
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(300);

        // Try opening hamburger / mobile menu — landing route only
        if (r.name === 'landing') {
          const burger = page
            .locator(
              [
                'button[aria-label*="menu" i]',
                'button[aria-label*="navigation" i]',
                '[data-testid*="hamburger" i]',
                '[data-testid*="menu" i]',
                'button:has(svg[class*="menu" i])',
                'button:has(svg[class*="hamburger" i])',
                'header button:has(svg)',
              ].join(', ')
            )
            .first();
          if (await burger.isVisible().catch(() => false)) {
            await burger.click({ trial: false }).catch(() => {});
            await page.waitForTimeout(500);
            await page
              .screenshot({ path: path.join(vpDir, `${r.name}-menu.png`), fullPage: false })
              .catch(() => {});
            entry.findingsMenuOpen = await page.evaluate(detectFn);
          }
        }

        // Try to surface modal triggers (auth/join only — Sign Up / Login buttons)
        if (r.name === 'auth' || r.name === 'join') {
          const triggers = ['Sign Up', 'Sign In', 'Log In', 'Login', 'Get Started', 'Create Account'];
          for (const t of triggers) {
            const btn = page.getByRole('button', { name: new RegExp(t, 'i') }).first();
            if (await btn.isVisible().catch(() => false)) {
              await btn.click().catch(() => {});
              await page.waitForTimeout(500);
              entry.findingsAfterClick = await page.evaluate(detectFn);
              await page
                .screenshot({
                  path: path.join(vpDir, `${r.name}-after-${t.replace(/\s+/g, '_')}.png`),
                  fullPage: false,
                })
                .catch(() => {});
              break;
            }
          }
        }
      } catch (e: any) {
        entry.error = e?.message || String(e);
      }
      report.viewports[vp.name].routes[r.name] = entry;
    }

    await ctx.close();
  }

  await browser.close();

  // Summary aggregation
  const summary: any = { overflowingPages: [], topOffenders: {} as Record<string, number> };
  for (const [vpName, vpData] of Object.entries<any>(report.viewports)) {
    for (const [rName, rData] of Object.entries<any>(vpData.routes)) {
      const overflowSlots = ['findingsTop', 'findingsMenuOpen', 'findingsBottom', 'findingsAfterClick'];
      for (const slot of overflowSlots) {
        const f = rData[slot];
        if (f && f.overflow) {
          summary.overflowingPages.push({
            viewport: vpName,
            route: rName,
            slot,
            docW: f.docW,
            docCW: f.docCW,
            wideElementsCount: f.wideElementsCount,
          });
          for (const w of f.wideTop || []) {
            summary.topOffenders[w.sel] = (summary.topOffenders[w.sel] || 0) + 1;
          }
        }
      }
    }
  }
  report.summary = summary;

  fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`Audit complete. Output: ${OUT_DIR}`);
  console.log(`Overflowing page-views: ${summary.overflowingPages.length}`);
});

// --- Detection function (runs in browser) ---
function detectFn() {
  const vw = window.innerWidth;
  const docW = document.documentElement.scrollWidth;
  const docCW = document.documentElement.clientWidth;
  const overflow = docW > docCW + 1;

  function shortSel(el: Element): string {
    const tag = el.tagName?.toLowerCase() || '?';
    const id = (el as HTMLElement).id ? `#${(el as HTMLElement).id}` : '';
    const cn = (el as HTMLElement).className;
    const cls =
      typeof cn === 'string'
        ? cn
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 4)
            .map((c) => `.${c}`)
            .join('')
        : '';
    return `${tag}${id}${cls}`.slice(0, 200);
  }

  const seen = new Set<string>();
  const wides: Array<{ sel: string; w: number; left: number; right: number; reason: string }> = [];
  const all = document.querySelectorAll<HTMLElement>('*');
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    let reason = '';
    if (r.width > vw + 1) reason = 'width>vw';
    else if (r.right > vw + 1) reason = 'right>vw';
    else if (r.left < -1) reason = 'left<0';
    if (!reason) continue;
    const sel = shortSel(el);
    if (seen.has(sel)) continue;
    seen.add(sel);
    wides.push({
      sel,
      w: Math.round(r.width),
      left: Math.round(r.left),
      right: Math.round(r.right),
      reason,
    });
    if (wides.length >= 60) break;
  }

  // 100vw signal: scan inline + computed style for vw units (computed will be in px,
  // so we look at inline styles too for 100vw / 100% + parent overflow signals).
  const hundredVwHints: Array<{ sel: string; styleAttr: string }> = [];
  document.querySelectorAll<HTMLElement>('[style*="vw"]').forEach((el) => {
    if (hundredVwHints.length >= 15) return;
    const sa = el.getAttribute('style') || '';
    if (/(100vw|99vw|98vw)/i.test(sa)) {
      hundredVwHints.push({ sel: shortSel(el), styleAttr: sa.slice(0, 150) });
    }
  });

  return {
    vw,
    docW,
    docCW,
    overflow,
    wideElementsCount: wides.length,
    wideTop: wides.slice(0, 30),
    hundredVwHints,
  };
}
