const DELIMITERS = [
  { left: '$$', right: '$$', display: true },
  { left: '\\[', right: '\\]', display: true },
  { left: '$', right: '$', display: false },
  { left: '\\(', right: '\\)', display: false },
]

let autoRenderModulePromise

async function loadAutoRender() {
  if (!autoRenderModulePromise)
    autoRenderModulePromise = import('katex/contrib/auto-render')

  const module = await autoRenderModulePromise
  return module.default
}

export async function renderMathContent(element) {
  if (typeof window === 'undefined' || !element)
    return

  const renderMathInElement = await loadAutoRender()

  renderMathInElement(element, {
    delimiters: DELIMITERS,
    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'],
    throwOnError: false,
    strict: 'ignore',
  })
}
