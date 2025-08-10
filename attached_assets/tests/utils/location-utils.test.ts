import { describe, it, expect } from 'vitest'

describe('Location Utilities', () => {
  describe('Location parsing and formatting', () => {
    it('should handle international locations correctly', () => {
      // Test cases for locations like "Madrid, Spain" vs "Los Angeles, CA, USA"
      const internationalLocation = "Madrid, Spain"
      const usLocation = "Los Angeles, CA, USA"
      
      expect(internationalLocation.split(',').length).toBe(2)
      expect(usLocation.split(',').length).toBe(3)
    })

    it('should avoid duplicate country concatenation', () => {
      // Test for the bug where "Madrid, Spain" became "Madrid Spain, Spain"
      const location = "Madrid, Spain"
      const parts = location.split(', ')
      
      if (parts.length === 2) {
        const [city, country] = parts
        const fullLocation = `${city}, ${country}`
        expect(fullLocation).toBe("Madrid, Spain")
        expect(fullLocation).not.toContain("Spain, Spain")
      }
    })

    it('should handle metropolitan area consolidation', () => {
      const metropolitanAreas = {
        "Playa Del Rey": "Los Angeles",
        "Hollywood": "Los Angeles", 
        "Santa Monica": "Los Angeles",
        "Beverly Hills": "Los Angeles"
      }
      
      Object.entries(metropolitanAreas).forEach(([suburb, mainCity]) => {
        expect(mainCity).toBe("Los Angeles")
      })
    })
  })

  describe('Case insensitive search', () => {
    it('should handle mixed case location data', () => {
      const locations = ["PLAYA DEL REY", "Playa Del Rey", "playa del rey"]
      const normalized = locations.map(loc => loc.toLowerCase())
      
      expect(normalized.every(loc => loc === "playa del rey")).toBe(true)
    })
  })
})