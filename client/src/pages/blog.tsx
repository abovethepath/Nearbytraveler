import { useLocation } from "wouter";
import { getAllBlogPosts } from "@shared/blog-posts";
import { ArrowLeft } from "lucide-react";
import { SEOHelmet } from "@/components/SEOHelmet";

export default function Blog() {
  const [, setLocation] = useLocation();
  const posts = getAllBlogPosts();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <SEOHelmet title="Blog | Nearby Traveler" description="Stories, tips, and updates from the Nearby Traveler community. Solo travel advice, city guides, and how to meet people anywhere." path="/blog" />
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Blog</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Stories, tips, and updates from the Nearby Traveler community.</p>
        </div>

        {/* Post list */}
        <div className="space-y-6">
          {posts.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400">No posts yet. Check back soon!</p>
          )}
          {posts.map((post) => (
            <article
              key={post.slug}
              onClick={() => setLocation(`/blog/${post.slug}`)}
              className="cursor-pointer p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-orange-300 dark:hover:border-orange-600 transition-colors"
            >
              <time className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </time>
              <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{post.title}</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{post.description}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
