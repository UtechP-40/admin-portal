/// <reference types="cypress" />

// Custom commands for admin portal testing

Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`)
})

Cypress.Commands.add('findByTestId', (testId: string) => {
  return cy.find(`[data-testid="${testId}"]`)
})

Cypress.Commands.add('waitForApiCall', (alias: string) => {
  return cy.wait(alias).then((interception) => {
    expect(interception.response?.statusCode).to.be.oneOf([200, 201, 204])
  })
})

Cypress.Commands.add('checkAccessibility', () => {
  cy.injectAxe()
  cy.checkA11y(undefined, {
    rules: {
      'color-contrast': { enabled: true },
      'focus-order-semantics': { enabled: true },
      'keyboard-navigation': { enabled: true },
    },
  })
})

declare global {
  namespace Cypress {
    interface Chainable {
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>
      findByTestId(testId: string): Chainable<JQuery<HTMLElement>>
      waitForApiCall(alias: string): Chainable<any>
      checkAccessibility(): Chainable<void>
    }
  }
}