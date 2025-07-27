import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { server } from '../mocks/server'
import { authService } from '../../services/authService'

describe('Authentication Integration Tests', () => {
  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  describe('Login Flow', () => {
    it('should successfully login with valid credentials', async () => {
      const credentials = {
        email: 'admin@test.com',
        password: 'password123',
      }

      const result = await authService.login(credentials)

      expect(result).toEqual({
        user: expect.objectContaining({
          id: '1',
          username: 'admin',
          email: 'admin@test.com',
        }),
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      })
    })

    it('should handle login failure with invalid credentials', async () => {
      const credentials = {
        email: 'invalid@test.com',
        password: 'wrongpassword',
      }

      await expect(authService.login(credentials)).rejects.toThrow()
    })

    it('should store token after successful login', async () => {
      const credentials = {
        email: 'admin@test.com',
        password: 'password123',
      }

      await authService.login(credentials)

      expect(localStorage.getItem('adminToken')).toBe('mock-jwt-token')
      expect(localStorage.getItem('adminRefreshToken')).toBe('mock-refresh-token')
    })
  })

  describe('Token Management', () => {
    it('should refresh token when expired', async () => {
      // Set up expired token
      localStorage.setItem('adminToken', 'expired-token')
      localStorage.setItem('adminRefreshToken', 'valid-refresh-token')

      const newToken = await authService.refreshToken()

      expect(newToken).toBe('new-mock-jwt-token')
      expect(localStorage.getItem('adminToken')).toBe('new-mock-jwt-token')
    })

    it('should logout and clear tokens', async () => {
      localStorage.setItem('adminToken', 'mock-jwt-token')
      localStorage.setItem('adminRefreshToken', 'mock-refresh-token')

      await authService.logout()

      expect(localStorage.getItem('adminToken')).toBeNull()
      expect(localStorage.getItem('adminRefreshToken')).toBeNull()
    })
  })

  describe('User Profile', () => {
    beforeEach(() => {
      localStorage.setItem('adminToken', 'mock-jwt-token')
    })

    it('should fetch current user profile', async () => {
      const user = await authService.getCurrentUser()

      expect(user).toEqual(
        expect.objectContaining({
          id: '1',
          username: 'admin',
          email: 'admin@test.com',
          role: 'super_admin',
        })
      )
    })

    it('should handle unauthorized access', async () => {
      localStorage.removeItem('adminToken')

      await expect(authService.getCurrentUser()).rejects.toThrow('Unauthorized')
    })
  })

  describe('Permission Validation', () => {
    beforeEach(() => {
      localStorage.setItem('adminToken', 'mock-jwt-token')
    })

    it('should validate user permissions', async () => {
      const hasPermission = await authService.hasPermission('read')

      expect(hasPermission).toBe(true)
    })

    it('should deny access for missing permissions', async () => {
      const hasPermission = await authService.hasPermission('super_admin')

      expect(hasPermission).toBe(false)
    })
  })
})