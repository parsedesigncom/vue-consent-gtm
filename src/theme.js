export const THEME_KEYS = {
  primary: '--pdc-primary',
  primaryContrast: '--pdc-primary-contrast',
  secondaryBg: '--pdc-secondary-bg',
  secondaryText: '--pdc-secondary-text',
  bg: '--pdc-bg',
  text: '--pdc-text',
  muted: '--pdc-muted',
  border: '--pdc-border',
  radius: '--pdc-radius',
  shadow: '--pdc-shadow',
  maxWidth: '--pdc-max-width',
  backdrop: '--pdc-backdrop',
  fabSize: '--pdc-fab-size',
  fabBg: '--pdc-fab-bg',
  fabColor: '--pdc-fab-color',
  fabBorder: '--pdc-fab-border',
  fabShadow: '--pdc-fab-shadow',
  fabHoverBg: '--pdc-fab-hover-bg',
  fabOffset: '--pdc-fab-offset'
}

export function themeToStyles(theme) {
  if (!theme || typeof theme !== 'object') return {}
  const out = {}
  for (const [key, value] of Object.entries(theme)) {
    const cssVar = THEME_KEYS[key]
    if (cssVar && value != null && value !== '') {
      out[cssVar] = String(value)
    }
  }
  return out
}
