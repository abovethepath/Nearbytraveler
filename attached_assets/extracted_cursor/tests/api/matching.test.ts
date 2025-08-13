import { describe, it, expect } from 'vitest'
import request from 'supertest'

describe('Matching Algorithm Tests', () => {
  describe('GET /api/users/:id/matches', () => {
    it('should return matches with compatibility scores', async () => {
      const response = await request('http://localhost:5000')
        .get('/api/users/1/matches')
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      
      if (response.body.length > 0) {
        const match = response.body[0]
        expect(match).toHaveProperty('user')
        expect(match).toHaveProperty('compatibility')
        expect(match.compatibility).toHaveProperty('score')
        expect(match.compatibility.score).toBeGreaterThan(0)
        expect(match.compatibility.score).toBeLessThanOrEqual(100)
      }
    })

    it('should include shared interests in compatibility data', async () => {
      const response = await request('http://localhost:5000')
        .get('/api/users/1/matches')
        .expect(200)

      response.body.forEach((match: any) => {
        if (match.compatibility.sharedInterests) {
          expect(Array.isArray(match.compatibility.sharedInterests)).toBe(true)
        }
      })
    })
  })

  describe('User categorization in search', () => {
    it('should correctly categorize locals vs travelers', async () => {
      const response = await request('http://localhost:5000')
        .get('/api/users/search?location=Los Angeles')
        .expect(200)

      response.body.forEach((user: any) => {
        // Verify user type logic is correct
        if (user.hometownCity && user.hometownCity.toLowerCase().includes('los angeles')) {
          // Should be categorized as local
          expect(['local', 'current_local']).toContain(user.userType?.toLowerCase())
        }
      })
    })
  })

  describe('Sexual preference compatibility', () => {
    it('should have valid sexual preference values', async () => {
      const response = await request('http://localhost:5000')
        .get('/api/users')
        .expect(200)

      const validPreferences = ['Straight', 'Gay', 'Lesbian', 'Bisexual', 'Pansexual', 'Asexual']
      
      response.body.forEach((user: any) => {
        if (user.sexualPreference) {
          expect(validPreferences).toContain(user.sexualPreference)
        }
      })
    })
  })
})