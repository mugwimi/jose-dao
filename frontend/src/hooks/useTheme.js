import { useState, useEffect } from 'react'
import { themes } from '../theme'

export function useTheme() {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('jose-dao-theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    localStorage.setItem('jose-dao-theme', mode)
    document.body.style.background = themes[mode].bg
  }, [mode])

  const toggleTheme = () => {
    setMode(function (prev) {
      return prev === 'dark' ? 'light' : 'dark'
    })
  }

  return { mode, theme: themes[mode], toggleTheme }
}