import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWind3,
  transformerDirectives,
} from 'unocss'

export default defineConfig({
  presets: [
    presetIcons({
      extraProperties: {
        display: 'inline-block',
        height: '1.2em',
        width: '1.2em',
        'vertical-align': 'text-bottom',
      },
    }),
    presetAttributify(),
    presetWind3(),
    presetTypography(),
  ],
  transformers: [transformerDirectives()],
  shortcuts: [
    {
      'panel-shell':
        'rounded-3xl border border-[var(--c-border)] bg-[var(--c-panel)]/86 shadow-[0_24px_80px_rgba(19,31,42,0.08)] backdrop-blur-xl',
      'subtle-link':
        'text-[var(--c-muted)] transition-colors duration-300 hover:text-[var(--c-text)]',
      'section-title':
        'text-12px uppercase tracking-[0.36em] text-[var(--c-soft)] font-mono',
      'bg-base': 'bg-white dark:bg-black',
      'color-base': 'text-black dark:text-white',
      'border-base': 'border-[#8884]',
    },
    [/^btn-(\w+)$/, ([, color]) => `op50 px2.5 py1 transition-all duration-200 ease-out no-underline! hover:(op100 text-${color} bg-${color}/10) border border-base! rounded`],
  ],
  theme: {
    colors: {
      accent: 'var(--c-accent)',
      text: 'var(--c-text)',
      muted: 'var(--c-muted)',
      soft: 'var(--c-soft)',
      border: 'var(--c-border)',
      panel: 'var(--c-panel)',
    },
  },
})
