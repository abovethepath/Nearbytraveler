import Anthropic from '@anthropic-ai/sdk';
import { db } from '../db';
import { 
  recommendations, 
  userRecommendationInteractions, 
  recommendationRequests,
  userPreferences,
  users,
  type Recommendation,
  type InsertRecommendation,
  type InsertRecommendationRequest,
  type User
} from '@shared/schema';
import { eq, and, desc, asc, sql, inArray } from 'drizzle-orm';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface RecommendationContext {
  user: User;
  location: string;
  duration?: string;
  budget?: string;
  groupSize?: number;
  categories?: string[];
  preferences?: any;
}

interface AIRecommendationResponse {
  recommendations: {
    title: string;
    description: string;
    category: string;
    type: string;
    priceRange: string;
    duration: string;
    localTips: string;
    bestTimeToVisit: string;
    reasoning: string;
  }[];
  summary: string;
}

export class RecommendationEngine {
  
  async generatePersonalizedRecommendations(context: RecommendationContext): Promise<AIRecommendationResponse> {
    const { user, location, duration, budget, groupSize, categories, preferences } = context;
    
    // Get user's past interactions to understand preferences
    const userInteractions = await db
      .select()
      .from(userRecommendationInteractions)
      .leftJoin(recommendations, eq(userRecommendationInteractions.recommendationId, recommendations.id))
      .where(eq(userRecommendationInteractions.userId, user.id))
      .orderBy(desc(userRecommendationInteractions.createdAt))
      .limit(20);

    // Get user preferences
    const userPrefs = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    const prompt = this.buildRecommendationPrompt(context, userInteractions, userPrefs[0]);
    
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }],
        system: `You are a local travel expert and recommendation engine. Generate personalized travel recommendations based on user preferences, location, and context. Always provide practical, authentic suggestions with local insights.

Return your response as valid JSON with this structure:
{
  "recommendations": [
    {
      "title": "Specific place or activity name",
      "description": "Detailed description with why it's recommended",
      "category": "cultural|adventure|food|nightlife|nature|shopping|historical",
      "type": "place|activity|restaurant|event|accommodation|hidden_gem",
      "priceRange": "$|$$|$$$|$$$$",
      "duration": "1-2 hours|half day|full day",
      "localTips": "Insider tips and practical advice",
      "bestTimeToVisit": "Specific timing recommendations",
      "reasoning": "Why this matches the user's profile"
    }
  ],
  "summary": "Brief overview of the recommendations"
}`
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const aiResponse = JSON.parse(content.text) as AIRecommendationResponse;
        return aiResponse;
      }
      
      throw new Error('Invalid response format from AI');
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      throw new Error('Failed to generate personalized recommendations');
    }
  }

  private buildRecommendationPrompt(
    context: RecommendationContext, 
    userInteractions: any[], 
    preferences: any
  ): string {
    const { user, location, duration, budget, groupSize, categories } = context;
    
    let prompt = `Generate personalized travel recommendations for a user visiting ${location}.

User Profile:
- Name: ${user.name}
- Interests: ${user.interests?.join(', ') || 'Not specified'}
- Travel Style: ${user.travelStyle?.join(', ') || 'Not specified'}
- Preferred Activities: ${user.preferredActivities?.join(', ') || 'Not specified'}
- Countries Visited: ${user.countriesVisited?.length || 0} countries
- Languages: ${user.languagesSpoken?.join(', ') || 'Not specified'}

Trip Context:
- Location: ${location}
- Duration: ${duration || 'Not specified'}
- Budget Range: ${budget || 'Not specified'}
- Group Size: ${groupSize || 1} people
- Requested Categories: ${categories?.join(', ') || 'All categories'}`;

    if (preferences) {
      prompt += `\n\nUser Preferences:
- Preferred Categories: ${preferences.preferredCategories?.join(', ') || 'None specified'}
- Budget Range: ${preferences.budgetRange || 'Not specified'}
- Crowd Preference: ${preferences.crowdPreference || 'Neutral'}
- Time Preferences: ${preferences.timePreferences?.join(', ') || 'Flexible'}
- Accessibility Needs: ${preferences.accessibilityNeeds?.join(', ') || 'None'}
- Dietary Restrictions: ${preferences.dietaryRestrictions?.join(', ') || 'None'}`;
    }

    if (userInteractions.length > 0) {
      const likedCategories = userInteractions
        .filter(interaction => interaction.user_recommendation_interactions.interactionType === 'like')
        .map(interaction => interaction.recommendations?.category)
        .filter(Boolean);
      
      const visitedTypes = userInteractions
        .filter(interaction => interaction.user_recommendation_interactions.interactionType === 'visited')
        .map(interaction => interaction.recommendations?.type)
        .filter(Boolean);

      if (likedCategories.length > 0) {
        prompt += `\n\nPast Preferences (categories they liked): ${likedCategories.join(', ')}`;
      }
      
      if (visitedTypes.length > 0) {
        prompt += `\nPast Activity Types (they've visited): ${visitedTypes.join(', ')}`;
      }
    }

    prompt += `\n\nPlease provide 5-8 personalized recommendations that match this user's profile and trip context. Focus on authentic, local experiences that align with their interests and preferences. Include practical tips and timing advice.`;

    return prompt;
  }

  async createRecommendationRequest(
    userId: number, 
    location: string, 
    options: {
      categories?: string[];
      preferences?: any;
      duration?: string;
      groupSize?: number;
      budget?: string;
    }
  ): Promise<number> {
    const [request] = await db
      .insert(recommendationRequests)
      .values({
        userId,
        location,
        categories: options.categories || [],
        preferences: options.preferences || {},
        travelDuration: options.duration,
        groupSize: options.groupSize || 1,
        budget: options.budget,
        status: 'pending'
      })
      .returning();

    // Process the request asynchronously
    this.processRecommendationRequest(request.id).catch(console.error);
    
    return request.id;
  }

  private async processRecommendationRequest(requestId: number): Promise<void> {
    try {
      // Update status to processing
      await db
        .update(recommendationRequests)
        .set({ status: 'processing', updatedAt: new Date() })
        .where(eq(recommendationRequests.id, requestId));

      // Get the request details
      const [request] = await db
        .select()
        .from(recommendationRequests)
        .leftJoin(users, eq(recommendationRequests.userId, users.id))
        .where(eq(recommendationRequests.id, requestId));

      if (!request || !request.users) {
        throw new Error('Request or user not found');
      }

      const context: RecommendationContext = {
        user: request.users,
        location: request.recommendation_requests.location,
        duration: request.recommendation_requests.travelDuration || undefined,
        budget: request.recommendation_requests.budget || undefined,
        groupSize: request.recommendation_requests.groupSize || 1,
        categories: request.recommendation_requests.categories || [],
        preferences: request.recommendation_requests.preferences || {}
      };

      // Generate AI recommendations
      const aiResponse = await this.generatePersonalizedRecommendations(context);

      // Store the recommendations in the database
      for (const rec of aiResponse.recommendations) {
        await db.insert(recommendations).values({
          userId: null, // System-generated
          type: rec.type,
          title: rec.title,
          description: rec.description,
          location: request.recommendation_requests.location,
          city: this.extractCity(request.recommendation_requests.location),
          country: this.extractCountry(request.recommendation_requests.location),
          category: rec.category,
          priceRange: rec.priceRange,
          duration: rec.duration,
          localTips: rec.localTips,
          bestTimeToVisit: rec.bestTimeToVisit,
          isActive: true
        });
      }

      // Update request with AI response and mark as completed
      await db
        .update(recommendationRequests)
        .set({ 
          status: 'completed', 
          aiResponse: aiResponse,
          updatedAt: new Date() 
        })
        .where(eq(recommendationRequests.id, requestId));

    } catch (error) {
      console.error('Error processing recommendation request:', error);
      
      // Mark request as failed
      await db
        .update(recommendationRequests)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(recommendationRequests.id, requestId));
    }
  }

  async getRecommendationsForLocation(
    userId: number, 
    location: string, 
    options: {
      category?: string;
      type?: string;
      budget?: string;
      limit?: number;
    } = {}
  ): Promise<Recommendation[]> {
    const { category, type, budget, limit = 10 } = options;
    
    let query = db
      .select()
      .from(recommendations)
      .where(
        and(
          eq(recommendations.isActive, true),
          sql`LOWER(${recommendations.location}) LIKE LOWER(${`%${location}%`}) OR LOWER(${recommendations.city}) LIKE LOWER(${`%${location}%`})`
        )
      );

    if (category) {
      query = query.where(eq(recommendations.category, category));
    }
    
    if (type) {
      query = query.where(eq(recommendations.type, type));
    }
    
    if (budget) {
      query = query.where(eq(recommendations.priceRange, budget));
    }

    const results = await query
      .orderBy(desc(recommendations.rating), desc(recommendations.createdAt))
      .limit(limit);

    // Calculate personalized scores based on user preferences
    return this.scoreRecommendationsForUser(userId, results);
  }

  private async scoreRecommendationsForUser(userId: number, recs: Recommendation[]): Promise<Recommendation[]> {
    // Get user data and past interactions
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return recs;

    const userInteractions = await db
      .select()
      .from(userRecommendationInteractions)
      .leftJoin(recommendations, eq(userRecommendationInteractions.recommendationId, recommendations.id))
      .where(eq(userRecommendationInteractions.userId, userId));

    // Simple scoring algorithm based on user interests and past behavior
    return recs.map(rec => {
      let score = rec.rating || 3; // Base score

      // Boost score if category matches user interests
      if (user.interests?.some(interest => 
        rec.category?.toLowerCase().includes(interest.toLowerCase()) ||
        rec.tags?.some(tag => tag.toLowerCase().includes(interest.toLowerCase()))
      )) {
        score += 1;
      }

      // Boost score if user has liked similar recommendations
      const likedSimilar = userInteractions.filter(interaction => 
        interaction.user_recommendation_interactions.interactionType === 'like' &&
        interaction.recommendations?.category === rec.category
      ).length;
      
      score += likedSimilar * 0.5;

      return { ...rec, personalizedScore: Math.min(5, score) };
    }).sort((a, b) => (b.personalizedScore || 0) - (a.personalizedScore || 0));
  }

  async recordInteraction(
    userId: number, 
    recommendationId: number, 
    interactionType: string, 
    data: {
      rating?: number;
      notes?: string;
      visitDate?: Date;
      wouldRecommend?: boolean;
    } = {}
  ): Promise<void> {
    await db.insert(userRecommendationInteractions).values({
      userId,
      recommendationId,
      interactionType,
      rating: data.rating,
      notes: data.notes,
      visitDate: data.visitDate,
      wouldRecommend: data.wouldRecommend
    });

    // Update recommendation rating if user provided a rating
    if (data.rating) {
      await this.updateRecommendationRating(recommendationId);
    }
  }

  private async updateRecommendationRating(recommendationId: number): Promise<void> {
    const ratings = await db
      .select()
      .from(userRecommendationInteractions)
      .where(
        and(
          eq(userRecommendationInteractions.recommendationId, recommendationId),
          sql`${userRecommendationInteractions.rating} IS NOT NULL`
        )
      );

    if (ratings.length > 0) {
      const avgRating = ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length;
      
      await db
        .update(recommendations)
        .set({ rating: Math.round(avgRating * 10) / 10 }) // Round to 1 decimal
        .where(eq(recommendations.id, recommendationId));
    }
  }

  private extractCity(location: string): string {
    // Simple city extraction - in real app, use geolocation service
    const parts = location.split(',');
    return parts[0].trim();
  }

  private extractCountry(location: string): string {
    // Simple country extraction - in real app, use geolocation service
    const parts = location.split(',');
    return parts[parts.length - 1].trim();
  }

  async getPopularRecommendations(location: string, limit: number = 10): Promise<Recommendation[]> {
    return await db
      .select()
      .from(recommendations)
      .where(
        and(
          eq(recommendations.isActive, true),
          sql`LOWER(${recommendations.location}) LIKE LOWER(${`%${location}%`}) OR LOWER(${recommendations.city}) LIKE LOWER(${`%${location}%`})`
        )
      )
      .orderBy(desc(recommendations.rating), desc(sql`(
        SELECT COUNT(*) FROM ${userRecommendationInteractions} 
        WHERE ${userRecommendationInteractions.recommendationId} = ${recommendations.id}
        AND ${userRecommendationInteractions.interactionType} IN ('like', 'save', 'visited')
      )`))
      .limit(limit);
  }

  async getTrendingRecommendations(limit: number = 10): Promise<Recommendation[]> {
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.isActive, true))
      .orderBy(desc(sql`(
        SELECT COUNT(*) FROM ${userRecommendationInteractions} 
        WHERE ${userRecommendationInteractions.recommendationId} = ${recommendations.id}
        AND ${userRecommendationInteractions.createdAt} > ${lastWeek}
        AND ${userRecommendationInteractions.interactionType} IN ('like', 'save', 'visited')
      )`))
      .limit(limit);
  }
}

export const recommendationEngine = new RecommendationEngine();