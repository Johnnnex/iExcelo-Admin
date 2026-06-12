export * from "./constants";
export * from "./error-handler";

export function stripMarkdownPreview(content: string, maxLen = 120, ellipsis = false): string {
  const stripped = content
    .replace(/<\/(p|div|li|blockquote|h[1-6])>/gi, " ")
    .replace(/<(br|hr)\s*\/?>/gi, " ")
    .replace(/<img[^>]*>/gi, "(Image)")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "(Image)")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#+\s/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\$\$?[^$]*\$\$?/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const truncated = stripped.slice(0, maxLen);
  return ellipsis && stripped.length > maxLen ? truncated + "…" : truncated;
}
