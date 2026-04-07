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
    body: `You've landed in a new city. Your hotel is fine. The sights are on your list. But the thing that will actually make this trip memorable — the people — is still completely left to chance.

Every traveler knows this feeling. And yet in 2026, with all the technology we have, meeting locals while traveling is still harder than it should be.

Here's an honest look at what actually works.

## Why Meeting Locals Is So Hard

Most travel infrastructure is built for tourists. The restaurants near the main square. The tour groups. The hotel concierge recommendations. All of it keeps you in a tourist bubble surrounded by other tourists.

Breaking out of that bubble requires going where locals go — and having a way to actually connect with them when you get there.

## What Actually Works for Meeting Locals

### Use Apps Built for Real-Time Connection

The biggest shift in recent years is real-time availability. [Nearby Traveler](https://nearbytraveler.org) lets locals mark themselves available to meet travelers — and lets travelers see who's free right now in their city.

It works because both sides are on the app for the same reason. A local who opens Nearby Traveler and marks themselves available genuinely wants to meet someone. A traveler who opens it genuinely wants to connect with locals. The app makes that mutual desire visible in real time.

Free to use. Works in cities worldwide. The home screen shows you travelers and locals available right now — no scheduling required.

### Go Where Locals Actually Go

The tourist trail keeps you around other tourists. To meet locals you have to go where locals go.

This means neighborhood bars over rooftop tourist spots. Local markets over food halls. The regular cafe two blocks from the main square over the one on it.

Ask your accommodation host where they actually eat and drink. That question alone unlocks a different city.

### Take Classes and Join Activities

Structured activities create natural conversation. A cooking class, a dance lesson, a surf session, a language exchange — these put you next to locals doing something together, which is a far more natural setting for connection than trying to cold-approach someone.

Look for recurring activities rather than one-offs. A weekly language exchange or a regular sports league gives you repeat exposure to the same people, which is how friendships actually form.

### Volunteer

Volunteering is one of the most underused strategies for meeting locals. A few hours at a community garden, a beach cleanup, a local food bank — you work alongside people who care about the place you're visiting, and conversation happens naturally.

### Be Direct About What You're Looking For

When you meet someone interesting, just say it. "I just arrived here and I don't know anyone — would you want to grab a coffee sometime?"

Most people are flattered to be asked. Locals often love showing visitors their city. The worst that happens is they say no. More often than not they say yes.

## The Real-Time Approach

All of the above works. But they all require either planning ahead or hoping you're in the right place at the right time.

[Nearby Traveler](https://nearbytraveler.org) removes the luck factor. Open it in any city, see locals who are available to meet right now, and connect in one tap. Or mark yourself available and let locals find you.

It's the infrastructure that was missing. The mutual desire to connect was always there.

## The Bottom Line

Meeting locals while traveling isn't about being extroverted or lucky. It's about putting yourself in the right situations and using the right tools.

Start at [nearbytraveler.org](https://nearbytraveler.org). See who's around. The best part of any city is the people who live there — go meet them.`,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getAllBlogPosts(): BlogPost[] {
  return [...blogPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
