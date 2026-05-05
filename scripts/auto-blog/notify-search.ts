/**
 * Notify search engines after a new blog post is merged to main.
 *
 * Triggered by .github/workflows/notify-search.yml whenever
 * shared/blog-posts.ts changes on main.
 *
 * What it does:
 *   1. Detects the newest post (last entry in the array)
 *   2. Pings IndexNow with the new URL — Bing & Yandex pick this up in hours
 *   3. Resubmits the sitemap to Google Search Console (if creds are present),
 *      otherwise it just refetches /sitemap.xml from the live site to nudge
 *      Google's crawler
 *
 * Environment variables (all optional except ANTHROPIC_API_KEY is NOT needed):
 *   INDEXNOW_KEY            - the IndexNow API key (also placed in repo at
 *                             /public/<key>.txt for verification). If unset,
 *                             IndexNow ping is skipped with a warning.
 *   GOOGLE_SC_CLIENT_EMAIL  - service account email for GSC API
 *   GOOGLE_SC_PRIVATE_KEY   - service account private key
 *
 * Note on Google indexing: there is NO official API to force-index a generic
 * blog post. The sitemap resubmit + internal linking is the most you can do.
 * Google decides when to crawl based on its own scheduling.
 */

import { pathToFileURL } from "node:url";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const POSTS_FILE = path.join(REPO_ROOT, "shared", "blog-posts.ts");

const SITE_HOST = "nearbytraveler.org";
const SITE_ORIGIN = `https://${SITE_HOST}`;
const SITEMAP_URL = `${SITE_ORIGIN}/sitemap.xml`;

interface BlogPost {
  title: string;
  date: string;
  slug: string;
  description: string;
  body: string;
}

// -----------------------------------------------------------------------------
// IndexNow — Bing/Yandex
// -----------------------------------------------------------------------------

async function pingIndexNow(urls: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    console.warn("⚠ INDEXNOW_KEY not set — skipping IndexNow ping.");
    console.warn("  To enable: generate a 32-char key, add it to repo secrets,");
    console.warn(`  and serve it at ${SITE_ORIGIN}/${key}.txt`);
    return;
  }

  const body = {
    host: SITE_HOST,
    key,
    keyLocation: `${SITE_ORIGIN}/${key}.txt`,
    urlList: urls,
  };

  // api.indexnow.org is the canonical endpoint; Bing and Yandex both honor it
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });

  if (res.status === 200 || res.status === 202) {
    console.log(`✓ IndexNow accepted ${urls.length} URL(s).`);
  } else {
    const text = await res.text().catch(() => "");
    console.error(`✗ IndexNow returned ${res.status}: ${text}`);
  }
}

// -----------------------------------------------------------------------------
// Google Search Console — sitemap resubmit
// -----------------------------------------------------------------------------

async function resubmitSitemap(): Promise<void> {
  const clientEmail = process.env.GOOGLE_SC_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SC_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    console.warn(
      "⚠ Google Search Console creds not set — falling back to crawler nudge.",
    );
    // Fallback: just fetch the sitemap ourselves. This doesn't trigger
    // indexing, but it does ensure the file is fresh in any caches.
    try {
      const res = await fetch(SITEMAP_URL);
      console.log(`  Fetched ${SITEMAP_URL} (${res.status})`);
    } catch (err) {
      console.error(`  Failed to fetch sitemap:`, err);
    }
    return;
  }

  // Build a JWT for service account auth, exchange for an access token,
  // then PUT the sitemap URL to GSC. We do this without the googleapis SDK
  // to keep dependencies minimal.
  const accessToken = await getGoogleAccessToken(clientEmail, privateKey);
  const propertyUrl = `https://${SITE_HOST}/`;
  const apiUrl =
    `https://searchconsole.googleapis.com/webmasters/v3/sites/` +
    `${encodeURIComponent(propertyUrl)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`;

  const res = await fetch(apiUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.ok) {
    console.log(`✓ Sitemap resubmitted to Google Search Console.`);
  } else {
    const text = await res.text().catch(() => "");
    console.error(`✗ GSC sitemap submit returned ${res.status}: ${text}`);
  }
}

async function getGoogleAccessToken(
  clientEmail: string,
  privateKey: string,
): Promise<string> {
  const crypto = await import("node:crypto");
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/webmasters",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const b64url = (input: Buffer | string) =>
    Buffer.from(input)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const headerB64 = b64url(JSON.stringify(header));
  const claimsB64 = b64url(JSON.stringify(claims));
  const signingInput = `${headerB64}.${claimsB64}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  const signature = b64url(signer.sign(privateKey));
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google token exchange failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// -----------------------------------------------------------------------------
// Entry point
// -----------------------------------------------------------------------------

async function main() {
  const moduleUrl = pathToFileURL(POSTS_FILE).href;
  const mod = (await import(moduleUrl)) as { blogPosts: BlogPost[] };
  const posts = mod.blogPosts;

  if (!posts.length) {
    console.log("No posts found. Nothing to notify.");
    return;
  }

  // Newest post by date
  const newest = [...posts].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const newestUrl = `${SITE_ORIGIN}/blog/${newest.slug}`;
  console.log(`Newest post: ${newest.title}`);
  console.log(`URL: ${newestUrl}`);

  // Ping both in parallel — failure of one shouldn't block the other
  const results = await Promise.allSettled([
    pingIndexNow([newestUrl, SITE_ORIGIN]),
    resubmitSitemap(),
  ]);

  for (const r of results) {
    if (r.status === "rejected") {
      console.error("Notification failed:", r.reason);
    }
  }
}

main().catch((err) => {
  console.error("FAILED:", err);
  // Don't exit non-zero — search-engine notification is best-effort.
  // A failure here shouldn't block the merge or future workflows.
  process.exit(0);
});
