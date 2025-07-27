import { http, HttpResponse } from 'msw'
import { mockUser, mockGameRoom, mockAnalyticsData, mockSocketConnection } from '../utils'

const API_BASE_URL = 'http://localhost:4000/api'

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/auth/login`, () => {
    return HttpResponse.json({
      user: mockUser,
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
    })
  }),

  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({ message: 'Logged out successfully' })
  }),

  http.get(`${API_BASE_URL}/auth/me`, () => {
    return HttpResponse.json(mockUser)
  }),

  // Database endpoints
  http.get(`${API_BASE_URL}/database/collections`, () => {
    return HttpResponse.json([
      { name: 'users', count: 1000, size: '2.5MB' },
      { name: 'games', count: 500, size: '1.2MB' },
      { name: 'rooms', count: 50, size: '0.5MB' },
    ])
  }),

  http.get(`${API_BASE_URL}/database/collections/:name`, ({ params }) => {
    const { name } = params
    const mockData = {
      users: [mockUser],
      games: [{ id: '1', name: 'Test Game', status: 'completed' }],
      rooms: [mockGameRoom],
    }
    return HttpResponse.json({
      data: mockData[name as keyof typeof mockData] || [],
      total: 100,
      page: 1,
      limit: 10,
    })
  }),

  // Analytics endpoints
  http.get(`${API_BASE_URL}/analytics/dashboard`, () => {
    return HttpResponse.json(mockAnalyticsData)
  }),

  http.get(`${API_BASE_URL}/analytics/users`, () => {
    return HttpResponse.json({
      registrations: [
        { date: '2024-01-01', count: 50 },
        { date: '2024-01-02', count: 75 },
      ],
      engagement: [
        { date: '2024-01-01', activeUsers: 200 },
        { date: '2024-01-02', activeUsers: 250 },
      ],
    })
  }),

  // Socket monitoring endpoints
  http.get(`${API_BASE_URL}/socket/connections`, () => {
    return HttpResponse.json([mockSocketConnection])
  }),

  http.get(`${API_BASE_URL}/socket/rooms`, () => {
    return HttpResponse.json([mockGameRoom])
  }),

  // System monitoring endpoints
  http.get(`${API_BASE_URL}/monitoring/system`, () => {
    return HttpResponse.json({
      cpu: 45.2,
      memory: 68.5,
      disk: 32.1,
      network: {
        incoming: 1024,
        outgoing: 2048,
      },
      uptime: 86400,
    })
  }),

  // API testing endpoints
  http.get(`${API_BASE_URL}/api-testing/endpoints`, () => {
    return HttpResponse.json([
      {
        method: 'GET',
        path: '/api/users',
        description: 'Get all users',
        parameters: [],
      },
      {
        method: 'POST',
        path: '/api/users',
        description: 'Create a new user',
        parameters: [
          { name: 'username', type: 'string', required: true },
          { name: 'email', type: 'string', required: true },
        ],
      },
    ])
  }),

  // Error handling
  http.get(`${API_BASE_URL}/error-test`, () => {
    return HttpResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }),
]