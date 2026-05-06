/**
 * Distribution kit generator for Nearby Traveler blog posts.
 *
 * Triggered after a blog post is merged to main. For each newly-added post in
 * the last commit's diff of shared/blog-posts.ts, generates 4 platform-tailored
 * distribution outputs (Medium repost, LinkedIn post, 3 Reddit comments, 2
 * Quora answers) via the Anthropic API and emails them to aaron@nearbytraveler.org
 * via Brevo for copy-paste distribution.
 *
 * Required env vars (live mode):
 *   ANTHROPIC_API_KEY
 *   BREVO_API_KEY
 *
 * Usage:
 *   npx tsx scripts/auto-blog/generate-kit.ts                    # live: send email
 *   npx tsx scripts/auto-blog/generate-kit.ts --dry-run          # print to stdout, no email
 *   npx tsx scripts/auto-blog/generate-kit.ts --dry-run --slug=eating-alone-while-traveling
 *                                                                # bypass diff, target a specific post
 */

import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// -----------------------------------------------------------------------------
// Paths & constants
// -----------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const POSTS_FILE = path.join(REPO_ROOT, "shared", "blog-posts.ts");

// Match the model used by scripts/auto-blog/generate.ts for cost consistency.
const MODEL = "claude-sonnet-4-6";

const RECIPIENT = "aaron@nearbytraveler.org";
const SENDER_EMAIL = "aaron@nearbytraveler.org";
const SENDER_NAME = "Nearby Traveler Auto-Blog";
const SITE_BASE = "https://nearbytraveler.org";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface BlogPost {
  title: string;
  date: string;
  slug: string;
  description: string;
  body: string;
}

interface RedditComment {
  subreddit: "solotravel" | "digitalnomad" | "backpacking";
  thread_topic: string;
  comment_body: string;
}

interface QuoraAnswer {
  question: string;
  answer_body: string;
}

interface DistributionKit {
  medium_repost: string;
  linkedin_post: string;
  reddit_comments: RedditComment[];
  quora_answers: QuoraAnswer[];
}

// -----------------------------------------------------------------------------
// 1. Detect newly merged posts
// -----------------------------------------------------------------------------

/**
 * Parse `git diff HEAD~1 HEAD shared/blog-posts.ts` for added slug lines.
 * Robust to formatting variation in serializePost output (single or double
 * quotes, optional trailing comma).
 */
function detectNewSlugs(): string[] {
  let diff: string;
  try {
    diff = execSync(`git diff HEAD~1 HEAD -- shared/blog-posts.ts`, {
      encoding: "utf8",
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    console.error(
      "Failed to run git diff. Is HEAD~1 reachable? In Actions, ensure checkout uses fetch-depth: 0.",
    );
    throw err;
  }
  const slugs: string[] = [];
  for (const line of diff.split("\n")) {
    // Match `+    slug: "some-slug",` (or single-quoted, with optional trailing comma)
    const m = line.match(/^\+\s+slug:\s*["']([^"']+)["']/);
    if (m) slugs.push(m[1]);
  }
  return slugs;
}

// -----------------------------------------------------------------------------
// 2. Load posts from shared/blog-posts.ts
// -----------------------------------------------------------------------------

async function loadPosts(): Promise<BlogPost[]> {
  // Dynamic import — same pattern as scripts/auto-blog/generate.ts. Avoids
  // fragile regex parsing of the body field, which contains arbitrary markdown.
  const moduleUrl = pathToFileURL(POSTS_FILE).href;
  const mod = (await import(moduleUrl)) as { blogPosts: BlogPost[] };
  if (!Array.isArray(mod.blogPosts)) {
    throw new Error(`Expected blogPosts array in ${POSTS_FILE}`);
  }
  return mod.blogPosts;
}

// -----------------------------------------------------------------------------
// 3. Generate the kit via Anthropic API
// -----------------------------------------------------------------------------

async function generateKit(client: Anthropic, post: BlogPost): Promise<DistributionKit> {
  const blogUrl = `${SITE_BASE}/blog/${post.slug}`;

  const systemPrompt = `You are Aaron, founder of Nearby Traveler (nearbytraveler.org), a free social travel app that connects solo travelers with locals and other travelers in real time. You are based in Los Angeles. From 2010-2014 in NYC, then continuing in LA, you hosted 400+ travelers from 50+ countries on Couchsurfing — that's where the platform's DNA comes from.

You write like a real human, not an AI. You are direct, specific, and honest about tradeoffs. You do NOT write phrases like "delve into", "tapestry of", "navigate the landscape", "in today's world", "in an era where", or "It's worth noting that". You use em-dashes sparingly. You don't end with "In conclusion" or "In summary".

You are repurposing your latest blog post for distribution across Medium, LinkedIn, Reddit, and Quora. The blog post body is provided — that is the source of truth for tone, facts, and angle. Each output should feel like YOU actually wrote it for that platform's specific norms, not a template-filled marketing artifact.

Hard rules:
- Each piece is standalone — readers may not have read the original blog post.
- Mentions of Nearby Traveler must be earned by the context (it actually solves the problem being discussed). Never forced.
- Reddit and Quora are especially sensitive to self-promotion. Value comes first; the link to the original post goes ONLY at the end.
- LinkedIn: NO hashtags. Soft CTA, professional but not corporate.
- Medium: lightly reword the blog post — same ideas, different sentences — so Google doesn't penalize duplicate content. End with a canonical line: "Originally published at ${blogUrl}".

Output ONLY a JSON object — no preamble, no markdown fences. Schema:
{
  "medium_repost": "<800-1200 word lightly-reworded version of the post, ending with: Originally published at ${blogUrl}>",
  "linkedin_post": "<300-500 word professional-tone post, NO hashtags, ends with a soft CTA and the link ${blogUrl}>",
  "reddit_comments": [
    {
      "subreddit": "solotravel" | "digitalnomad" | "backpacking",
      "thread_topic": "<one-sentence description of the type of Reddit thread this comment fits — e.g. 'Someone asking how to meet locals in a city they're new to'>",
      "comment_body": "<200-400 words, value-first, naturally mentions Nearby Traveler ONLY if the context warrants it. Ends with: 'I wrote about this here: ${blogUrl}'>"
    }
    // exactly 3 total — pick 3 different subreddits from the allowed list
  ],
  "quora_answers": [
    {
      "question": "<a real Quora-style question this could answer — e.g. 'How can I meet people while traveling alone?'>",
      "answer_body": "<300-500 words, conversational, mentions Nearby Traveler naturally, ends with link ${blogUrl}>"
    }
    // exactly 2 total
  ]
}`;

  const userMessage = `Here is the blog post to repurpose. Use it as the source of truth for tone, facts, and angle.

Title: ${post.title}
Slug: ${post.slug}
URL: ${blogUrl}
Description: ${post.description}

=== BLOG POST BODY ===

${post.body}

=== END BODY ===

Generate the distribution kit. Return JSON only.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = extractText(response);
  return parseJson<DistributionKit>(text, "kit");
}

// -----------------------------------------------------------------------------
// 4. Format as HTML email
// -----------------------------------------------------------------------------

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatEmail(
  post: BlogPost,
  kit: DistributionKit,
): { subject: string; htmlContent: string; textContent: string } {
  const blogUrl = `${SITE_BASE}/blog/${post.slug}`;
  const subject = `📬 Distribution Kit: ${post.title}`;

  // Inline CSS only — keeps the email rendering predictable across clients.
  const css =
    "body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#222;line-height:1.5;max-width:720px;margin:0 auto;padding:24px}" +
    "h1{font-size:22px;margin-bottom:4px}" +
    "h2{font-size:18px;margin-top:32px;padding-top:16px;border-top:1px solid #eee}" +
    "h3{font-size:15px;margin-top:20px}" +
    "pre{background:#f6f7f9;border:1px solid #e3e6ea;padding:14px;border-radius:6px;white-space:pre-wrap;word-wrap:break-word;font-family:ui-monospace,'SF Mono',Menlo,Consolas,monospace;font-size:13px;line-height:1.5}" +
    ".meta{color:#666;font-size:14px;margin-top:0}" +
    ".label{font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px}" +
    "a{color:#0a66c2}";

  const sections: string[] = [];

  sections.push(
    `<h2>Medium repost</h2>
<p class="meta">Paste into a new Medium story. In story settings → "More options" → "Customize URL → Tell us where this content originally appeared", set canonical URL to <a href="${blogUrl}">${blogUrl}</a>.</p>
<pre>${htmlEscape(kit.medium_repost)}</pre>`,
  );

  sections.push(
    `<h2>LinkedIn post</h2>
<p class="meta">Paste into a new LinkedIn post. No hashtags by design.</p>
<pre>${htmlEscape(kit.linkedin_post)}</pre>`,
  );

  sections.push(
    `<h2>Reddit comments (${kit.reddit_comments.length})</h2>
<p class="meta">Drop into matching threads when you find them. Each is value-first; the blog link sits at the end.</p>`,
  );
  kit.reddit_comments.forEach((rc, i) => {
    sections.push(
      `<h3>${i + 1}. r/${htmlEscape(rc.subreddit)}</h3>
<p class="label">Thread type</p>
<p>${htmlEscape(rc.thread_topic)}</p>
<p class="label">Comment</p>
<pre>${htmlEscape(rc.comment_body)}</pre>`,
    );
  });

  sections.push(
    `<h2>Quora answers (${kit.quora_answers.length})</h2>
<p class="meta">Search Quora for the listed question (or close variants) and post the answer.</p>`,
  );
  kit.quora_answers.forEach((qa, i) => {
    sections.push(
      `<h3>${i + 1}. Question</h3>
<p>${htmlEscape(qa.question)}</p>
<p class="label">Answer</p>
<pre>${htmlEscape(qa.answer_body)}</pre>`,
    );
  });

  const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${css}</style></head>
<body>
<h1>📬 Distribution Kit</h1>
<p class="meta"><strong>${htmlEscape(post.title)}</strong><br>
<a href="${blogUrl}">${blogUrl}</a></p>
${sections.join("\n")}
</body></html>`;

  const textContent = [
    `📬 Distribution Kit: ${post.title}`,
    blogUrl,
    "",
    "=== Medium repost ===",
    kit.medium_repost,
    "",
    "=== LinkedIn post ===",
    kit.linkedin_post,
    "",
    "=== Reddit comments ===",
    ...kit.reddit_comments.map(
      (rc, i) =>
        `[${i + 1}] r/${rc.subreddit}\nThread type: ${rc.thread_topic}\n\n${rc.comment_body}\n`,
    ),
    "",
    "=== Quora answers ===",
    ...kit.quora_answers.map((qa, i) => `[${i + 1}] Q: ${qa.question}\n\n${qa.answer_body}\n`),
  ].join("\n");

  return { subject, htmlContent, textContent };
}

// -----------------------------------------------------------------------------
// 5. Send via Brevo (inline POST — keeps this script independent of server/)
// -----------------------------------------------------------------------------

async function sendBrevoEmail(args: {
  toEmail: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY is not set");

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: args.toEmail }],
      subject: args.subject,
      htmlContent: args.htmlContent,
      textContent: args.textContent,
      tags: ["distribution-kit"],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo send failed ${res.status}: ${body}`);
  }
  const result = (await res.json()) as { messageId?: string };
  console.log(`✅ Email sent (Brevo messageId: ${result.messageId ?? "unknown"})`);
}

// -----------------------------------------------------------------------------
// Helpers (mirror scripts/auto-blog/generate.ts)
// -----------------------------------------------------------------------------

function extractText(response: Anthropic.Message): string {
  const textBlocks = response.content.filter(
    (b): b is Anthropic.TextBlock => b.type === "text",
  );
  if (textBlocks.length === 0) {
    throw new Error("No text content in Claude response");
  }
  return textBlocks.map((b) => b.text).join("\n");
}

function parseJson<T>(text: string, label: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Could not locate JSON object in ${label} response:\n${text}`);
  }
  const jsonStr = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(jsonStr) as T;
  } catch (err) {
    throw new Error(
      `Failed to parse ${label} JSON: ${(err as Error).message}\n\nRaw text:\n${text}`,
    );
  }
}

// -----------------------------------------------------------------------------
// Dry-run pretty printer
// -----------------------------------------------------------------------------

function printDryRun(post: BlogPost, kit: DistributionKit): void {
  const sep = "─".repeat(80);
  const blogUrl = `${SITE_BASE}/blog/${post.slug}`;
  console.log("\n" + sep);
  console.log(`📬 Distribution Kit (dry-run)`);
  console.log(`Post: ${post.title}`);
  console.log(`URL:  ${blogUrl}`);
  console.log(sep);
  console.log("\n=== MEDIUM REPOST ===\n");
  console.log(kit.medium_repost);
  console.log("\n=== LINKEDIN POST ===\n");
  console.log(kit.linkedin_post);
  console.log("\n=== REDDIT COMMENTS ===");
  kit.reddit_comments.forEach((rc, i) => {
    console.log(`\n[${i + 1}] r/${rc.subreddit}`);
    console.log(`Thread type: ${rc.thread_topic}\n`);
    console.log(rc.comment_body);
  });
  console.log("\n=== QUORA ANSWERS ===");
  kit.quora_answers.forEach((qa, i) => {
    console.log(`\n[${i + 1}] Q: ${qa.question}\n`);
    console.log(qa.answer_body);
  });
  console.log("\n" + sep);
}

// -----------------------------------------------------------------------------
// Entry point
// -----------------------------------------------------------------------------

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const slugFlag = process.argv.find((a) => a.startsWith("--slug="));
  const overrideSlug = slugFlag ? slugFlag.split("=")[1] : null;

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  let newSlugs: string[];
  if (overrideSlug) {
    console.log(`[1/4] Override slug: ${overrideSlug} (skipping git diff detection)`);
    newSlugs = [overrideSlug];
  } else {
    console.log("[1/4] Detecting newly merged blog posts via git diff HEAD~1 HEAD...");
    newSlugs = detectNewSlugs();
    if (newSlugs.length === 0) {
      console.log(
        "      No new blog post entries detected in the most recent commit's diff. Exiting cleanly.",
      );
      return;
    }
    console.log(`      Found ${newSlugs.length} new post slug(s): ${newSlugs.join(", ")}`);
  }

  console.log("[2/4] Loading blog post data from shared/blog-posts.ts...");
  const allPosts = await loadPosts();
  const newPosts = newSlugs
    .map((slug) => allPosts.find((p) => p.slug === slug))
    .filter((p): p is BlogPost => p !== undefined);

  if (newPosts.length === 0) {
    console.log("      Slug(s) not found in current blogPosts array. Exiting.");
    return;
  }

  const client = new Anthropic();

  for (const post of newPosts) {
    console.log(`\n[3/4] Generating distribution kit for: "${post.title}"`);
    const kit = await generateKit(client, post);

    if (dryRun) {
      printDryRun(post, kit);
      console.log("\n[4/4] Dry-run mode — no email sent.");
    } else {
      console.log(`[4/4] Sending email to ${RECIPIENT}...`);
      const { subject, htmlContent, textContent } = formatEmail(post, kit);
      await sendBrevoEmail({
        toEmail: RECIPIENT,
        subject,
        htmlContent,
        textContent,
      });
    }
  }

  console.log("\n✓ Done.");
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
