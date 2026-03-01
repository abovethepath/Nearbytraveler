import { getApiBaseUrl } from "@/lib/queryClient";

export interface HostelChatroomArgs {
  hostelName: string;
  city: string;
  state?: string | null;
  country?: string | null;
}

export interface HostelChatroomResult {
  chatroomId: number;
  created: boolean;
  name?: string;
}

function getStoredUserId(): number | null {
  try {
    const raw = localStorage.getItem("user") || localStorage.getItem("travelconnect_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const id = Number(parsed?.id);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

export async function resolveAndJoinHostelChatroom(args: HostelChatroomArgs): Promise<HostelChatroomResult> {
  const hostelName = String(args.hostelName || "").trim();
  const city = String(args.city || "").split(",")[0]?.trim();
  const state = args.state == null ? null : String(args.state).trim();
  const country = args.country == null ? null : String(args.country).trim();

  if (!hostelName || !city) {
    throw new Error("Missing hostel name or city");
  }

  const userId = getStoredUserId();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (userId) headers["x-user-id"] = String(userId);

  const res = await fetch(`${getApiBaseUrl()}/api/hostel-chatrooms/resolve-join`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ hostelName, city, state, country }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || err?.message || "Failed to open hostel chatroom");
  }

  return (await res.json()) as HostelChatroomResult;
}

