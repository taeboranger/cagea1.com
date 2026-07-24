import "server-only";
import sanitizeHtml from "sanitize-html";

// Mirrors the node/mark set enabled in components/RichTextEditor.tsx —
// keep the two in sync when the editor's toolbar changes.
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "span",
];

const ALLOWED_STYLES = {
  span: {
    color: [
      /^#[0-9a-fA-F]{3,8}$/,
      /^rgb\(/,
      /^rgba\(/,
      /^var\(--color-[\w-]+\)$/,
    ],
    "font-family": [
      /^[a-zA-Z0-9\s,'"-]+(?:,\s*var\(--font-[\w-]+\))?$/,
      /^var\(--font-[\w-]+\)(,\s*[a-zA-Z\s]+)?$/,
    ],
    "font-size": [/^[\d.]+(px|rem|em|%)$/],
  },
};

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      span: ["style"],
    },
    allowedStyles: ALLOWED_STYLES,
    disallowedTagsMode: "discard",
    nonTextTags: ["style", "script", "textarea", "option"],
  });
}
