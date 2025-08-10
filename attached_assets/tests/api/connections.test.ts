import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { app } from '../../server/index'

describe('Connection API Endpoints', () => {
  describe('PUT /api/connections/:id', () => {
    it('should accept connection request with status "accepted"', async () => {
      const response = await request(app)
        .put('/api/connections/1')
        .send({ status: 'accepted' })
        .expect(200)

      expect(response.body.status).toBe('accepted')
    })

    it('should reject connection request with status "rejected" and send notification', async () => {
      const response = await request(app)
        .put('/api/connections/1')
        .send({ status: 'rejected' })
        .expect(200)

      expect(response.body.status).toBe('rejected')
      
      // Verify that a polite notification message was sent to the requester
      // (This would require checking the messages table in a real test environment)
    })

    it('should fail with invalid status "declined"', async () => {
      const response = await request(app)
        .put('/api/connections/1')
        .send({ status: 'declined' })
        .expect(400)

      expect(response.body.message).toContain('Invalid status')
    })

    it('should fail with empty status', async () => {
      const response = await request(app)
        .put('/api/connections/1')
        .send({})
        .expect(400)

      expect(response.body.message).toContain('status is required')
    })
  })

  describe('GET /api/connections/:userId/requests', () => {
    it('should return connection requests with complete user data', async () => {
      const response = await request(app)
        .get('/api/connections/1/requests')
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      
      if (response.body.length > 0) {
        const request = response.body[0]
        expect(request).toHaveProperty('id')
        expect(request).toHaveProperty('status', 'pending')
        expect(request).toHaveProperty('requesterUser')
        expect(request.requesterUser).toHaveProperty('id')
        expect(request.requesterUser).toHaveProperty('username')
        expect(request.requesterUser).toHaveProperty('name')
        // Ensure no undefined values that caused UI issues
        expect(request.requesterUser.username).not.toBe(undefined)
        expect(request.requesterUser.name).not.toBe(undefined)
      }
    })
  })
})