/**
 * Serializes JSON-LD for Google Rich Results (server component).
 * Escapes characters that could break out of a script context when data includes user/CMS strings.
 */
function serializeJsonLd(data: Record<string, unknown> | Record<string, unknown>[]) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function JsonLd(props: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(props.data) }}
    />
  );
}
