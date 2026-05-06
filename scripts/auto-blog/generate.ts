/**
 * Automated blog post generator for Nearby Traveler.
 *
 * Runs on a schedule via GitHub Actions. Workflow:
 *   1. Reads existing posts from shared/blog-posts.ts
 *   2. Asks Claude to research a trending solo-travel topic that fits NT's
 *      brand and isn't already covered by an existing post
 *   3. Asks Claude to write the post in the same voice as a randomly selected
 *      existing post (used as a tone reference)
 *   4. Appends the new entry to shared/blog-posts.ts
 *   5. Creates a branch, commits, pushes, and opens a PR
 *
 * The PR is the human-in-the-loop approval step. Merge it to publish.
 *
 * Required environment variables:
 *   ANTHROPIC_API_KEY  - Anthropic API key
 *   GITHUB_TOKEN       - provided automatically by Actions
 *   GH_BRANCH_PREFIX   - optional, defaults to "auto-blog"
 */

import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// -----------------------------------------------------------------------------
// Paths & constants
// -----------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const POSTS_FILE = path.join(REPO_ROOT, "shared", "blog-posts.ts");

// Sentinel string used to locate the end of the blogPosts array in the source
// file. If you ever rename getAllBlogPosts(), update this too.
const ARRAY_END_SENTINEL_REGEX = /\]\s*;\s*[\r\n]+\s*export\s+(?:function|const)\s+\w+/;

// Model used for both research and drafting. Sonnet is plenty for blog posts
// and ~5x cheaper than Opus. Update if a newer Sonnet ships:
// https://docs.claude.com/en/docs/about-claude/models
const MODEL = "claude-sonnet-4-6";

// -----------------------------------------------------------------------------
// Types (mirrors shared/blog-posts.ts, kept in sync manually)
// -----------------------------------------------------------------------------

interface BlogPost {
  title: string;
  date: string;
  slug: string;
  description: string;
  body: string;
}

interface ResearchResult {
  topic: string;
  target_keyword: string;
  related_keywords: string[];
  search_intent: string;
  why_now: string;
  suggested_title: string;
  suggested_slug: string;
}

interface DraftResult {
  title: string;
  slug: string;
  description: string;
  body: string;
}

// -----------------------------------------------------------------------------
// 1. Read existing posts
// -----------------------------------------------------------------------------

async function readExistingPosts(): Promise<{ source: string; posts: BlogPost[] }> {
  const source = await fs.readFile(POSTS_FILE, "utf8");

  // Dynamic import avoids fragile regex parsing of the body field, which
  // contains arbitrary markdown including backticks and special chars.
  const moduleUrl = pathToFileURL(POSTS_FILE).href;
  const mod = (await import(moduleUrl)) as { blogPosts: BlogPost[] };

  if (!Array.isArray(mod.blogPosts)) {
    throw new Error(`Expected blogPosts array in ${POSTS_FILE}`);
  }
  return { source, posts: mod.blogPosts };
}

// -----------------------------------------------------------------------------
// 2. Research — pick a topic
// -----------------------------------------------------------------------------

async function researchTopic(client: Anthropic, posts: BlogPost[]): Promise<ResearchResult> {
  const today = new Date().toISOString().slice(0, 10);
  const existingSummary = posts
    .map((p) => `- ${p.slug} — "${p.title}"`)
    .join("\n");

  const systemPrompt = `You are an SEO content strategist for Nearby Traveler (nearbytraveler.org), a free social travel app that connects solo travelers with locals and other travelers in real time. The product's hook is a "Nearby Alerts" feature inspired by a real missed-connection story: the founder met someone in NYC, then later traveled to Barcelona while she was also there, but they had no way to find each other.

The blog's editorial angle:
- Solo travel — the loneliness / "how do I meet people" problem (primary lane, ~60% of posts)
- Family travel — connecting with other families, finding kid-friendly meetups, locals with kids who can show you around
- Business travelers — what to do with your evenings in a new city, meeting locals or other travelers when you're stuck on a work trip
- Practical, specific, no-fluff advice — not generic listicles
- Honest about the tradeoffs of solo travel (it's not always Instagram)
- Mentions Nearby Traveler naturally where it actually solves the problem, not as an ad
- Never positions Nearby Traveler against Couchsurfing — they're complementary

Your job today: pick ONE blog topic for the next post that meets all of these:
1. Trending or evergreen-with-rising-interest in the solo travel space (verify with web search)
2. Has SEO opportunity — people are searching for it, competition isn't crushing
3. Fits the editorial angle above
4. Is NOT a duplicate of any existing post (list provided)
5. Could plausibly mention Nearby Traveler somewhere in the body without being forced

Use web search to verify trending status, check what's currently ranking on Google for the keyword, and confirm none of the existing posts already cover it.

Return ONLY a JSON object — no preamble, no markdown fences. Schema:
{
  "topic": "<one-line summary of the angle>",
  "target_keyword": "<primary keyword/phrase, lowercase>",
  "related_keywords": ["<2-5 related keywords>"],
  "search_intent": "informational | transactional | navigational | commercial",
  "why_now": "<one sentence explaining why this topic right now>",
  "suggested_title": "<headline, max 65 chars for SEO>",
  "suggested_slug": "<url-slug-in-kebab-case>"
}`;

  const userMessage = `Today's date: ${today}

Existing posts (do NOT duplicate or closely overlap):
${existingSummary}

Research and pick the next post topic. Return JSON only.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    tools: [{ type: "web_search_20250305", name: "web_search" } as any],
  });

  const text = extractText(response);
  return parseJson<ResearchResult>(text, "research");
}

// -----------------------------------------------------------------------------
// 3. Draft — write the post
// -----------------------------------------------------------------------------

async function draftPost(
  client: Anthropic,
  research: ResearchResult,
  posts: BlogPost[],
): Promise<DraftResult> {
  // Pick a random existing post as a tone reference. Random > "newest" because
  // it prevents the voice from drifting in one direction over time.
  const reference = posts[Math.floor(Math.random() * posts.length)];

  // Internal link options: all existing posts (Claude picks 2-3 to weave in)
  const linkOptions = posts
    .map((p) => `- /blog/${p.slug} — "${p.title}" — ${p.description}`)
    .join("\n");

  const systemPrompt = `You are writing a blog post for Nearby Traveler in the established editorial voice. You will be given a reference post — match its tone, structure, paragraph length, heading style, and overall vibe as closely as you can without copying any sentences.

Hard rules:
- Length: 900-1400 words (count the body, not headings)
- Use markdown: ## for section headings, ### sparingly. Bold for emphasis. Plain links: [text](url).
- DO NOT use h1 (#) — the title is rendered separately
- Mention Nearby Traveler exactly once, naturally, where it actually solves the problem the section is discussing. Link to https://nearbytraveler.org. If you can't fit it naturally, don't force it — leave it out.
- Include 2-3 internal links to other Nearby Traveler blog posts from the provided list, woven into relevant sentences. Use the format /blog/<slug> for the URL.
- No "In conclusion" / "In summary" closings. Land the ending with a specific, concrete sentence.
- No em-dashes used as a stylistic crutch. Use them sparingly, the way a good writer would.
- No AI tells: avoid "delve", "tapestry", "navigate the landscape", "in today's world", "in an era where", "It's worth noting that"
- Honest tone. If a tip has tradeoffs, say so.

Output: Return ONLY a JSON object — no preamble, no markdown fences:
{
  "title": "<final title, can refine the suggested one>",
  "slug": "<final url slug, kebab-case>",
  "description": "<150-160 char meta description for SEO>",
  "body": "<the full markdown body>"
}`;

  const userMessage = `=== REFERENCE POST (match this voice) ===

Title: ${reference.title}

${reference.body}

=== END REFERENCE ===

Now write a new post on this topic:

Topic: ${research.topic}
Target keyword: ${research.target_keyword}
Related keywords: ${research.related_keywords.join(", ")}
Search intent: ${research.search_intent}
Why this topic now: ${research.why_now}
Suggested title: ${research.suggested_title}
Suggested slug: ${research.suggested_slug}

Internal link options (pick 2-3 to use naturally in the body):
${linkOptions}

Return JSON only.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = extractText(response);
  return parseJson<DraftResult>(text, "draft");
}

// -----------------------------------------------------------------------------
// 4. Append the new post to shared/blog-posts.ts
// -----------------------------------------------------------------------------

function serializePost(post: BlogPost): string {
  // Escape the body for safe insertion inside a TypeScript template literal
  const escapedBody = post.body
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");

  return `  {
    title: ${JSON.stringify(post.title)},
    date: ${JSON.stringify(post.date)},
    slug: ${JSON.stringify(post.slug)},
    description: ${JSON.stringify(post.description)},
    body: \`${escapedBody}\`
  }`;
}

function appendToSourceFile(source: string, post: BlogPost): string {
  const match = source.match(ARRAY_END_SENTINEL_REGEX);
  if (!match || match.index === undefined) {
    throw new Error(
      `Could not find array end sentinel (closing "];" before any export) in source file. ` +
        `Did the structure of shared/blog-posts.ts change?`,
    );
  }
  const idx = match.index; // position of `]`

  // Walk backwards from the sentinel to find the last non-whitespace char.
  // It's either `}` (no trailing comma) or `,` (trailing comma).
  let cursor = idx - 1;
  while (cursor > 0 && /\s/.test(source[cursor])) cursor--;
  const lastChar = source[cursor];
  const hasTrailingComma = lastChar === ",";

  if (lastChar !== "}" && lastChar !== ",") {
    throw new Error(
      `Unexpected character "${lastChar}" before array end. Source file may be malformed.`,
    );
  }

  const insertAt = cursor + 1;
  const insert = (hasTrailingComma ? "" : ",") + "\n" + serializePost(post);

  return source.slice(0, insertAt) + insert + source.slice(insertAt);
}

// -----------------------------------------------------------------------------
// 5. Git: branch, commit, push, open PR
// -----------------------------------------------------------------------------

function sh(cmd: string): string {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function commitAndOpenPR(post: BlogPost, research: ResearchResult): void {
  const branchPrefix = process.env.GH_BRANCH_PREFIX ?? "auto-blog";
  const branch = `${branchPrefix}/${post.slug}`;

  // Configure git identity for the bot commit
  sh(`git config user.name "nearby-traveler-bot"`);
  sh(`git config user.email "bot@nearbytraveler.org"`);

  // Create and switch to new branch
  sh(`git checkout -b ${branch}`);

  // Stage and commit
  sh(`git add shared/blog-posts.ts`);
  const commitMsg = `Add blog post: ${post.title}`;
  sh(`git commit -m ${JSON.stringify(commitMsg)}`);

  // Push branch
  sh(`git push -u origin ${branch}`);

  // Open PR using gh CLI (pre-installed on GitHub Actions runners,
  // authenticates automatically via GITHUB_TOKEN env var)
  const prBody = `## Auto-generated blog post

**Title:** ${post.title}
**Slug:** \`${post.slug}\`
**Target keyword:** \`${research.target_keyword}\`
**Search intent:** ${research.search_intent}

**Why this topic:** ${research.why_now}

**Description:**
> ${post.description}

---

Review the body in \`shared/blog-posts.ts\`, edit if needed, then merge to publish.

Once merged, the \`notify-search\` workflow will automatically:
- Resubmit the sitemap to Google Search Console
- Ping IndexNow (Bing + Yandex)

— generated by \`scripts/auto-blog/generate.ts\``;

  sh(
    `gh pr create --title ${JSON.stringify(commitMsg)} ` +
      `--body ${JSON.stringify(prBody)} ` +
      `--base main --head ${branch}`,
  );
}

// -----------------------------------------------------------------------------
// Helpers
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
  // Strip markdown code fences if present (model sometimes wraps despite
  // instructions)
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  // Find the first { and the matching last } to be defensive about preamble
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
// Entry point
// -----------------------------------------------------------------------------

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  console.log("[1/5] Reading existing posts...");
  const { source, posts } = await readExistingPosts();
  console.log(`      Found ${posts.length} existing posts.`);

  const client = new Anthropic();

  console.log("[2/5] Researching topic...");
  const research = await researchTopic(client, posts);
  console.log(`      Topic: ${research.suggested_title}`);
  console.log(`      Keyword: ${research.target_keyword}`);

  // Sanity check: don't proceed if the suggested slug already exists
  if (posts.some((p) => p.slug === research.suggested_slug)) {
    throw new Error(
      `Research returned an existing slug (${research.suggested_slug}). Aborting.`,
    );
  }

  console.log("[3/5] Drafting post...");
  const draft = await draftPost(client, research, posts);
  console.log(`      Draft: ${draft.title} (${draft.body.length} chars)`);

  // Build the final post object
  const newPost: BlogPost = {
    title: draft.title,
    date: new Date().toISOString().slice(0, 10),
    slug: draft.slug,
    description: draft.description,
    body: draft.body,
  };

  // Final dedup check on the final slug
  if (posts.some((p) => p.slug === newPost.slug)) {
    throw new Error(`Generated slug "${newPost.slug}" already exists. Aborting.`);
  }

  console.log("[4/5] Updating shared/blog-posts.ts...");
  const updatedSource = appendToSourceFile(source, newPost);
  await fs.writeFile(POSTS_FILE, updatedSource, "utf8");

  console.log("[5/5] Creating branch and opening PR...");
  commitAndOpenPR(newPost, research);

  console.log("\n✓ Done. Review the PR on GitHub.");
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
