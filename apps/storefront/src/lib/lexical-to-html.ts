/**
 * Minimal Lexical JSON to HTML serializer for Payload CMS richText fields.
 * Handles root, paragraph, text, heading, list, link, table. Safe for dangerouslySetInnerHTML.
 */

type LexicalNode = {
  type?: string;
  children?: LexicalNode[];
  text?: string;
  format?: number;
  url?: string;
  tag?: string;
  [key: string]: unknown;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderNode(node: LexicalNode): string {
  if (!node || typeof node !== "object") return "";

  const type = node.type ?? "";
  const children = Array.isArray(node.children) ? node.children.map(renderNode).join("") : "";
  const text = typeof node.text === "string" ? escapeHtml(node.text) : "";
  const format = typeof node.format === "number" ? node.format : 0;
  const bold = (format & 1) === 1;
  const italic = (format & 2) === 2;

  switch (type) {
    case "root":
      return children;
    case "paragraph":
      return children ? `<p class="mb-4 last:mb-0">${children}</p>` : "";
    case "text":
      let out = text;
      if (bold) out = `<strong>${out}</strong>`;
      if (italic) out = `<em>${out}</em>`;
      return out;
    case "heading": {
      const tag = (node.tag as string) || "h2";
      const level = tag.replace("h", "") || "2";
      const size = level === "1" ? "text-2xl md:text-3xl" : level === "2" ? "text-xl md:text-2xl" : "text-lg";
      return `<${tag} class="${size} font-semibold mb-2">${children}</${tag}>`;
    }
    case "list":
      return node.listType === "number" ? `<ol class="list-decimal list-inside mb-4">${children}</ol>` : `<ul class="list-disc list-inside mb-4">${children}</ul>`;
    case "listitem":
      return `<li class="mb-1">${children}</li>`;
    case "link": {
      const url = typeof node.url === "string" ? escapeHtml(node.url) : "#";
      const fields = node.fields as { newTab?: boolean } | undefined;
      const target = fields?.newTab ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${url}" class="text-primary underline hover:no-underline"${target}>${children}</a>`;
    }
    case "linebreak":
      return "<br />";
    case "table":
      return children
        ? `<table class="w-full border-collapse border border-border my-4 text-left text-sm"><tbody>${children}</tbody></table>`
        : "";
    case "tablerow":
      return children ? `<tr class="border-b border-border">${children}</tr>` : "";
    case "tablecell": {
      const headerState = typeof (node as { headerState?: number }).headerState === "number" ? (node as { headerState: number }).headerState : 0;
      const tag = headerState > 0 ? "th" : "td";
      const cellClass =
        tag === "th"
          ? "border border-border bg-surface px-3 py-2 font-semibold"
          : "border border-border px-3 py-2";
      return children ? `<${tag} class="${cellClass}">${children}</${tag}>` : `<${tag} class="${cellClass}"></${tag}>`;
    }
    default:
      return children || text;
  }
}

/** Convert Payload Lexical richText JSON to HTML string. */
export function lexicalToHtml(json: unknown): string {
  if (json == null) return "";
  const root = typeof json === "object" && json && "root" in json ? (json as { root: LexicalNode }).root : (json as LexicalNode);
  if (!root || typeof root !== "object") return "";
  return renderNode(root);
}
