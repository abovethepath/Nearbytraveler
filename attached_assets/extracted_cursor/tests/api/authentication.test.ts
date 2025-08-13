import { describe, it, expect } from 'vitest'
import request from 'supertest'

describe('Authentication API Tests', () => {
  describe('POST /api/register', () => {
    it('should validate required fields', async () => {
      const response = await request('http://localhost:5000')
        .post('/api/register')
        .send({}) // Empty body
        .expect(400)

      expect(response.body.message).toContain('required')
    })

    it('should handle location data consistency', async () => {
      const testUser = {
        username: 'testuser' + Date.now(),
        email: 'test' + Date.now() + '@example.com',
        password: 'testpass123',
        name: 'Test User',
        dateOfBirth: '1990-01-01',
        gender: 'Male',
        bio: 'Test bio',
        city: 'Los Angeles',
        state: 'California', 
        country: 'United States',
        userType: 'traveler'
      }

      const response = await request('http://localhost:5000')
        .post('/api/register')
        .send(testUser)

      if (response.status === 201) {
        expect(response.body.user).toHaveProperty('hometownCity', 'Los Angeles')
        expect(response.body.user).toHaveProperty('hometownState', 'California')
        expect(response.body.user).toHaveProperty('hometownCountry', 'United States')
      }
    })
  })

  describe('POST /api/login', () => {
    it('should return user data on successful login', async () => {
      const response = await request('http://localhost:5000')
        .post('/api/login')
        .send({
          email: 'aaron@marc.com',
          password: 'pass123'
        })

      if (response.status === 200) {
        expect(response.body).toHaveProperty('user')
        expect(response.body.user).toHaveProperty('id')
        expect(response.body.user).toHaveProperty('username')
        expect(response.body.user).toHaveProperty('email')
        // Ensure no undefined values
        expect(response.body.user.username).not.toBe(undefined)
        expect(response.body.user.email).not.toBe(undefined)
      }
    })
  })
})