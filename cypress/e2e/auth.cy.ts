describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.cleanTestData()
  })

  describe('Login', () => {
    it('should successfully login with valid credentials', () => {
      cy.visit('/login')
      
      cy.getByTestId('email-input').type('admin@test.com')
      cy.getByTestId('password-input').type('password123')
      cy.getByTestId('login-button').click()
      
      cy.url().should('include', '/dashboard')
      cy.contains('Welcome, admin').should('be.visible')
    })

    it('should show error for invalid credentials', () => {
      cy.visit('/login')
      
      cy.getByTestId('email-input').type('invalid@test.com')
      cy.getByTestId('password-input').type('wrongpassword')
      cy.getByTestId('login-button').click()
      
      cy.contains('Invalid credentials').should('be.visible')
      cy.url().should('include', '/login')
    })

    it('should validate required fields', () => {
      cy.visit('/login')
      
      cy.getByTestId('login-button').click()
      
      cy.contains('Email is required').should('be.visible')
      cy.contains('Password is required').should('be.visible')
    })

    it('should handle network errors gracefully', () => {
      cy.intercept('POST', '/api/auth/login', { forceNetworkError: true })
      
      cy.visit('/login')
      cy.getByTestId('email-input').type('admin@test.com')
      cy.getByTestId('password-input').type('password123')
      cy.getByTestId('login-button').click()
      
      cy.contains('Network error').should('be.visible')
    })
  })

  describe('Logout', () => {
    beforeEach(() => {
      cy.loginAsAdmin()
    })

    it('should successfully logout', () => {
      cy.getByTestId('user-menu-button').click()
      cy.getByTestId('logout-button').click()
      
      cy.url().should('include', '/login')
      cy.contains('Login').should('be.visible')
    })

    it('should clear user session on logout', () => {
      cy.getByTestId('user-menu-button').click()
      cy.getByTestId('logout-button').click()
      
      cy.window().then((win) => {
        expect(win.localStorage.getItem('adminToken')).to.be.null
      })
    })
  })

  describe('Session Management', () => {
    it('should redirect to login when accessing protected route without auth', () => {
      cy.visit('/dashboard')
      
      cy.url().should('include', '/login')
    })

    it('should maintain session across page refreshes', () => {
      cy.loginAsAdmin()
      
      cy.reload()
      
      cy.url().should('include', '/dashboard')
      cy.contains('Welcome, admin').should('be.visible')
    })

    it('should handle token expiration', () => {
      cy.loginAsAdmin()
      
      // Mock expired token
      cy.window().then((win) => {
        win.localStorage.setItem('adminToken', 'expired-token')
      })
      
      cy.visit('/dashboard')
      cy.url().should('include', '/login')
    })
  })

  describe('Password Reset', () => {
    it('should show forgot password link', () => {
      cy.visit('/login')
      
      cy.contains('Forgot Password?').should('be.visible')
      cy.contains('Forgot Password?').click()
      
      cy.url().should('include', '/forgot-password')
    })

    it('should send password reset email', () => {
      cy.visit('/forgot-password')
      
      cy.getByTestId('email-input').type('admin@test.com')
      cy.getByTestId('reset-button').click()
      
      cy.contains('Password reset email sent').should('be.visible')
    })
  })

  describe('Accessibility', () => {
    it('should be accessible on login page', () => {
      cy.visit('/login')
      cy.checkAccessibility()
    })

    it('should support keyboard navigation', () => {
      cy.visit('/login')
      
      cy.getByTestId('email-input').focus()
      cy.focused().should('have.attr', 'data-testid', 'email-input')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'data-testid', 'password-input')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'data-testid', 'login-button')
    })
  })
})