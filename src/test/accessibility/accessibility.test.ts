import { describe, it, expect } from 'vitest'
import { render } from '../utils'
import { axe, toHaveNoViolations } from 'jest-axe'
import { App } from '../../App'
import { LoginPage } from '../../pages/LoginPage'
import { DashboardPage } from '../../pages/DashboardPage'
import { DatabasePage } from '../../pages/DatabasePage'

expect.extend(toHaveNoViolations)

describe('Accessibility Tests', () => {
  describe('Core Pages', () => {
    it('should have no accessibility violations on login page', async () => {
      const { container } = render(<LoginPage />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations on dashboard page', async () => {
      const { container } = render(<DashboardPage />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations on database page', async () => {
      const { container } = render(<DatabasePage />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Color Contrast', () => {
    it('should meet WCAG AA color contrast requirements', async () => {
      const { container } = render(<App />)
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      })
      expect(results).toHaveNoViolations()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation', async () => {
      const { container } = render(<App />)
      const results = await axe(container, {
        rules: {
          'keyboard': { enabled: true },
          'focus-order-semantics': { enabled: true },
        },
      })
      expect(results).toHaveNoViolations()
    })
  })

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels and roles', async () => {
      const { container } = render(<App />)
      const results = await axe(container, {
        rules: {
          'aria-allowed-attr': { enabled: true },
          'aria-required-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'role-img-alt': { enabled: true },
        },
      })
      expect(results).toHaveNoViolations()
    })
  })

  describe('Form Accessibility', () => {
    it('should have proper form labels and descriptions', async () => {
      const { container } = render(<LoginPage />)
      const results = await axe(container, {
        rules: {
          'label': { enabled: true },
          'label-title-only': { enabled: true },
          'form-field-multiple-labels': { enabled: true },
        },
      })
      expect(results).toHaveNoViolations()
    })
  })

  describe('Image Accessibility', () => {
    it('should have proper alt text for images', async () => {
      const { container } = render(<App />)
      const results = await axe(container, {
        rules: {
          'image-alt': { enabled: true },
          'image-redundant-alt': { enabled: true },
        },
      })
      expect(results).toHaveNoViolations()
    })
  })

  describe('Heading Structure', () => {
    it('should have proper heading hierarchy', async () => {
      const { container } = render(<DashboardPage />)
      const results = await axe(container, {
        rules: {
          'heading-order': { enabled: true },
          'empty-heading': { enabled: true },
        },
      })
      expect(results).toHaveNoViolations()
    })
  })

  describe('Link Accessibility', () => {
    it('should have descriptive link text', async () => {
      const { container } = render(<App />)
      const results = await axe(container, {
        rules: {
          'link-name': { enabled: true },
          'link-in-text-block': { enabled: true },
        },
      })
      expect(results).toHaveNoViolations()
    })
  })

  describe('Table Accessibility', () => {
    it('should have proper table headers and structure', async () => {
      const { container } = render(<DatabasePage />)
      const results = await axe(container, {
        rules: {
          'table-fake-caption': { enabled: true },
          'td-headers-attr': { enabled: true },
          'th-has-data-cells': { enabled: true },
        },
      })
      expect(results).toHaveNoViolations()
    })
  })

  describe('Focus Management', () => {
    it('should manage focus properly in modals and dialogs', async () => {
      const { container } = render(<App />)
      const results = await axe(container, {
        rules: {
          'focus-order-semantics': { enabled: true },
          'tabindex': { enabled: true },
        },
      })
      expect(results).toHaveNoViolations()
    })
  })
})