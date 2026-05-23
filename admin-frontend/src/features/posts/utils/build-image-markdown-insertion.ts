export interface ImageMarkdownInsertionOptions {
  altText: string
  imageUrl: string
  selectionEnd: number
  selectionStart: number
  source: string
}

export interface ImageMarkdownInsertionResult {
  nextValue: string
  selectionEnd: number
  selectionStart: number
}

export function buildImageMarkdownInsertion({
  altText,
  imageUrl,
  selectionEnd,
  selectionStart,
  source,
}: ImageMarkdownInsertionOptions): ImageMarkdownInsertionResult {
  const safeSelectionStart = Math.max(0, Math.min(selectionStart, source.length))
  const safeSelectionEnd = Math.max(safeSelectionStart, Math.min(selectionEnd, source.length))
  const normalizedUrl = imageUrl.trim()
  const normalizedAltText = altText.trim() || 'image'
  const snippet = `![${normalizedAltText}](${normalizedUrl})`

  const needsLeadingNewline = safeSelectionStart > 0 && source[safeSelectionStart - 1] !== '\n'
  const needsTrailingNewline = safeSelectionEnd < source.length && source[safeSelectionEnd] !== '\n'
  const insertedText = `${needsLeadingNewline ? '\n' : ''}${snippet}${needsTrailingNewline ? '\n' : ''}`

  const nextValue =
    source.slice(0, safeSelectionStart) +
    insertedText +
    source.slice(safeSelectionEnd)

  const snippetStart = safeSelectionStart + (needsLeadingNewline ? 1 : 0)
  const altTextStart = snippetStart + 2
  const altTextEnd = altTextStart + normalizedAltText.length

  return {
    nextValue,
    selectionStart: altTextStart,
    selectionEnd: altTextEnd,
  }
}
