describe('Database Management', () => {
  beforeEach(() => {
    cy.cleanTestData()
    cy.seedTestData()
    cy.loginAsAdmin()
  })

  describe('Collection Browser', () => {
    it('should display all collections', () => {
      cy.visit('/database')
      
      cy.contains('users').should('be.visible')
      cy.contains('games').should('be.visible')
      cy.contains('rooms').should('be.visible')
    })

    it('should show collection statistics', () => {
      cy.visit('/database')
      
      cy.getByTestId('collection-users').within(() => {
        cy.contains('1000 documents').should('be.visible')
        cy.contains('2.5MB').should('be.visible')
      })
    })

    it('should navigate to collection details', () => {
      cy.visit('/database')
      
      cy.getByTestId('collection-users').click()
      
      cy.url().should('include', '/database/users')
      cy.contains('Users Collection').should('be.visible')
    })
  })

  describe('Data Table Operations', () => {
    beforeEach(() => {
      cy.visit('/database/users')
    })

    it('should display data in table format', () => {
      cy.getByTestId('data-table').should('be.visible')
      cy.get('table').should('contain', 'Name')
      cy.get('table').should('contain', 'Email')
      cy.get('table').should('contain', 'Role')
    })

    it('should support pagination', () => {
      cy.getByTestId('pagination').should('be.visible')
      cy.contains('1–10 of').should('be.visible')
      
      cy.getByTestId('next-page-button').click()
      cy.contains('11–20 of').should('be.visible')
    })

    it('should support sorting', () => {
      cy.get('th').contains('Name').click()
      
      // Should sort ascending first
      cy.get('tbody tr:first-child').should('contain', 'Alice')
      
      cy.get('th').contains('Name').click()
      
      // Should sort descending
      cy.get('tbody tr:first-child').should('contain', 'Zoe')
    })

    it('should support filtering', () => {
      cy.getByTestId('search-input').type('admin')
      
      cy.get('tbody tr').should('have.length.lessThan', 10)
      cy.get('tbody').should('contain', 'admin')
    })
  })

  describe('Document Operations', () => {
    beforeEach(() => {
      cy.visit('/database/users')
    })

    it('should create new document', () => {
      cy.getByTestId('add-document-button').click()
      
      cy.getByTestId('document-editor').should('be.visible')
      cy.getByTestId('name-input').type('New User')
      cy.getByTestId('email-input').type('newuser@test.com')
      cy.getByTestId('role-select').select('user')
      
      cy.getByTestId('save-button').click()
      
      cy.contains('Document created successfully').should('be.visible')
      cy.get('tbody').should('contain', 'New User')
    })

    it('should edit existing document', () => {
      cy.get('tbody tr:first-child').within(() => {
        cy.getByTestId('edit-button').click()
      })
      
      cy.getByTestId('document-editor').should('be.visible')
      cy.getByTestId('name-input').clear().type('Updated User')
      
      cy.getByTestId('save-button').click()
      
      cy.contains('Document updated successfully').should('be.visible')
      cy.get('tbody').should('contain', 'Updated User')
    })

    it('should delete document with confirmation', () => {
      cy.get('tbody tr:first-child').within(() => {
        cy.getByTestId('delete-button').click()
      })
      
      cy.getByTestId('confirm-dialog').should('be.visible')
      cy.contains('Are you sure you want to delete').should('be.visible')
      
      cy.getByTestId('confirm-delete-button').click()
      
      cy.contains('Document deleted successfully').should('be.visible')
    })

    it('should validate document fields', () => {
      cy.getByTestId('add-document-button').click()
      
      cy.getByTestId('save-button').click()
      
      cy.contains('Name is required').should('be.visible')
      cy.contains('Email is required').should('be.visible')
    })
  })

  describe('Bulk Operations', () => {
    beforeEach(() => {
      cy.visit('/database/users')
    })

    it('should select multiple documents', () => {
      cy.get('tbody tr:nth-child(1) input[type="checkbox"]').check()
      cy.get('tbody tr:nth-child(2) input[type="checkbox"]').check()
      
      cy.getByTestId('selected-count').should('contain', '2 selected')
      cy.getByTestId('bulk-actions').should('be.visible')
    })

    it('should bulk delete selected documents', () => {
      cy.get('tbody tr:nth-child(1) input[type="checkbox"]').check()
      cy.get('tbody tr:nth-child(2) input[type="checkbox"]').check()
      
      cy.getByTestId('bulk-delete-button').click()
      
      cy.getByTestId('confirm-dialog').should('be.visible')
      cy.getByTestId('confirm-delete-button').click()
      
      cy.contains('2 documents deleted successfully').should('be.visible')
    })

    it('should bulk export selected documents', () => {
      cy.get('tbody tr:nth-child(1) input[type="checkbox"]').check()
      cy.get('tbody tr:nth-child(2) input[type="checkbox"]').check()
      
      cy.getByTestId('bulk-export-button').click()
      
      cy.getByTestId('export-dialog').should('be.visible')
      cy.getByTestId('format-select').select('json')
      cy.getByTestId('export-confirm-button').click()
      
      cy.contains('Export completed').should('be.visible')
    })
  })

  describe('Query Builder', () => {
    beforeEach(() => {
      cy.visit('/database/users')
      cy.getByTestId('query-builder-button').click()
    })

    it('should build simple query', () => {
      cy.getByTestId('query-builder').should('be.visible')
      
      cy.getByTestId('add-condition-button').click()
      cy.getByTestId('field-select').select('role')
      cy.getByTestId('operator-select').select('equals')
      cy.getByTestId('value-input').type('admin')
      
      cy.getByTestId('execute-query-button').click()
      
      cy.get('tbody tr').should('have.length.greaterThan', 0)
      cy.get('tbody').should('contain', 'admin')
    })

    it('should build complex query with multiple conditions', () => {
      cy.getByTestId('add-condition-button').click()
      cy.getByTestId('field-select').select('role')
      cy.getByTestId('operator-select').select('equals')
      cy.getByTestId('value-input').type('user')
      
      cy.getByTestId('add-condition-button').click()
      cy.get('[data-testid="field-select"]:last').select('createdAt')
      cy.get('[data-testid="operator-select"]:last').select('greater_than')
      cy.get('[data-testid="value-input"]:last').type('2024-01-01')
      
      cy.getByTestId('execute-query-button').click()
      
      cy.get('tbody tr').should('have.length.greaterThan', 0)
    })

    it('should save and load queries', () => {
      cy.getByTestId('add-condition-button').click()
      cy.getByTestId('field-select').select('role')
      cy.getByTestId('operator-select').select('equals')
      cy.getByTestId('value-input').type('admin')
      
      cy.getByTestId('save-query-button').click()
      cy.getByTestId('query-name-input').type('Admin Users Query')
      cy.getByTestId('save-confirm-button').click()
      
      cy.contains('Query saved successfully').should('be.visible')
      
      cy.getByTestId('load-query-button').click()
      cy.contains('Admin Users Query').click()
      
      cy.getByTestId('value-input').should('have.value', 'admin')
    })
  })

  describe('Data Export', () => {
    beforeEach(() => {
      cy.visit('/database/users')
    })

    it('should export collection as JSON', () => {
      cy.getByTestId('export-button').click()
      
      cy.getByTestId('export-dialog').should('be.visible')
      cy.getByTestId('format-select').select('json')
      cy.getByTestId('export-confirm-button').click()
      
      cy.contains('Export completed').should('be.visible')
      // In a real test, you might verify the download
    })

    it('should export collection as CSV', () => {
      cy.getByTestId('export-button').click()
      
      cy.getByTestId('export-dialog').should('be.visible')
      cy.getByTestId('format-select').select('csv')
      cy.getByTestId('export-confirm-button').click()
      
      cy.contains('Export completed').should('be.visible')
    })

    it('should export with custom fields', () => {
      cy.getByTestId('export-button').click()
      
      cy.getByTestId('export-dialog').should('be.visible')
      cy.getByTestId('custom-fields-checkbox').check()
      
      cy.getByTestId('field-name').uncheck()
      cy.getByTestId('field-email').check()
      cy.getByTestId('field-role').check()
      
      cy.getByTestId('export-confirm-button').click()
      
      cy.contains('Export completed').should('be.visible')
    })
  })

  describe('Accessibility', () => {
    it('should be accessible on database page', () => {
      cy.visit('/database')
      cy.checkAccessibility()
    })

    it('should be accessible on collection page', () => {
      cy.visit('/database/users')
      cy.checkAccessibility()
    })

    it('should support keyboard navigation in data table', () => {
      cy.visit('/database/users')
      
      cy.get('table').focus()
      cy.focused().type('{downarrow}')
      cy.focused().should('be.visible')
    })
  })
})