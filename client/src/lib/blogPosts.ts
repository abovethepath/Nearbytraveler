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
  {
    title: "Best Couchsurfing Alternative in 2026",
    date: "2026-04-07",
    slug: "best-couchsurfing-alternative-2026",
    description: "Looking for a Couchsurfing alternative? Nearby Traveler connects you with locals and travelers in real time — no hosting required. Free to join.",
    body: "",
  },
  {
    title: "Solo Female Travel Safety Tips for 2026",
    date: "2026-04-07",
    slug: "solo-female-travel-safety-tips",
    description: "Essential safety tips for solo female travelers. How to stay safe, meet trustworthy people, and travel confidently on your own.",
    body: "",
  },
  {
    title: "How to Find Travel Buddies in Any City",
    date: "2026-04-07",
    slug: "how-to-find-travel-buddies",
    description: "Want a travel buddy but don't know where to start? Here's how to find like-minded travelers and locals to explore with — no planning required.",
    body: "",
  },
  {
    title: "Best Apps for Solo Travelers in 2026",
    date: "2026-04-07",
    slug: "best-apps-for-solo-travelers",
    description: "The top apps every solo traveler needs in 2026. From meeting locals to navigation to staying safe — these are the ones worth downloading.",
    body: "",
  },
  {
    title: "How to Meet Locals When Traveling (Not Just Tourists)",
    date: "2026-04-07",
    slug: "meet-locals-when-traveling",
    description: "Skip the tourist traps and meet real locals. Here's how to connect with people who actually live in the city you're visiting.",
    body: "",
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getAllBlogPosts(): BlogPost[] {
  return [...blogPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
