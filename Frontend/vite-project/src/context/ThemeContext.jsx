import React, { createContext, useState, useContext, useEffect } from 'react'

const ThemeContext = createContext({})

export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light')
  const [animations, setAnimations] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)

  // Load theme from localStorage on mount - ALWAYS LIGHT
  useEffect(() => {
    // Force light theme - never use dark mode
    const savedAnimations = localStorage.getItem('animations') !== 'false'
    const savedReducedMotion = localStorage.getItem('reducedMotion') === 'true'

    setTheme('light') // Always light
    setAnimations(savedAnimations)
    setReducedMotion(savedReducedMotion)

    // Remove any dark class and apply light
    document.documentElement.classList.remove('dark')
    document.documentElement.className = 'light'
    document.documentElement.classList.toggle('no-animations', !savedAnimations)
    document.documentElement.classList.toggle('reduced-motion', savedReducedMotion)
  }, [])

  // Toggle theme - DISABLED, always light
  const toggleTheme = () => {
    // Dark mode disabled - always stay light
    console.log('Dark mode is disabled in this version')
  }

  // Toggle animations
  const toggleAnimations = () => {
    const newAnimations = !animations
    setAnimations(newAnimations)
    localStorage.setItem('animations', newAnimations)
    document.documentElement.classList.toggle('no-animations', !newAnimations)
  }

  // Toggle reduced motion
  const toggleReducedMotion = () => {
    const newReducedMotion = !reducedMotion
    setReducedMotion(newReducedMotion)
    localStorage.setItem('reducedMotion', newReducedMotion)
    document.documentElement.classList.toggle('reduced-motion', newReducedMotion)
  }

  // Set custom theme
  const setCustomTheme = (primaryColor, secondaryColor) => {
    const root = document.documentElement
    root.style.setProperty('--color-primary', primaryColor)
    root.style.setProperty('--color-secondary', secondaryColor)

    localStorage.setItem('customTheme', JSON.stringify({ primaryColor, secondaryColor }))
  }

  // Reset to default theme
  const resetTheme = () => {
    const root = document.documentElement
    root.style.removeProperty('--color-primary')
    root.style.removeProperty('--color-secondary')

    localStorage.removeItem('customTheme')
  }

  const value = {
    theme,
    animations,
    reducedMotion,
    toggleTheme,
    toggleAnimations,
    toggleReducedMotion,
    setCustomTheme,
    resetTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}