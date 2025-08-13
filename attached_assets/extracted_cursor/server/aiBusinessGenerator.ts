import Anthropic from '@anthropic-ai/sdk';
import { db } from './db';
import { users } from '@shared/schema';
import { eq, and, gte, lte, count } from 'drizzle-orm';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface AIBusiness {
  name: string;
  description: string;
  category: string;
  businessType: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  phone: string;
  website: string;
  specialty: string;
  rating: number;
  priceRange: string;
  tags: string[];
}

export class AIBusinessGenerator {
  /**
   * Generate authentic local businesses for a specific city using AI
   */
  async generateBusinessesForLocation(
    city: string, 
    state: string = '', 
    country: string = ''
  ): Promise<AIBusiness[]> {
    try {
      const prompt = this.createBusinessPrompt(city, state, country);
      
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: `You are a local business expert who generates authentic, realistic business listings for cities worldwide. Focus on creating businesses that reflect the unique character, culture, and economic landscape of each specific location.`,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const businesses = this.parseBusinessResponse(content.text, city, state, country);
        console.log(`Generated ${businesses.length} businesses for ${city}, ${state}, ${country}`);
        return businesses;
      }
      
      return [];
    } catch (error) {
      console.error('Error generating businesses with AI:', error);
      return [];
    }
  }

  /**
   * Create city-specific business generation prompt
   */
  private createBusinessPrompt(city: string, state: string, country: string): string {
    const location = `${city}${state ? `, ${state}` : ''}${country ? `, ${country}` : ''}`;
    const countryStyle = this.getCountryBusinessStyle(country);
    
    return `Generate 6 authentic local businesses for ${location} that reflect the city's unique character and economy.

${countryStyle}

For ${city}, consider:
- Local cultural landmarks and neighborhoods
- Traditional industries and modern economic sectors  
- Regional cuisine specialties and dining culture
- Popular tourist attractions and local hangouts
- Seasonal activities and climate-appropriate services
- Local demographics and community needs
- Historic districts and modern developments
- Transportation hubs and business districts

Create businesses across these categories:
1. Food & Dining (restaurants, cafes, specialty food)
2. Tourism & Recreation (tours, activities, entertainment)
3. Retail & Shopping (local goods, crafts, specialty stores)
4. Services (wellness, photography, consulting)
5. Culture & Arts (galleries, studios, cultural experiences)
6. Sports & Fitness (gyms, outdoor activities, sports)

Format as JSON array with objects containing:
{
  "name": "Authentic business name reflecting local character",
  "description": "2-sentence description highlighting what makes it special",
  "category": "Main category (Food, Tourism, Retail, Services, Culture, Sports)",
  "businessType": "Specific type (Restaurant, Tour Company, Gallery, etc.)",
  "street": "Realistic street address with actual street names when possible",
  "city": "${city}",
  "state": "${state}",
  "country": "${country}",
  "zipcode": "Realistic postal code for the area",
  "phone": "Local format phone number",
  "website": "realistic domain name",
  "specialty": "What they're known for (1-3 words)",
  "rating": 4.1-4.9 (realistic high ratings),
  "priceRange": "$", "$$", "$$$", or "$$$$",
  "tags": ["tag1", "tag2", "tag3"] (3-5 relevant tags)
}

Make each business feel authentic to ${location} with realistic names, addresses, and specialties that locals would actually know and visit.`;
  }

  /**
   * Get country-specific business style guidelines
   */
  private getCountryBusinessStyle(country: string): string {
    const styles: { [key: string]: string } = {
      'United States': 'Focus on American business culture: family-owned establishments, chain alternatives, local entrepreneurship, diverse ethnic cuisines, outdoor recreation, craft industries, and community-focused services.',
      'Italy': 'Emphasize Italian business traditions: family trattorias, artisan workshops, fashion boutiques, historical tour companies, wine bars, art galleries, and traditional craft businesses.',
      'France': 'Highlight French business culture: bistros and cafes, boutique shops, cultural experiences, wine and cheese specialists, artistic services, and elegant hospitality businesses.',
      'Japan': 'Feature Japanese business elements: traditional and modern fusion, precision craftsmanship, seasonal specialties, tea culture, technology integration, and meticulous service standards.',
      'United Kingdom': 'Include British business characteristics: pubs and gastropubs, traditional shops, heritage tours, afternoon tea services, and community-centered businesses.',
      'Germany': 'Showcase German business culture: beer gardens and breweries, precision services, outdoor activities, traditional crafts, efficiency-focused businesses, and engineering-related services.',
      'Spain': 'Reflect Spanish business style: tapas bars, flamenco experiences, siesta-respecting hours, family businesses, regional specialties, and vibrant social gathering places.',
      'Netherlands': 'Include Dutch business elements: bike-friendly services, canal tours, cheese and flower specialists, sustainable practices, and innovative local solutions.'
    };
    
    return styles[country] || 'Create businesses that reflect the local culture, economy, and community character of the region.';
  }

  /**
   * Parse AI response into business objects
   */
  private parseBusinessResponse(response: string, city: string, state: string, country: string): AIBusiness[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('No JSON array found in AI response');
        return [];
      }

      const businesses = JSON.parse(jsonMatch[0]);
      return businesses.map((business: any) => ({
        name: business.name || 'Local Business',
        description: business.description || 'A local business serving the community.',
        category: business.category || 'Services',
        businessType: business.businessType || 'Local Service',
        street: business.street || '123 Main St',
        city: city,
        state: state,
        country: country,
        zipcode: business.zipcode || '00000',
        phone: business.phone || '(555) 123-4567',
        website: business.website || 'www.example.com',
        specialty: business.specialty || 'Local Service',
        rating: Math.min(4.9, Math.max(4.1, business.rating || 4.5)),
        priceRange: business.priceRange || '$$',
        tags: Array.isArray(business.tags) ? business.tags.slice(0, 5) : ['local', 'service']
      }));
    } catch (error) {
      console.error('Error parsing business AI response:', error);
      return [];
    }
  }

  /**
   * Create AI-generated businesses in the database for a location if none exist
   */
  async ensureBusinessesForLocation(city: string, state: string = '', country: string = ''): Promise<void> {
    try {
      // Check if businesses already exist for this location
      const existingBusinesses = await db
        .select({ count: count() })
        .from(businesses)
        .where(
          and(
            eq(businesses.city, city),
            eq(businesses.state, state || ''),
            eq(businesses.country, country || '')
          )
        );
      
      const existingCount = existingBusinesses[0] || { count: 0 };

      // If we have fewer than 3 businesses, generate more  
      if (existingCount.count < 3) {
        console.log(`Generating businesses for ${city}, ${state}, ${country} (current count: ${existingCount.count})`);
        
        const aiBusinesses = await this.generateBusinessesForLocation(city, state, country);
        
        if (aiBusinesses.length > 0) {
          // Create business users and their offers
          for (const aiBusiness of aiBusinesses) {
            try {
              // Create business user account
              const [businessUser] = await db.insert(businesses).values({
                username: aiBusiness.name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.random().toString(36).substr(2, 4),
                email: `contact@${aiBusiness.website}`,
                password: 'placeholder_password', // Will not be used for login
                name: aiBusiness.name,
                userType: 'business',
                bio: aiBusiness.description,
                businessName: aiBusiness.name,
                businessType: aiBusiness.businessType,
                businessDescription: aiBusiness.description,
                street: aiBusiness.street,
                city: aiBusiness.city,
                state: aiBusiness.state,
                country: aiBusiness.country,
                zipcode: aiBusiness.zipcode,
                phone: aiBusiness.phone,
                website: aiBusiness.website,
                specialty: aiBusiness.specialty,
                rating: aiBusiness.rating,
                priceRange: aiBusiness.priceRange,
                tags: aiBusiness.tags,
                isAIGenerated: true,
                profileImage: this.getBusinessImage(aiBusiness.category),
                createdAt: new Date()
              }).returning();

              // Create a sample business offer for each business
              if (businessUser) {
                await db.insert(businessOffers).values({
                  businessId: businessUser.id,
                  title: `Special ${aiBusiness.specialty} Experience`,
                  description: `Discover authentic ${aiBusiness.specialty.toLowerCase()} at ${aiBusiness.name}. ${aiBusiness.description}`,
                  category: aiBusiness.category,
                  discountType: 'percentage',
                  discountValue: 15 + Math.floor(Math.random() * 20), // 15-35% discount
                  originalPrice: this.getPriceForCategory(aiBusiness.category, aiBusiness.priceRange),
                  city: aiBusiness.city,
                  state: aiBusiness.state,
                  country: aiBusiness.country,
                  targetAudience: 'both',
                  validFrom: new Date(),
                  validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
                  maxRedemptions: 50 + Math.floor(Math.random() * 100),
                  currentRedemptions: Math.floor(Math.random() * 10),
                  viewCount: Math.floor(Math.random() * 200),
                  isActive: true,
                  createdAt: new Date()
                });
              }
            } catch (error) {
              console.error(`Error creating business ${aiBusiness.name}:`, error);
            }
          }
          
          console.log(`Successfully created ${aiBusinesses.length} AI-generated businesses for ${city}`);
        }
      }
    } catch (error) {
      console.error('Error ensuring businesses for location:', error);
    }
  }

  /**
   * Get appropriate image URL for business category
   */
  private getBusinessImage(category: string): string {
    const images: { [key: string]: string } = {
      'Food': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
      'Tourism': 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop',
      'Retail': 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=300&fit=crop',
      'Services': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
      'Culture': 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
      'Sports': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop'
    };
    
    return images[category] || images['Services'];
  }

  /**
   * Get realistic pricing for business category and price range
   */
  private getPriceForCategory(category: string, priceRange: string): number {
    const basePrices: { [key: string]: number } = {
      'Food': 25,
      'Tourism': 50,
      'Retail': 35,
      'Services': 75,
      'Culture': 40,
      'Sports': 30
    };

    const multipliers: { [key: string]: number } = {
      '$': 0.6,
      '$$': 1.0,
      '$$$': 1.8,
      '$$$$': 3.0
    };

    const basePrice = basePrices[category] || 40;
    const multiplier = multipliers[priceRange] || 1.0;
    
    return Math.round(basePrice * multiplier);
  }
}

export const aiBusinessGenerator = new AIBusinessGenerator();