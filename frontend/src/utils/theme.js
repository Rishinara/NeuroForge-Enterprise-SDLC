// frontend/src/utils/theme.js

export const THEME_MODE_KEY = 'neuroforge_theme_mode'

/**
 * Returns the currently active theme mode preference: 'light' | 'dark' | 'system'
 */
export function getThemeMode() {
  return localStorage.getItem(THEME_MODE_KEY) || 'light'
}

/**
 * Resolves whether dark mode should be enabled given the current mode preference.
 */
export function isDarkActive(mode = getThemeMode()) {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  if (mode === 'system') {
    return typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return false
}

/**
 * Applies the given theme mode ('light', 'dark', 'system') to the DOM and persists to localStorage.
 */
export function applyThemeMode(mode) {
  const targetMode = (mode === 'dark' || mode === 'system') ? mode : 'light'
  
  try {
    localStorage.setItem(THEME_MODE_KEY, targetMode)
  } catch (e) {
    console.error('Failed to persist theme mode to localStorage', e)
  }

  const dark = isDarkActive(targetMode)
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  // Notify components and listeners across the app
  window.dispatchEvent(
    new CustomEvent('neuroforge_theme_changed', {
      detail: { mode: targetMode, isDark: dark },
    })
  )
}

/**
 * Initializes the theme system on application startup and registers listeners for system theme changes.
 */
export function initTheme() {
  const currentMode = getThemeMode()
  const dark = isDarkActive(currentMode)
  
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  // Listen for OS/system dark mode changes if mode is set to 'system'
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = (e) => {
      if (getThemeMode() === 'system') {
        if (e.matches) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        window.dispatchEvent(
          new CustomEvent('neuroforge_theme_changed', {
            detail: { mode: 'system', isDark: e.matches },
          })
        )
      }
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange)
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemChange)
    }
  }

  // Listen for storage events across tabs/windows
  window.addEventListener('storage', (e) => {
    if (e.key === THEME_MODE_KEY) {
      const newMode = e.newValue || 'light'
      const dark = isDarkActive(newMode)
      if (dark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      window.dispatchEvent(
        new CustomEvent('neuroforge_theme_changed', {
          detail: { mode: newMode, isDark: dark },
        })
      )
    }
  })
}
