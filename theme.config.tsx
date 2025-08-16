import React from 'react'

const config = {
  logo: <span>Tinker Box Documentation</span>,
  project: {
    link: 'https://github.com/your-org/tinker-box', // Update with your actual repo
  },
  docsRepositoryBase: 'https://github.com/your-org/tinker-box/tree/main', // Update with your actual repo
  footer: {
    text: 'Tinker Box Documentation',
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Tinker Box'
    }
  },
  navigation: {
    prev: true,
    next: true
  },
  darkMode: true,
  nextThemes: {
    defaultTheme: 'system'
  }
}

export default config