import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, MapPin, Users, Calendar, DollarSign, Camera, Coffee } from 'lucide-react';

interface TravelPersonalityProfile {
  travelStyle: 'adventure' | 'cultural' | 'relaxation' | 'social' | 'business';
  budgetLevel: 'budget' | 'mid-range' | 'luxury' | 'flexible';
  groupPreference: 'solo' | 'small-group' | 'large-group' | 'flexible';
  communicationStyle: 'frequent' | 'moderate' | 'minimal';
  safetyComfort: 'cautious' | 'moderate' | 'adventurous';
  activityIntensity: 'low' | 'moderate' | 'high';
  culturalInterest: 'low' | 'moderate' | 'high';
  socialPreference: 'introverted' | 'balanced' | 'extroverted';
  planningStyle: 'detailed' | 'moderate' | 'spontaneous';
  accommodationStyle: 'shared' | 'separate' | 'flexible';
  dateFlexibility: 'rigid' | 'moderate' | 'flexible';
  personalityType: string;
  compatibilityScore: number;
}

interface AssessmentQuestion {
  id: string;
  question: string;
  category: keyof TravelPersonalityProfile;
  icon: React.ReactNode;
  options: {
    value: string;
    label: string;
    description: string;
  }[];
}

const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: 'travel_style',
    question: 'What type of travel experience do you prefer most?',
    category: 'travelStyle',
    icon: <MapPin className="w-5 h-5" />,
    options: [
      {
        value: 'adventure',
        label: 'Adventure Seeker',
        description: 'Hiking, extreme sports, off-the-beaten-path exploration'
      },
      {
        value: 'cultural',
        label: 'Cultural Explorer',
        description: 'Museums, historical sites, local traditions and customs'
      },
      {
        value: 'relaxation',
        label: 'Relaxation Focused',
        description: 'Beaches, spas, peaceful environments, slow travel'
      },
      {
        value: 'social',
        label: 'Social Connector',
        description: 'Meeting locals, nightlife, group activities, making friends'
      },
      {
        value: 'business',
        label: 'Business Traveler',
        description: 'Work trips, conferences, networking, efficient travel'
      }
    ]
  },
  {
    id: 'budget_level',
    question: 'What best describes your typical travel budget approach?',
    category: 'budgetLevel',
    icon: <DollarSign className="w-5 h-5" />,
    options: [
      {
        value: 'budget',
        label: 'Budget Conscious',
        description: 'Hostels, street food, free activities, under $50/day'
      },
      {
        value: 'mid-range',
        label: 'Mid-Range Comfort',
        description: 'Nice hotels, restaurants, tours, $50-150/day'
      },
      {
        value: 'luxury',
        label: 'Luxury Experience',
        description: 'Premium accommodations, fine dining, $150+/day'
      },
      {
        value: 'flexible',
        label: 'Budget Flexible',
        description: 'Varies by destination and experience value'
      }
    ]
  },
  {
    id: 'group_preference',
    question: 'How do you prefer to travel and explore?',
    category: 'groupPreference',
    icon: <Users className="w-5 h-5" />,
    options: [
      {
        value: 'solo',
        label: 'Solo Explorer',
        description: 'I prefer traveling and exploring alone'
      },
      {
        value: 'small-group',
        label: 'Small Groups (2-4 people)',
        description: 'Intimate groups for easier coordination'
      },
      {
        value: 'large-group',
        label: 'Large Groups (5+ people)',
        description: 'The more the merrier, group energy is fun'
      },
      {
        value: 'flexible',
        label: 'Situation Dependent',
        description: 'Depends on the activity and destination'
      }
    ]
  },
  {
    id: 'communication_style',
    question: 'How often do you like to communicate when traveling with others?',
    category: 'communicationStyle',
    icon: <Coffee className="w-5 h-5" />,
    options: [
      {
        value: 'frequent',
        label: 'Frequent Communicator',
        description: 'Regular check-ins, sharing experiences constantly'
      },
      {
        value: 'moderate',
        label: 'Moderate Communication',
        description: 'Daily updates, coordinate plans, share highlights'
      },
      {
        value: 'minimal',
        label: 'Minimal Communication',
        description: 'Independent exploration, occasional coordination'
      }
    ]
  },
  {
    id: 'safety_comfort',
    question: 'What is your comfort level with travel risks and safety?',
    category: 'safetyComfort',
    icon: <Camera className="w-5 h-5" />,
    options: [
      {
        value: 'cautious',
        label: 'Safety First',
        description: 'Well-researched destinations, stick to safe areas'
      },
      {
        value: 'moderate',
        label: 'Calculated Risks',
        description: 'Some adventure but with proper precautions'
      },
      {
        value: 'adventurous',
        label: 'Risk Comfortable',
        description: 'Open to unknown areas and spontaneous adventures'
      }
    ]
  },
  {
    id: 'activity_intensity',
    question: 'What pace of activities do you prefer while traveling?',
    category: 'activityIntensity',
    icon: <MapPin className="w-5 h-5" />,
    options: [
      {
        value: 'low',
        label: 'Relaxed Pace',
        description: '1-2 activities per day, plenty of rest time'
      },
      {
        value: 'moderate',
        label: 'Balanced Schedule',
        description: '3-4 activities per day, mix of active and restful'
      },
      {
        value: 'high',
        label: 'Action Packed',
        description: 'Full itinerary, maximize every moment'
      }
    ]
  },
  {
    id: 'cultural_interest',
    question: 'How important is cultural immersion to your travel experience?',
    category: 'culturalInterest',
    icon: <Camera className="w-5 h-5" />,
    options: [
      {
        value: 'low',
        label: 'Surface Level',
        description: 'Main attractions, tourist areas are sufficient'
      },
      {
        value: 'moderate',
        label: 'Balanced Approach',
        description: 'Mix of tourist sites and local experiences'
      },
      {
        value: 'high',
        label: 'Deep Immersion',
        description: 'Local neighborhoods, authentic customs, language learning'
      }
    ]
  },
  {
    id: 'social_preference',
    question: 'How do you recharge and prefer to spend your time?',
    category: 'socialPreference',
    icon: <Users className="w-5 h-5" />,
    options: [
      {
        value: 'introverted',
        label: 'Quiet Reflection',
        description: 'Need alone time, small intimate gatherings'
      },
      {
        value: 'balanced',
        label: 'Mix of Both',
        description: 'Enjoy socializing and quiet time equally'
      },
      {
        value: 'extroverted',
        label: 'Social Energy',
        description: 'Energized by meeting people and group activities'
      }
    ]
  },
  {
    id: 'planning_style',
    question: 'How do you prefer to plan your travel experiences?',
    category: 'planningStyle',
    icon: <Calendar className="w-5 h-5" />,
    options: [
      {
        value: 'detailed',
        label: 'Detailed Planner',
        description: 'Detailed itineraries, reservations, scheduled activities'
      },
      {
        value: 'moderate',
        label: 'Flexible Framework',
        description: 'Basic structure with room for spontaneity'
      },
      {
        value: 'spontaneous',
        label: 'Go with the Flow',
        description: 'Minimal planning, decide activities day-of'
      }
    ]
  },
  {
    id: 'accommodation_style',
    question: 'What accommodation style do you prefer when traveling with others?',
    category: 'accommodationStyle',
    icon: <MapPin className="w-5 h-5" />,
    options: [
      {
        value: 'shared',
        label: 'Shared Spaces',
        description: 'Hostels, shared rooms, communal experiences'
      },
      {
        value: 'separate',
        label: 'Private Rooms',
        description: 'Own space for privacy and comfort'
      },
      {
        value: 'flexible',
        label: 'Situation Dependent',
        description: 'Depends on group, budget, and destination'
      }
    ]
  }
];

interface TravelPersonalityAssessmentProps {
  onComplete: (profile: TravelPersonalityProfile) => void;
  onClose: () => void;
}

export default function TravelPersonalityAssessment({ onComplete, onClose }: TravelPersonalityAssessmentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const progress = ((currentQuestion + 1) / assessmentQuestions.length) * 100;
  const currentQ = assessmentQuestions[currentQuestion];

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: value
    }));
  };

  const goToNext = () => {
    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      completeAssessment();
    }
  };

  const goToPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculatePersonalityProfile = (): TravelPersonalityProfile => {
    // Calculate personality type based on answers
    const personalityType = determinePersonalityType(answers);
    const compatibilityScore = calculateCompatibilityScore(answers);

    return {
      travelStyle: answers.travel_style as any,
      budgetLevel: answers.budget_level as any,
      groupPreference: answers.group_preference as any,
      communicationStyle: answers.communication_style as any,
      safetyComfort: answers.safety_comfort as any,
      activityIntensity: answers.activity_intensity as any,
      culturalInterest: answers.cultural_interest as any,
      socialPreference: answers.social_preference as any,
      planningStyle: answers.planning_style as any,
      accommodationStyle: answers.accommodation_style as any,
      dateFlexibility: 'moderate', // Default for now
      personalityType,
      compatibilityScore
    };
  };

  const determinePersonalityType = (answers: Record<string, string>): string => {
    // Adventure-focused personality types
    if (answers.travel_style === 'adventure' && answers.safety_comfort === 'adventurous') {
      return 'Adventurous Explorer';
    }
    
    // Cultural-focused personality types
    if (answers.travel_style === 'cultural' && answers.cultural_interest === 'high') {
      return 'Cultural Immersion Seeker';
    }
    
    // Social-focused personality types
    if (answers.travel_style === 'social' && answers.social_preference === 'extroverted') {
      return 'Social Connector';
    }
    
    // Relaxation-focused personality types
    if (answers.travel_style === 'relaxation' && answers.activity_intensity === 'low') {
      return 'Peaceful Wanderer';
    }
    
    // Business-focused personality types
    if (answers.travel_style === 'business') {
      return 'Professional Traveler';
    }
    
    // Combination types
    if (answers.planning_style === 'detailed' && answers.safety_comfort === 'cautious') {
      return 'Methodical Planner';
    }
    
    if (answers.planning_style === 'spontaneous' && answers.group_preference === 'solo') {
      return 'Free Spirit Solo Traveler';
    }
    
    if (answers.budget_level === 'luxury' && answers.accommodation_style === 'separate') {
      return 'Luxury Experience Seeker';
    }
    
    if (answers.budget_level === 'budget' && answers.accommodation_style === 'shared') {
      return 'Budget-Conscious Backpacker';
    }
    
    return 'Balanced Traveler';
  };

  const calculateCompatibilityScore = (answers: Record<string, string>): number => {
    // Base compatibility score calculation
    let score = 50; // Start with neutral
    
    // Adjust based on flexibility indicators
    if (answers.group_preference === 'flexible') score += 10;
    if (answers.budget_level === 'flexible') score += 10;
    if (answers.accommodation_style === 'flexible') score += 10;
    if (answers.planning_style === 'moderate') score += 5;
    if (answers.social_preference === 'balanced') score += 5;
    
    // Adjust based on specific combinations that work well
    if (answers.travel_style === 'social' && answers.communication_style === 'frequent') score += 10;
    if (answers.travel_style === 'cultural' && answers.cultural_interest === 'high') score += 10;
    if (answers.safety_comfort === 'moderate') score += 5;
    
    return Math.min(Math.max(score, 0), 100);
  };

  const completeAssessment = async () => {
    setIsLoading(true);
    
    try {
      const profile = calculatePersonalityProfile();
      
      // Save profile to backend
      await fetch('/api/users/travel-personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      onComplete(profile);
    } catch (error) {
      console.error('Error saving travel personality:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isAnswered = answers[currentQ.id] !== undefined;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" 
      style={{ zIndex: 9999 }}
      onClick={(e) => e.stopPropagation()}
    >
      <Card 
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <MapPin className="w-6 h-6 text-blue-500" />
            Travel Personality Assessment
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Help us understand your travel style to find better matches
          </p>
          <div className="mt-4">
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-gray-500 mt-1">
              Question {currentQuestion + 1} of {assessmentQuestions.length}
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            {currentQ.icon}
            <h3 className="text-lg font-medium">{currentQ.question}</h3>
          </div>
          
          <RadioGroup
            value={answers[currentQ.id] || ''}
            onValueChange={handleAnswer}
            className="space-y-3"
          >
            {currentQ.options.map((option) => (
              <div 
                key={option.value} 
                className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => handleAnswer(option.value)}
              >
                <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor={option.value} className="font-medium cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>
          
          <div className="flex justify-between pt-4 border-t">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                currentQuestion === 0 ? onClose() : goToPrevious();
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {currentQuestion === 0 ? 'Cancel' : 'Previous'}
            </button>
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isAnswered && !isLoading) {
                  goToNext();
                }
              }}
              disabled={!isAnswered || isLoading}
              style={{
                background: isAnswered && !isLoading ? 'linear-gradient(to right, #3b82f6, #ea580c)' : '#9ca3af',
                border: 'none',
                color: 'white'
              }}
              className="px-4 py-2 rounded-md flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestion === assessmentQuestions.length - 1 ? (
                isLoading ? 'Completing...' : 'Complete Assessment'
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}