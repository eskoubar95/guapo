/**
 * Serializes JSON-LD for Google Rich Results (server component).
 */
export function JsonLd(props: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(props.data) }}
    />
  );
}
