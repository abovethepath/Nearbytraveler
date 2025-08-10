import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface SafetyAlert {
  id: string;
  type: 'weather' | 'crime' | 'health' | 'transportation' | 'cultural' | 'emergency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendations: string[];
  location: string;
  timestamp: Date;
  isActive: boolean;
}

export interface SafetyCheckIn {
  userId: number;
  location: string;
  timestamp: Date;
  status: 'safe' | 'help_needed' | 'emergency';
  message?: string;
  coordinates?: { lat: number; lng: number };
}

export interface SafetyProfile {
  userId: number;
  emergencyContacts: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
  medicalInfo?: {
    allergies: string[];
    medications: string[];
    conditions: string[];
  };
  travelStyle: 'cautious' | 'moderate' | 'adventurous';
  checkInFrequency: number; // hours
  notifications: {
    sms: boolean;
    email: boolean;
    push: boolean;
  };
}

export class SafetyCompanionService {
  /**
   * Generate location-specific safety recommendations
   */
  async generateSafetyRecommendations(
    destination: string,
    userProfile: any,
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
  ): Promise<{
    recommendations: string[];
    alerts: SafetyAlert[];
    emergencyInfo: any;
  }> {
    try {
      const prompt = this.buildSafetyPrompt(destination, userProfile, timeOfDay);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a travel safety expert providing comprehensive safety guidance for solo travelers. Focus on practical, actionable advice specific to the destination and time of day."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const safetyData = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        recommendations: safetyData.recommendations || [],
        alerts: this.transformToSafetyAlerts(safetyData.alerts || [], destination),
        emergencyInfo: safetyData.emergencyInfo || {}
      };
    } catch (error) {
      console.error('Error generating safety recommendations:', error);
      return this.getFallbackSafetyInfo(destination);
    }
  }

  /**
   * Analyze area safety based on current conditions
   */
  async analyzeAreaSafety(
    location: string,
    coordinates?: { lat: number; lng: number }
  ): Promise<{
    safetyScore: number;
    riskFactors: string[];
    recommendations: string[];
  }> {
    try {
      const prompt = `Analyze the safety conditions for: ${location}
      
      Provide a comprehensive safety assessment including:
      1. Overall safety score (1-10, where 10 is very safe)
      2. Current risk factors to be aware of
      3. Specific safety recommendations
      
      Consider factors like:
      - Local crime rates and common incidents
      - Current weather conditions
      - Transportation safety
      - Cultural considerations
      - Time-sensitive risks
      
      Respond in JSON format: {
        "safetyScore": number,
        "riskFactors": ["factor1", "factor2"],
        "recommendations": ["rec1", "rec2"],
        "timeOfDayRisks": {
          "morning": ["risk1"],
          "evening": ["risk1", "risk2"],
          "night": ["risk1", "risk2", "risk3"]
        }
      }`;

      const response = await openAI.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Error analyzing area safety:', error);
      return {
        safetyScore: 7,
        riskFactors: ['Limited local information available'],
        recommendations: ['Stay aware of your surroundings', 'Keep emergency contacts handy']
      };
    }
  }

  /**
   * Generate emergency action plan
   */
  async generateEmergencyPlan(
    destination: string,
    userProfile: any
  ): Promise<{
    emergencyContacts: any[];
    procedures: any[];
    localResources: any[];
  }> {
    try {
      const prompt = `Create a comprehensive emergency action plan for a solo traveler in ${destination}.
      
      Include:
      1. Local emergency contact numbers (police, medical, fire, tourist police)
      2. Step-by-step emergency procedures
      3. Local hospitals and medical facilities
      4. Embassy/consulate information if international
      5. Safe transportation options
      6. 24-hour services available
      
      Respond in JSON format with: {
        "emergencyContacts": [{"service": "Police", "number": "xxx", "description": "xxx"}],
        "procedures": [{"situation": "Medical Emergency", "steps": ["step1", "step2"]}],
        "localResources": [{"name": "Hospital Name", "address": "xxx", "phone": "xxx", "available24h": true}]
      }`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Error generating emergency plan:', error);
      return this.getFallbackEmergencyPlan(destination);
    }
  }

  /**
   * Smart check-in recommendations
   */
  getCheckInRecommendations(
    location: string,
    lastCheckIn?: Date,
    riskLevel: 'low' | 'medium' | 'high' = 'medium'
  ): {
    shouldCheckIn: boolean;
    urgency: 'normal' | 'suggested' | 'overdue';
    message: string;
  } {
    if (!lastCheckIn) {
      return {
        shouldCheckIn: true,
        urgency: 'suggested',
        message: 'Start your safety check-ins for this trip'
      };
    }

    const hoursSinceLastCheckIn = (Date.now() - lastCheckIn.getTime()) / (1000 * 60 * 60);
    const thresholds = {
      low: 8,
      medium: 4,
      high: 2
    };

    const threshold = thresholds[riskLevel];

    if (hoursSinceLastCheckIn > threshold * 1.5) {
      return {
        shouldCheckIn: true,
        urgency: 'overdue',
        message: `Your last check-in was ${Math.round(hoursSinceLastCheckIn)} hours ago. Please check in now.`
      };
    } else if (hoursSinceLastCheckIn > threshold) {
      return {
        shouldCheckIn: true,
        urgency: 'suggested',
        message: 'Time for a safety check-in'
      };
    }

    return {
      shouldCheckIn: false,
      urgency: 'normal',
      message: `Next check-in recommended in ${Math.round(threshold - hoursSinceLastCheckIn)} hours`
    };
  }

  private buildSafetyPrompt(
    destination: string,
    userProfile: any,
    timeOfDay?: string
  ): string {
    return `Generate comprehensive safety recommendations for a solo traveler in ${destination}${timeOfDay ? ` during ${timeOfDay}` : ''}.

    Traveler Profile:
    - Travel experience: ${userProfile.travelStyle || 'moderate'}
    - Gender: ${userProfile.gender || 'not specified'}
    - Age range: ${userProfile.ageRange || 'not specified'}
    
    Provide specific, actionable recommendations covering:
    1. Personal safety and situational awareness
    2. Transportation safety
    3. Accommodation security
    4. Local scams and common risks
    5. Cultural considerations and etiquette
    6. Emergency preparedness
    7. Communication and check-in strategies
    
    Respond in JSON format: {
      "recommendations": ["specific recommendation 1", "specific recommendation 2"],
      "alerts": [{"type": "crime", "severity": "medium", "title": "Alert Title", "description": "Alert details", "recommendations": ["action1", "action2"]}],
      "emergencyInfo": {"police": "xxx", "medical": "xxx", "embassy": "xxx"}
    }`;
  }

  private transformToSafetyAlerts(alerts: any[], location: string): SafetyAlert[] {
    return alerts.map((alert, index) => ({
      id: `alert_${Date.now()}_${index}`,
      type: alert.type || 'general',
      severity: alert.severity || 'medium',
      title: alert.title || 'Safety Alert',
      description: alert.description || '',
      recommendations: alert.recommendations || [],
      location,
      timestamp: new Date(),
      isActive: true
    }));
  }

  private getFallbackSafetyInfo(destination: string) {
    return {
      recommendations: [
        'Stay aware of your surroundings at all times',
        'Keep emergency contacts and important documents easily accessible',
        'Share your itinerary with trusted contacts',
        'Use reputable transportation services',
        'Trust your instincts and avoid situations that feel unsafe'
      ],
      alerts: [],
      emergencyInfo: {
        general: 'Contact local emergency services immediately if needed',
        tip: 'Research local emergency numbers upon arrival'
      }
    };
  }

  private getFallbackEmergencyPlan(destination: string) {
    return {
      emergencyContacts: [
        { service: 'Local Emergency', number: '911 or local equivalent', description: 'Primary emergency response' }
      ],
      procedures: [
        { situation: 'Emergency', steps: ['Stay calm', 'Call local emergency services', 'Contact your emergency contacts'] }
      ],
      localResources: [
        { name: 'Tourist Information', address: 'Contact local tourist office', phone: 'Research upon arrival', available24h: false }
      ]
    };
  }
}

export const safetyCompanionService = new SafetyCompanionService();