/**
 * Convert plain text to Payload Lexical richText structure.
 * Used when syncing Medusa description to Payload.
 */
export function plainTextToLexical(text: string | null | undefined): Record<string, unknown> | undefined {
  const trimmed = (text ?? '').trim()
  if (!trimmed) return undefined

  const paragraphs = trimmed.split(/\n\n+/).filter((p) => p.trim())
  if (paragraphs.length === 0) return undefined

  const children = paragraphs.map((para) => ({
    type: 'paragraph',
    children: [{
      type: 'text',
      text: para.trim(),
      format: '',
      mode: 'normal',
      style: '',
      detail: 0,
      version: 1,
    }],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  }))

  return {
    root: {
      children,
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}
