export * from "./constants";
export * from "./error-handler";

export function stripMarkdownPreview(
  content: string,
  maxLen = 120,
  ellipsis = false,
): string {
  const stripped = content
    // Math HTML elements (TipTap stores math as data-type attributes) → readable placeholder
    .replace(
      /<(?:span|div)[^>]*data-type="(?:inline|block)-math"[^>]*/gi,
      "[formula]",
    )
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
    // Block math ($$...$$) may span multiple lines
    .replace(/\$\$([\s\S]*?)\$\$/g, "[formula]")
    // Inline math ($...$) — single line only
    .replace(/\$([^$\n]+)\$/g, "[formula]")
    // Unescape Markdown escape sequences (Turndown escapes _ as \_ to prevent emphasis parsing)
    .replace(/\\([_*[\]()~>#+=|{}.!\-])/g, "$1")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const truncated = stripped.slice(0, maxLen);
  return ellipsis && stripped.length > maxLen ? truncated + "…" : truncated;
}
