import { test, chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// "After" audit: hits the LIVE site but injects the fix logic via Playwright so
// we can validate post-deploy behavior visually without waiting for Render.
// The fix: hide the floating "Get Started" CTA when the <footer> enters view.

const VIEWPORTS = [
  { name: 'pixel7', width: 412, height: 915 },
  { name: 'pixel5', width: 393, height: 851 },
  { name: 'w360x800', width: 360, height: 800 },
  { name: 'w390x844', width: 390, height: 844 },
  { name: 'w412x915', width: 412, height: 915 },
];

const BASE = process.env.AUDIT_BASE_URL || 'https://nearbytraveler.org';
const OUT_DIR = path.resolve(process.cwd(), 'audit-output-after');

const FIX_INIT_SCRIPT = `
(function () {
  function tryAttach() {
    const cta = document.querySelector('[data-testid="button-floating-get-started"]');
    const floatingWrap = cta ? (cta.closest('.fixed') || cta.parentElement) : null;
    const footer = document.querySelector('footer');
    if (!floatingWrap || !footer) {
      return false;
    }
    const observer = new IntersectionObserver(function (entries) {
      const entry = entries[0];
      if (entry.isIntersecting) {
        floatingWrap.style.opacity = '0';
        floatingWrap.style.pointerEvents = 'none';
      }
    }, { threshold: 0 });
    observer.observe(footer);
    return true;
  }
  if (!tryAttach()) {
    const interval = setInterval(function () {
      if (tryAttach()) clearInterval(interval);
    }, 200);
    setTimeout(function () { clearInterval(interval); }, 10000);
  }
})();
`;

test('android-mobile-audit-after', async () => {
  test.setTimeout(15 * 60_000);
  const browser = await chromium.launch();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const summary: any = { startedAt: new Date().toISOString(), captures: [] };

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
    await ctx.addInitScript(FIX_INIT_SCRIPT);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {});
    await page.waitForTimeout(800);

    // Force reveal animated sections
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

    await page
      .screenshot({ path: path.join(vpDir, 'landing-full.png'), fullPage: true })
      .catch(() => {});

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(900);
    await page
      .screenshot({ path: path.join(vpDir, 'landing-bottom.png'), fullPage: false })
      .catch(() => {});

    const ctaVisible = await page.evaluate(() => {
      const cta = document.querySelector('[data-testid="button-floating-get-started"]');
      if (!cta) return null;
      const wrap = (cta as HTMLElement).closest('.fixed') as HTMLElement | null;
      if (!wrap) return null;
      const cs = getComputedStyle(wrap);
      return {
        opacity: cs.opacity,
        pointerEvents: cs.pointerEvents,
        display: cs.display,
      };
    });
    summary.captures.push({ viewport: vp.name, ctaVisibleAtFooter: ctaVisible });

    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log('After-audit complete:', OUT_DIR);
});
