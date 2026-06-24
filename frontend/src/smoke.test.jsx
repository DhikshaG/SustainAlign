import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'

describe('frontend smoke test', () => {
  it('should have a valid package.json', async () => {
    const pkg = await import('../package.json', { with: { type: 'json' } })
    expect(pkg).toBeDefined()
    expect(pkg.name).toBe('frontend')
  })

  it('should render the app root without crashing', () => {
    const root = document.createElement('div')
    root.id = 'root'
    document.body.appendChild(root)

    const { createRoot } = await import('react-dom/client')
    const { default: App } = await import('./App.jsx')

    const instance = createRoot(root)
    instance.render(
      <HelmetProvider>
        <App />
      </HelmetProvider>,
    )
    expect(document.querySelector('#root')).toBeTruthy()
  })
})
