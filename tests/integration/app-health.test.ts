import { describe, it, expect } from 'vitest'
import request from 'supertest'

describe('App Health & Performance Tests', () => {
  describe('Critical API Response Times', () => {
    it('should respond to user requests within 2 seconds', async () => {
      const start = Date.now()
      const response = await request('http://localhost:5000')
        .get('/api/users')
        .timeout(2000)
      
      const duration = Date.now() - start
      expect(response.status).toBe(200)
      expect(duration).toBeLessThan(2000)
    })

    it('should handle connection status checks quickly', async () => {
      const start = Date.now()
      const response = await request('http://localhost:5000')
        .get('/api/connections/status/1/2')
        .timeout(1000)
      
      const duration = Date.now() - start
      expect(duration).toBeLessThan(1000)
    })
  })

  describe('Data Consistency Checks', () => {
    it('should never return undefined user names', async () => {
      const response = await request('http://localhost:5000')
        .get('/api/users')
        .expect(200)

      response.body.forEach((user: any) => {
        expect(user.username).toBeDefined()
        expect(user.username).not.toBe(null)
        expect(user.username).not.toBe('')
        expect(user.name).toBeDefined()
        expect(user.name).not.toBe(null)
      })
    })

    it('should have consistent location data formats', async () => {
      const response = await request('http://localhost:5000')
        .get('/api/users')
        .expect(200)

      response.body.forEach((user: any) => {
        if (user.hometownCity) {
          // Should not have duplicate country names
          expect(user.location).not.toMatch(/Spain, Spain|Italy, Italy|France, France/)
        }
      })
    })
  })

  describe('Critical Feature Tests', () => {
    it('should handle connection requests without crashes', async () => {
      const response = await request('http://localhost:5000')
        .post('/api/connections')
        .send({
          requesterId: 1,
          requesteeId: 2,
          status: 'pending'
        })

      // Should not crash, regardless of response
      expect([200, 201, 400, 409]).toContain(response.status)
    })

    it('should validate connection status updates', async () => {
      const response = await request('http://localhost:5000')
        .put('/api/connections/1')
        .send({
          status: 'declined' // Invalid status - should be rejected
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toContain('status')
    })
  })
})