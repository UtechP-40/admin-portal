// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log
Cypress.on('window:before:load', (win) => {
  cy.stub(win.console, 'error').as('consoleError')
  cy.stub(win.console, 'warn').as('consoleWarn')
})

// Custom command to login as admin
Cypress.Commands.add('loginAsAdmin', () => {
  cy.visit('/login')
  cy.get('[data-testid="email-input"]').type('admin@test.com')
  cy.get('[data-testid="password-input"]').type('password123')
  cy.get('[data-testid="login-button"]').click()
  cy.url().should('include', '/dashboard')
})

// Custom command to seed test data
Cypress.Commands.add('seedTestData', () => {
  cy.request('POST', `${Cypress.env('apiUrl')}/test/seed`, {
    users: 10,
    games: 5,
    rooms: 3,
  })
})

// Custom command to clean test data
Cypress.Commands.add('cleanTestData', () => {
  cy.request('DELETE', `${Cypress.env('apiUrl')}/test/clean`)
})

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>
      seedTestData(): Chainable<void>
      cleanTestData(): Chainable<void>
    }
  }
}