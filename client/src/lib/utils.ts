import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Cancel/Postpone: a planning surface (calendar, widgets, map pins) should only show
// 'active' events. Missing status defaults to 'active' (fail-open) so legacy rows and
// any feed that doesn't return status stay visible rather than being wrongly hidden.
// Cards + the event detail page do NOT use this — they show everything with a banner.
export function isActiveEvent(event: any): boolean {
  return (event?.status ?? 'active') === 'active';
}
