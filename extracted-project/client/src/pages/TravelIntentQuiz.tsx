import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Heart, Camera, Coffee, Utensils, Palette, Music, TreePine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// Removed useAuth import - will get user from localStorage instead

// Inspired by TangoTrips.com's "Intention-Driven" onboarding approach
export default function TravelIntentQuiz() {
  const [location, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  // Get user from localStorage instead of context
  const getUserFromStorage = () => {
    try {
      const userData = localStorage.getItem('travelconnect_user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  };
  
  const user = getUserFromStorage();
  const [answers, setAnswers] = useState({
    travelWhy: '',
    travelWhat: [],
    travelHow: '',
    budget: '',
    groupType: ''
  });

  const steps = [
    { number: 1, title: 'Your Why', subtitle: 'Why are you traveling?' },
    { number: 2, title: 'Your What', subtitle: 'What interests you?' },
    { number: 3, title: 'Your How', subtitle: 'What\'s your travel style?' },
    { number: 4, title: 'Your Details', subtitle: 'Tell us more about your trip' }
  ];

  const whyOptions = [
    { id: 'adventure', title: 'Adventure & Discovery', icon: MapPin, desc: 'Explore new places and experiences' },
    { id: 'connection', title: 'Meet People', icon: Heart, desc: 'Connect with locals and fellow travelers' },
    { id: 'culture', title: 'Cultural Immersion', icon: Palette, desc: 'Experience authentic local culture' },
    { id: 'relaxation', title: 'Rest & Recharge', icon: TreePine, desc: 'Unwind and escape daily routine' }
  ];

  const whatOptions = [
    { id: 'food', title: 'Foodie', icon: Utensils, desc: 'Local cuisine and dining' },
    { id: 'art', title: 'Art & Museums', icon: Palette, desc: 'Galleries and cultural sites' },
    { id: 'music', title: 'Music & Nightlife', icon: Music, desc: 'Concerts and entertainment' },
    { id: 'photography', title: 'Photography', icon: Camera, desc: 'Scenic and Instagram spots' },
    { id: 'coffee', title: 'Coffee Culture', icon: Coffee, desc: 'Cafes and local hangouts' },
    { id: 'nature', title: 'Nature & Outdoors', icon: TreePine, desc: 'Parks and outdoor activities' }
  ];

  const howOptions = [
    { id: 'planner', title: 'The Planner', desc: 'I like detailed itineraries and reservations' },
    { id: 'spontaneous', title: 'The Explorer', desc: 'I prefer to discover things as I go' },
    { id: 'social', title: 'The Social Butterfly', desc: 'I love meeting people and group activities' },
    { id: 'independent', title: 'The Independent', desc: 'I enjoy solo exploration and flexibility' }
  ];

  const budgetOptions = [
    { id: 'budget', title: 'Budget-Conscious', desc: 'Under $50/day' },
    { id: 'moderate', title: 'Moderate', desc: '$50-150/day' },
    { id: 'premium', title: 'Premium', desc: '$150+/day' }
  ];

  const groupOptions = [
    { id: 'solo', title: 'Solo Traveler', desc: 'Just me' },
    { id: 'couple', title: 'Couple', desc: 'Me + partner' },
    { id: 'friends', title: 'Friends Group', desc: 'Traveling with friends' },
    { id: 'family', title: 'Family', desc: 'With family members' }
  ];

  const handleAnswer = (field: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (interest: string) => {
    const current = answers.travelWhat as string[];
    if (current.includes(interest)) {
      handleAnswer('travelWhat', current.filter(i => i !== interest));
    } else {
      handleAnswer('travelWhat', [...current, interest]);
    }
  };

  const nextStep = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete quiz - save to database
      await handleCompleteQuiz();
    }
  };

  const handleCompleteQuiz = async () => {
    if (!user?.id) {
      toast({
        title: "Login Required",
        description: "You must be logged in to save travel preferences. Redirecting to login...",
        variant: "destructive",
      });
      // Redirect to proper login endpoint
      window.location.href = '/signin';
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Save travel preferences to user profile
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          travelWhy: answers.travelWhy,
          travelWhat: answers.travelWhat,
          travelHow: answers.travelHow,
          travelBudget: answers.budget,
          travelGroup: answers.groupType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save preferences: ${response.status}`);
      }

      // Also save to localStorage as backup
      localStorage.setItem('travelPreferences', JSON.stringify(answers));
      
      toast({
        title: "Success!",
        description: "Your travel preferences have been saved.",
      });

      // Redirect back to home or profile
      console.log('✅ Travel quiz completed, redirecting...');
      if (user?.id) {
        console.log(`🔄 Redirecting to profile for user ${user.id}`);
        setLocation('/profile');
      } else {
        console.log('🔄 No user found, redirecting to home');
        setLocation('/');
      }
      
    } catch (error) {
      console.error('Error saving travel preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return answers.travelWhy !== '';
      case 2: return answers.travelWhat.length > 0;
      case 3: return answers.travelHow !== '';
      case 4: return answers.budget !== '' && answers.groupType !== '';
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Header - Inspired by TangoTrips step visualization */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep >= step.number 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {step.number}
                </div>
                <div className="ml-3 hidden sm:block">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{step.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{step.subtitle}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quiz Content */}
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {steps[currentStep - 1].title}
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                {steps[currentStep - 1].subtitle}
              </p>
            </CardHeader>
            
            <CardContent className="pt-6">
              {/* Step 1: Why */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {whyOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleAnswer('travelWhy', option.id)}
                        className={`p-6 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                          answers.travelWhy === option.id
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                        }`}
                      >
                        <Icon className="w-8 h-8 text-blue-600 mb-3" />
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{option.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{option.desc}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Step 2: What */}
              {currentStep === 2 && (
                <div>
                  <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                    Select all that interest you (choose as many as you like)
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {whatOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = (answers.travelWhat as string[]).includes(option.id);
                      return (
                        <button
                          key={option.id}
                          onClick={() => toggleInterest(option.id)}
                          className={`p-4 rounded-lg border-2 text-center transition-all hover:shadow-md ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                          }`}
                        >
                          <Icon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                          <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1">{option.title}</h3>
                          <p className="text-xs text-gray-600 dark:text-gray-300">{option.desc}</p>
                          {isSelected && (
                            <Badge className="mt-2 bg-blue-600">Selected</Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: How */}
              {currentStep === 3 && (
                <div className="space-y-3">
                  {howOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleAnswer('travelHow', option.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                        answers.travelHow === option.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                      }`}
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{option.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{option.desc}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 4: Details */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Travel Budget</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {budgetOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleAnswer('budget', option.id)}
                          className={`p-4 rounded-lg border-2 text-center transition-all hover:shadow-md ${
                            answers.budget === option.id
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                          }`}
                        >
                          <h4 className="font-medium text-gray-900 dark:text-white">{option.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{option.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Group Type</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {groupOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleAnswer('groupType', option.id)}
                          className={`p-3 rounded-lg border-2 text-center transition-all hover:shadow-md ${
                            answers.groupType === option.id
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                          }`}
                        >
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">{option.title}</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-300">{option.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                
                <Button
                  onClick={nextStep}
                  disabled={!canProceed() || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? 'Saving...' : (currentStep === 4 ? 'Complete Quiz' : 'Next Step')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}