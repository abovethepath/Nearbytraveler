import { useLocation } from "wouter";
import { getBlogPost } from "@/lib/blogPosts";
import { ArrowLeft } from "lucide-react";
import { SEOHelmet } from "@/components/SEOHelmet";

// Simple markdown-to-HTML renderer (no external deps)
function renderMarkdown(md: string): string {
  if (!md) return "<p class='text-gray-500 dark:text-gray-400 italic'>Content coming soon.</p>";
  return md
    // Headings
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-3">$1</h1>')
    // Bold & italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-orange-500 hover:text-orange-600 underline" target="_blank" rel="noopener noreferrer">$1</a>')
    // Paragraphs (double newline)
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<h") || trimmed.startsWith("<ul") || trimmed.startsWith("<ol")) return trimmed;
      return `<p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");
}

export default function BlogPost({ slug }: { slug: string }) {
  const [, setLocation] = useLocation();
  const post = getBlogPost(slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Post not found</h1>
          <button onClick={() => setLocation("/blog")} className="text-orange-500 hover:text-orange-600">
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <SEOHelmet title={`${post.title} | Nearby Traveler`} description={post.description} path={`/blog/${post.slug}`} />
        {/* Back link */}
        <button
          onClick={() => setLocation("/blog")}
          className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Blog
        </button>

        {/* Post header */}
        <header className="mb-8">
          <time className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </time>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">{post.title}</h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">{post.description}</p>
        </header>

        {/* Post body */}
        <article
          className="prose-custom"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
        />
      </div>
    </div>
  );
}
