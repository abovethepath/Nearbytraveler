export type ShareEventLike = {
  id: number | string;
  title: string;
  description?: string | null;
  date: string | Date;
  startTime?: string | null;
  endTime?: string | null;
  venueName?: string | null;
  venue?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  category?: string | null;
};

export function getEventUrl(eventId: number | string, origin = window.location.origin) {
  return `${origin}/events/${eventId}`;
}

export function getEventShareMessage(event: ShareEventLike, origin = window.location.origin) {
  const dateObj = new Date(event.date);
  const eventDateStr = dateObj.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  const eventTimeStr = dateObj.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const location = event.city ? ` in ${event.city}` : "";
  const url = getEventUrl(event.id, origin);
  return `Hey! Check out this event: "${event.title}"${location} on ${eventDateStr} at ${eventTimeStr}. Join me! ${url}`;
}

export function getInstagramCaption(event: ShareEventLike, origin = window.location.origin) {
  const dateObj = new Date(event.date);
  const eventDate = dateObj.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const time = event.startTime ? ` at ${event.startTime}` : "";
  const venue = event.venueName || event.venue || "";
  const location = [venue, event.city, event.state].filter(Boolean).join(", ");
  const desc = (event.description || "Join us for this amazing event!").trim();
  const shortDesc = desc.slice(0, 200) + (desc.length > 200 ? "..." : "");
  const url = getEventUrl(event.id, origin);
  const cityTag = event.city ? `#${String(event.city).replace(/\s+/g, "")}Events` : "";
  const stateTag = event.state ? `#${String(event.state).replace(/\s+/g, "")}Events` : "";
  const categoryTag = event.category ? `#${String(event.category).replace(/\s+/g, "")}` : "";

  return [
    `📅 ${event.title}`,
    "",
    `🗓️ ${eventDate}${time}`,
    location ? `📍 ${location}` : null,
    "",
    shortDesc,
    "",
    ["#NearbyTraveler", "#LocalEvents", "#CommunityEvents", "#MeetUp", cityTag, stateTag, "#TravelCommunity", "#SocialEvents", categoryTag]
      .filter(Boolean)
      .join(" "),
    "",
    `🔗 RSVP: ${url}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function getWhatsAppShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function getTelegramShareUrl(text: string, url: string) {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function getXShareUrl(text: string, url: string) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

export function getFacebookShareUrl(url: string) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function getEmailShareUrl(subject: string, body: string) {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

