export interface BlogPost {
  title: string;
  date: string;
  slug: string;
  description: string;
  body: string;
}

// Blog posts registry — add new posts here.
// Body supports simple markdown: ## headings, **bold**, [links](url), paragraphs separated by blank lines.
export const blogPosts: BlogPost[] = [
  {
    title: "How to Meet People When Traveling Alone",
    date: "2026-04-04",
    slug: "how-to-meet-people-when-traveling-alone",
    description: "Solo travel doesn't have to mean being alone. Here's how to connect with locals and fellow travelers wherever you go.",
    body: "",
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getAllBlogPosts(): BlogPost[] {
  return [...blogPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
