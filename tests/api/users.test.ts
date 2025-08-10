import { describe, it, expect } from 'vitest'
import request from 'supertest'

describe('User API Endpoints', () => {
  describe('GET /api/users', () => {
    it('should return users with complete profile data', async () => {
      const response = await request('http://localhost:5000')
        .get('/api/users')
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      
      if (response.body.length > 0) {
        const user = response.body[0]
        expect(user).toHaveProperty('id')
        expect(user).toHaveProperty('username')
        expect(user).toHaveProperty('name')
        // Ensure no undefined values that cause display issues
        expect(user.username).not.toBe(undefined)
        expect(user.name).not.toBe(undefined)
      }
    })
  })

  describe('User categorization', () => {
    it('should properly categorize users as locals vs travelers', async () => {
      const response = await request('http://localhost:5000')
        .get('/api/users/search?location=Los Angeles&userType=local')
        .expect(200)

      response.body.forEach((user: any) => {
        // Locals should have hometown matching search location
        expect(user.hometownCity?.toLowerCase()).toContain('los angeles')
      })
    })
  })

  describe('Profile image handling', () => {
    it('should handle users without profile images gracefully', async () => {
      const response = await request('http://localhost:5000')
        .get('/api/users')
        .expect(200)

      response.body.forEach((user: any) => {
        // Either has profileImage or falls back to initials
        if (!user.profileImage) {
          expect(user.name).toBeDefined()
          const initials = user.name.split(' ').map((n: string) => n[0]).join('')
          expect(initials.length).toBeGreaterThan(0)
        }
      })
    })
  })
})