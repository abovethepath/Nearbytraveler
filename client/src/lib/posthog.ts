import posthog from "posthog-js";

type IdentifyUserArgs = {
  id: number | string;
  username?: string | null;
  hometownCity?: string | null;
  metropolitanArea?: string | null;
  createdAt?: string | Date | null;
};

function safeIsoDate(value: unknown): string | undefined {
  if (!value) return undefined;
  try {
    const d = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString();
  } catch {
    return undefined;
  }
}

export function initPosthog() {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key || !key.trim()) return;

  posthog.init(key.trim(), {
    api_host: "https://us.i.posthog.com",
    // SPA-friendly pageviews + modern defaults (includes session recording behavior changes)
    capture_pageview: "history_change",
    capture_pageleave: true,
    autocapture: true,
    defaults: "2026-01-30",
    disable_session_recording: false,
    session_recording: {},
  });
}

export function posthogIdentifyUser(u: IdentifyUserArgs | null | undefined) {
  if (!u?.id) return;

  posthog.identify(String(u.id), {
    username: u.username ?? undefined,
    city: u.hometownCity ?? undefined,
    metropolitanArea: u.metropolitanArea ?? undefined,
    createdAt: safeIsoDate(u.createdAt),
  });
}

export function posthogReset() {
  posthog.reset();
}

export function posthogCapture(event: string, properties?: Record<string, any>) {
  if (!event) return;
  posthog.capture(event, properties);
}

