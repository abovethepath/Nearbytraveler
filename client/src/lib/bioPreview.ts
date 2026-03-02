export function truncateBioToSentences(rawBio: string | null | undefined, maxSentences = 3): string {
  const text = String(rawBio || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";

  // Prefer the requested delimiter first.
  const dotSpaceParts = text.includes(". ") ? text.split(". ").map((s) => s.trim()).filter(Boolean) : null;
  const parts =
    dotSpaceParts && dotSpaceParts.length > 1
      ? dotSpaceParts
      : (text.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) || [text]).map((s) => s.trim()).filter(Boolean);

  if (parts.length <= maxSentences) return text;

  const snippet =
    dotSpaceParts && dotSpaceParts.length > 1
      ? (() => {
          const joined = parts.slice(0, maxSentences).join(". ").trim();
          return joined.endsWith(".") ? joined : `${joined}.`;
        })()
      : parts.slice(0, maxSentences).join(" ").trim();

  const cleaned = snippet.replace(/\s+$/, "").replace(/(\.\.\.|…)\s*$/, "");
  return `${cleaned}...`;
}

