import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_PREFIX = "nt_profile_nudges_";
const MAX_SESSIONS = 5;

interface NudgeState {
  loginSessionCount: number;
  lastSessionId: string;
  bioEdited: boolean;
  interestsEdited: boolean;
  thingsToDoEdited: boolean;
}

function getDefaultState(): NudgeState {
  return {
    loginSessionCount: 0,
    lastSessionId: "",
    bioEdited: false,
    interestsEdited: false,
    thingsToDoEdited: false,
  };
}

function getStorageKey(userId: number): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function loadState(userId: number): NudgeState {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return getDefaultState();
    return { ...getDefaultState(), ...JSON.parse(raw) };
  } catch {
    return getDefaultState();
  }
}

function saveStateForUser(userId: number, state: NudgeState) {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(state));
  } catch {}
}

function ensureSessionId(): string {
  let id = sessionStorage.getItem("nt_nudge_session_id");
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem("nt_nudge_session_id", id);
  }
  return id;
}

export function useProfileNudges(isOwnProfile: boolean, userId?: number) {
  const [state, setState] = useState<NudgeState>(getDefaultState);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    if (!isOwnProfile || !userId) return;

    const stored = loadState(userId);
    const sessionId = ensureSessionId();

    if (stored.lastSessionId !== sessionId) {
      stored.loginSessionCount = (stored.loginSessionCount || 0) + 1;
      stored.lastSessionId = sessionId;
      saveStateForUser(userId, stored);
    }

    setState(stored);
  }, [isOwnProfile, userId]);

  const dismissBio = useCallback(() => {
    const uid = userIdRef.current;
    if (!uid) return;
    setState((prev) => {
      const next = { ...prev, bioEdited: true };
      saveStateForUser(uid, next);
      return next;
    });
  }, []);

  const dismissInterests = useCallback(() => {
    const uid = userIdRef.current;
    if (!uid) return;
    setState((prev) => {
      const next = { ...prev, interestsEdited: true };
      saveStateForUser(uid, next);
      return next;
    });
  }, []);

  const dismissThingsToDo = useCallback(() => {
    const uid = userIdRef.current;
    if (!uid) return;
    setState((prev) => {
      const next = { ...prev, thingsToDoEdited: true };
      saveStateForUser(uid, next);
      return next;
    });
  }, []);

  const withinSessionWindow = state.loginSessionCount <= MAX_SESSIONS;

  return {
    showBioNudge: isOwnProfile && withinSessionWindow && !state.bioEdited,
    showInterestsNudge: isOwnProfile && withinSessionWindow && !state.interestsEdited,
    showThingsToDoNudge: isOwnProfile && withinSessionWindow && !state.thingsToDoEdited,
    dismissBio,
    dismissInterests,
    dismissThingsToDo,
  };
}
