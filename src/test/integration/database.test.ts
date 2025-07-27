import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { server } from '../mocks/server'
import { databaseService } from '../../services/databaseService'

describe('Database Integration Tests', () => {
  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  beforeEach(() => {
    localStorage.setItem('adminToken', 'mock-jwt-token')
  })

  describe('Collection Management', () => {
    it('should fetch all collections', async () => {
      const collections = await databaseService.getCollections()

      expect(collections).toEqual([
        { name: 'users', count: 1000, size: '2.5MB' },
        { name: 'games', count: 500, size: '1.2MB' },
        { name: 'rooms', count: 50, size: '0.5MB' },
      ])
    })

    it('should fetch collection data with pagination', async () => {
      const result = await databaseService.getCollectionData('users', {
        page: 1,
        limit: 10,
      })

      expect(result).toEqual({
        data: expect.any(Array),
        total: 100,
        page: 1,
        limit: 10,
      })
    })

    it('should handle collection not found', async () => {
      await expect(
        databaseService.getCollectionData('nonexistent')
      ).rejects.toThrow('Collection not found')
    })
  })

  describe('Document Operations', () => {
    it('should create a new document', async () => {
      const newDocument = {
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      }

      const created = await databaseService.createDocument('users', newDocument)

      expect(created).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          ...newDocument,
        })
      )
    })

    it('should update an existing document', async () => {
      const updates = {
        name: 'Updated Name',
        email: 'updated@example.com',
      }

      const updated = await databaseService.updateDocument('users', '1', updates)

      expect(updated).toEqual(
        expect.objectContaining({
          id: '1',
          ...updates,
        })
      )
    })

    it('should delete a document', async () => {
      await expect(
        databaseService.deleteDocument('users', '1')
      ).resolves.not.toThrow()
    })

    it('should handle document not found for update', async () => {
      await expect(
        databaseService.updateDocument('users', 'nonexistent', {})
      ).rejects.toThrow('Document not found')
    })
  })

  describe('Bulk Operations', () => {
    it('should perform bulk insert', async () => {
      const documents = [
        { name: 'User 1', email: 'user1@test.com' },
        { name: 'User 2', email: 'user2@test.com' },
      ]

      const result = await databaseService.bulkInsert('users', documents)

      expect(result).toEqual({
        inserted: 2,
        failed: 0,
        errors: [],
      })
    })

    it('should perform bulk update', async () => {
      const updates = [
        { id: '1', data: { name: 'Updated User 1' } },
        { id: '2', data: { name: 'Updated User 2' } },
      ]

      const result = await databaseService.bulkUpdate('users', updates)

      expect(result).toEqual({
        updated: 2,
        failed: 0,
        errors: [],
      })
    })

    it('should perform bulk delete', async () => {
      const ids = ['1', '2', '3']

      const result = await databaseService.bulkDelete('users', ids)

      expect(result).toEqual({
        deleted: 3,
        failed: 0,
        errors: [],
      })
    })
  })

  describe('Query Builder', () => {
    it('should execute custom query', async () => {
      const query = {
        collection: 'users',
        filter: { role: 'admin' },
        sort: { name: 1 },
        limit: 10,
      }

      const result = await databaseService.executeQuery(query)

      expect(result).toEqual({
        data: expect.any(Array),
        count: expect.any(Number),
      })
    })

    it('should handle complex aggregation queries', async () => {
      const pipeline = [
        { $match: { role: 'user' } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]

      const result = await databaseService.aggregate('users', pipeline)

      expect(result).toEqual(expect.any(Array))
    })
  })

  describe('Data Export', () => {
    it('should export collection data as JSON', async () => {
      const result = await databaseService.exportData('users', 'json')

      expect(result).toEqual({
        format: 'json',
        data: expect.any(String),
        filename: expect.stringContaining('users'),
      })
    })

    it('should export collection data as CSV', async () => {
      const result = await databaseService.exportData('users', 'csv')

      expect(result).toEqual({
        format: 'csv',
        data: expect.any(String),
        filename: expect.stringContaining('users'),
      })
    })
  })

  describe('Backup and Restore', () => {
    it('should create database backup', async () => {
      const backup = await databaseService.createBackup()

      expect(backup).toEqual({
        id: expect.any(String),
        filename: expect.any(String),
        size: expect.any(Number),
        createdAt: expect.any(String),
      })
    })

    it('should restore from backup', async () => {
      const backupId = 'backup-123'

      await expect(
        databaseService.restoreBackup(backupId)
      ).resolves.not.toThrow()
    })

    it('should list available backups', async () => {
      const backups = await databaseService.listBackups()

      expect(backups).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            filename: expect.any(String),
            size: expect.any(Number),
            createdAt: expect.any(String),
          }),
        ])
      )
    })
  })
})