import type { Migration } from "@yext/visual-editor";

const hasAuthoredColor = (value: unknown): boolean => {
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, child]) => {
    if (key === "color" && typeof child === "string" && child.trim())
      return true;
    if (
      key === "style" &&
      typeof child === "string" &&
      /(?:^|;)\s*color\s*:/i.test(child)
    )
      return true;
    return hasAuthoredColor(child);
  });
};

/** Old default RTF serialized black paragraphs even when Lexical had no color. */
export const removeLegacyRichTextColor = (value: any): any => {
  if (Array.isArray(value)) return value.map(removeLegacyRichTextColor);
  if (!value || typeof value !== "object") return value;
  const result = Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      removeLegacyRichTextColor(child),
    ])
  );
  if (typeof value.html !== "string" || typeof value.json !== "string")
    return result;
  try {
    const lexical = JSON.parse(value.json);
    if (!Array.isArray(lexical.root?.children) || hasAuthoredColor(lexical))
      return result;
    result.html = value.html.replace(
      /(<p\b[^>]*\bstyle=)(["'])(.*?)\2/gi,
      (_match: string, prefix: string, quote: string, style: string) => {
        const declarations = style
          .split(";")
          .filter(
            (declaration) =>
              !/^\s*color\s*:\s*rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)\s*$/i.test(
                declaration
              )
          );
        return `${prefix}${quote}${declarations.join(";")}${quote}`;
      }
    );
  } catch {
    // Preserve HTML-only or malformed legacy content rather than guessing intent.
  }
  return result;
};

export const legacyRichTextColor: Migration = {
  content: { transformation: (content) => removeLegacyRichTextColor(content) },
};
