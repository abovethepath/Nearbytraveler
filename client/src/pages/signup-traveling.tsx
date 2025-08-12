import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { authStorage } from "@/lib/auth";
import { MOST_POPULAR_INTERESTS, ADDITIONAL_INTERESTS, getAllActivities, getAllEvents, getAllLanguages } from "../../../shared/base-options";
import { SmartLocationInput } from "@/components/SmartLocationInput";
import { GENDER_OPTIONS, SEXUAL_PREFERENCE_OPTIONS, PRIVACY_NOTES } from "@/lib/formConstants";
import { useToast } from "@/hooks/use-toast";

// Using centralized base options for consistency

export default function SignupTraveling() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    dateOfBirth: '',
    gender: '',
    bio: '',
    hometownCity: '',
    hometownState: '',
    hometownCountry: '',
    currentCity: '',
    currentState: '',
    currentCountry: '',
    travelStartDate: '',
    travelEndDate: '',
    interests: [] as string[],
    activities: [] as string[],
    events: [] as string[],
    languages: [] as string[],

    sexualPreference: [] as string[],
    isVeteran: false,
    isActiveDuty: false,
    travelingWithChildren: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to get total selections for validation
  const getTotalSelections = () => {
    return formData.interests.length + 
           formData.activities.length + 
           formData.events.length;
  };

  // Select All function for Top Choices sections
  const selectAllTopChoices = () => {
    setFormData(prev => {
      // Get items not already selected
      const newInterests = MOST_POPULAR_INTERESTS.filter(item => !prev.interests.includes(item));
      
      return {
        ...prev,
        interests: [...prev.interests, ...newInterests]
      };
    });
  };

  // Clear All function for Top Choices sections
  const clearAllTopChoices = () => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(item => !MOST_POPULAR_INTERESTS.includes(item))
    }));
  };

  // Load account data from sessionStorage on component mount
  useEffect(() => {
    const storedAccountData = sessionStorage.getItem('accountData');
    if (storedAccountData) {
      try {
        const accountData = JSON.parse(storedAccountData);
        console.log('✅ Loading account data from sessionStorage:', accountData);
        setFormData(prev => ({
          ...prev,
          email: accountData.email || '',
          username: accountData.username || '',
          name: accountData.name || '',
          password: accountData.password || ''
        }));
      } catch (error) {
        console.error('❌ Error loading account data from sessionStorage:', error);
      }
    }
  }, []);

  const toggleItem = (category: 'interests' | 'activities' | 'events' | 'languages', item: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].includes(item)
        ? prev[category].filter(i => i !== item)
        : [...prev[category], item]
    }));
  };


  const removeItem = (category: 'interests' | 'activities' | 'events' | 'languages', item: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].filter(i => i !== item)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get account data from sessionStorage (from Auth component)
      const storedAccountData = sessionStorage.getItem('accountData');
      let accountData = { email: '', password: '', username: '', name: '' };

      if (storedAccountData) {
        try {
          accountData = JSON.parse(storedAccountData);
          console.log('✅ Retrieved account data from sessionStorage:', accountData);
        } catch (error) {
          console.error('❌ Error parsing stored account data:', error);
        }
      }

      // CRITICAL: Merge account data INTO formData to ensure submission has complete data
      const finalFormData = {
        ...formData,
        email: accountData.email || formData.email,
        password: accountData.password || formData.password,
        username: accountData.username || formData.username,
        name: accountData.name || formData.name
      };

      // Validation
      if (!finalFormData.name || !finalFormData.username || !finalFormData.email || !finalFormData.password) {
        window.alert(`SIGNUP ERROR: Missing required fields - Name: ${finalFormData.name ? 'OK' : 'MISSING'}, Username: ${finalFormData.username ? 'OK' : 'MISSING'}, Email: ${finalFormData.email ? 'OK' : 'MISSING'}, Password: ${finalFormData.password ? 'OK' : 'MISSING'}`);
        
        toast({
          title: "Missing required fields",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      // Sexual preference is required
      if (formData.sexualPreference.length === 0) {
        toast({
          title: "Sexual preference required",
          description: "Please select at least one sexual preference. This can be hidden from public view later.",
          variant: "destructive",
        });
        return;
      }

      // Bio validation
      if (formData.bio.length < 50) {
        toast({
          title: "Bio too short",
          description: "Your bio must be at least 50 characters long.",
          variant: "destructive",
        });
        return;
      }

      // Validate date format
      if (formData.dateOfBirth && formData.dateOfBirth.includes('--')) {
        setIsSubmitting(false);
        toast({
          title: "Complete Date Required",
          description: "Please select all parts of your date of birth (month, day, and year).",
          variant: "destructive",
        });
        return;
      }

      // Check total selections across all 4 categories
      const totalSelections = formData.interests.length + formData.activities.length + formData.events.length + formData.languages.length;
      if (totalSelections < 10) {
        toast({
          title: "More selections needed",
          description: "Please choose at least 10 or more total items from interests, activities, events, and languages combined.",
          variant: "destructive",
        });
        return;
      }

      const registrationData = {
        ...finalFormData,
        userType: 'traveler',
        isCurrentlyTraveling: true,
        travelDestination: `${formData.currentCity}, ${formData.currentState ? formData.currentState + ', ' : ''}${formData.currentCountry}`,
        languagesSpoken: formData.languages
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      if (response.ok && data.user) {
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('userData', JSON.stringify(data.user));
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        toast({
          title: "Account created successfully!",
          description: "Welcome to Nearby Traveler!",
          variant: "default",
        });

        // Force a page refresh to ensure authentication state is fully loaded
        window.location.href = '/profile';
      } else {
        window.alert(`REGISTRATION FAILED: ${data.message || 'Unknown error'}`);
        
        toast({
          title: "Registration failed",
          description: data.message || "Something went wrong.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-2xl border-2 border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
          <CardHeader className="text-center bg-gray-50 dark:bg-gray-800 rounded-t-lg pb-8">
            <div className="flex justify-start mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/join')}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 border-blue-300 hover:border-blue-500 font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
            <CardTitle className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Complete Your Traveling Profile ✈️
            </CardTitle>
            <CardDescription className="text-xl text-gray-700 dark:text-gray-300 font-medium">
              Connect with locals and travelers in your current destination
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Personal Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-900 dark:text-white">Date of Birth *</Label>
                    <div className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                      Can be hidden from public view later while still being used for matching
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-400">Month</Label>
                        <Select 
                          value={formData.dateOfBirth ? formData.dateOfBirth.split('-')[1] : ''}
                          onValueChange={(month) => {
                            const [year, , day] = formData.dateOfBirth ? formData.dateOfBirth.split('-') : ['', '', ''];
                            setFormData(prev => ({ ...prev, dateOfBirth: `${year || ''}-${month}-${day || ''}` }));
                          }}
                        >
                          <SelectTrigger className="text-sm border-2 border-gray-300 dark:border-gray-600">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 12}, (_, i) => {
                              const month = String(i + 1).padStart(2, '0');
                              const monthName = new Date(2000, i, 1).toLocaleDateString('en', { month: 'long' });
                              return (
                                <SelectItem key={month} value={month}>
                                  {monthName}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-400">Day</Label>
                        <Select 
                          value={formData.dateOfBirth ? formData.dateOfBirth.split('-')[2] : ''}
                          onValueChange={(day) => {
                            const [year, month] = formData.dateOfBirth ? formData.dateOfBirth.split('-') : ['', ''];
                            setFormData(prev => ({ ...prev, dateOfBirth: `${year || ''}-${month || ''}-${day}` }));
                          }}
                        >
                          <SelectTrigger className="text-sm border-2 border-gray-300 dark:border-gray-600">
                            <SelectValue placeholder="Day" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 31}, (_, i) => {
                              const day = String(i + 1).padStart(2, '0');
                              return (
                                <SelectItem key={day} value={day}>
                                  {day}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-400">Year</Label>
                        <Select 
                          value={formData.dateOfBirth ? formData.dateOfBirth.split('-')[0] : ''}
                          onValueChange={(year) => {
                            const [, month, day] = formData.dateOfBirth ? formData.dateOfBirth.split('-') : ['', '', ''];
                            setFormData(prev => ({ ...prev, dateOfBirth: `${year}-${month || ''}-${day || ''}` }));
                          }}
                        >
                          <SelectTrigger className="text-sm border-2 border-gray-300 dark:border-gray-600">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 80}, (_, i) => {
                              const year = String(new Date().getFullYear() - 16 - i);
                              return (
                                <SelectItem key={year} value={year}>
                                  {year}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>
                    <Label className="text-gray-900 dark:text-white">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((gender) => (
                          <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-900 dark:text-white">Sexual Preference * (Select all that apply)</Label>
                  <div className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                    {PRIVACY_NOTES.SEXUAL_PREFERENCE}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {SEXUAL_PREFERENCE_OPTIONS.map((preference) => (
                      <div key={preference} className="flex items-center space-x-2">
                        <Checkbox
                          id={`sexual-${preference}`}
                          checked={formData.sexualPreference.includes(preference)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                sexualPreference: [...prev.sexualPreference, preference]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                sexualPreference: prev.sexualPreference.filter(p => p !== preference)
                              }));
                            }
                          }}
                          className="border-2 border-gray-300 dark:border-gray-600"
                        />
                        <Label 
                          htmlFor={`sexual-${preference}`}
                          className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                        >
                          {preference}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {formData.sexualPreference.length === 0 && (
                    <div className="text-red-500 text-sm mt-2">Please select at least one sexual preference</div>
                  )}
                </div>

                <div>
                  <Label className="text-gray-900 dark:text-white">Bio *</Label>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Minimum 50 characters, maximum 500 characters
                  </div>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself, your travel style, interests, and what makes you unique..."
                    rows={4}
                    maxLength={500}
                    required
                    minLength={50}
                    className={`${
                      formData.bio.length > 0 && formData.bio.length < 50 
                        ? 'border-red-500 focus:border-red-500' 
                        : formData.bio.length >= 50 
                        ? 'border-green-500 focus:border-green-500' 
                        : ''
                    }`}
                  />
                  <div className="flex justify-between text-sm mt-1">
                    <span className={`${
                      formData.bio.length < 50 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {formData.bio.length < 50 
                        ? `Need ${50 - formData.bio.length} more characters` 
                        : 'Minimum requirement met'}
                    </span>
                    <span className={`${
                      formData.bio.length > 450 
                        ? 'text-orange-600' 
                        : 'text-gray-500'
                    }`}>
                      {formData.bio.length}/500 characters
                    </span>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Location Information</h3>

                <div>
                  <Label className="text-gray-900 dark:text-white">Hometown Location *</Label>
                  <SmartLocationInput
                    country={formData.hometownCountry}
                    city={formData.hometownCity}
                    state={formData.hometownState}
                    onLocationChange={(location) => {
                      setFormData(prev => ({
                        ...prev,
                        hometownCountry: location.country,
                        hometownCity: location.city,
                        hometownState: location.state
                      }));
                    }}
                    placeholder={{ country: "Select your hometown country", city: "Select hometown city", state: "Select state/region" }}
                    required
                  />
                </div>

                <div>
                  <Label className="text-gray-900 dark:text-white">Current Travel Location *</Label>
                  <SmartLocationInput
                    country={formData.currentCountry}
                    city={formData.currentCity}
                    state={formData.currentState}
                    onLocationChange={(location) => {
                      setFormData(prev => ({
                        ...prev,
                        currentCountry: location.country,
                        currentCity: location.city,
                        currentState: location.state
                      }));
                    }}
                    placeholder={{ country: "Where are you traveling?", city: "Select travel city", state: "Select state/region" }}
                    required
                  />
                </div>

                <div>
                  <Label className="text-gray-900 dark:text-white">When does your trip end? *</Label>
                  <Input
                    type="date"
                    max="9999-12-31"
                    value={formData.travelEndDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, travelEndDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Connection Preferences Section */}
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Connection Preferences</h3>
                  <div className="text-sm text-blue-600 bg-blue-50 border border-blue-400 rounded-md p-3 mb-4 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-300">
                    <strong>Quick Setup:</strong> Choose 10+ items below to match with locals and travelers who share your interests. You can update these anytime later.
                  </div>
                  <div className="text-center mt-4">
                    <div className={`text-lg font-bold ${getTotalSelections() >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                      Current selections: {getTotalSelections()}/10 minimum
                    </div>
                    {getTotalSelections() < 10 && (
                      <p className="text-sm text-red-600 mt-1">
                        Please select more items for better matching
                      </p>
                    )}
                  </div>
                </div>

                {/* Interests */}
                <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Interests</h3>

                {/* Most Popular Section */}
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-blue-500 via-orange-500 to-red-500 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-300 text-lg">⭐</span>
                        <h4 className="text-white font-bold text-lg">Top Choices for Most Locals and Travelers</h4>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={selectAllTopChoices}
                          className="px-3 py-1 bg-white/20 text-white text-sm rounded-md hover:bg-white/30 transition-colors"
                          data-testid="button-select-all-top-choices"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={clearAllTopChoices}
                          className="px-3 py-1 bg-white/20 text-white text-sm rounded-md hover:bg-white/30 transition-colors"
                          data-testid="button-clear-all-top-choices"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {MOST_POPULAR_INTERESTS.map((interest: string) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleItem('interests', interest)}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                            formData.interests.includes(interest)
                              ? 'bg-white text-blue-600 font-bold transform scale-105'
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                          data-testid={`button-top-choice-${interest.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Additional Interests Section */}
                <div className="mb-6">
                  <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-gray-600">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="text-gray-900 dark:text-white font-bold text-lg">Interests</h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {ADDITIONAL_INTERESTS.map((interest: string) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleItem('interests', interest)}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                            formData.interests.includes(interest)
                              ? 'bg-blue-600 text-white font-bold transform scale-105'
                              : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>




                {/* Selected interests hidden for cleaner mobile display - data still saves to database */}
              </div>

                {/* Activities */}
                <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Activities</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-green-50 dark:bg-gray-800">
                  {getAllActivities().map(activity => (
                    <button
                      key={activity}
                      type="button"
                      onClick={() => toggleItem('activities', activity)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                        formData.activities.includes(activity)
                          ? 'bg-green-600 text-white font-bold transform scale-105'
                          : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {activity}
                    </button>
                  ))}
                </div>


                {/* Selected activities hidden for cleaner mobile display - data still saves to database */}
              </div>

                {/* Events */}
                <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Events</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 border border-purple-200 dark:border-purple-600 rounded-lg p-4 bg-purple-50 dark:bg-gray-800">
                  {getAllEvents().map(event => (
                    <button
                      key={event}
                      type="button"
                      onClick={() => toggleItem('events', event)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                        formData.events.includes(event)
                          ? 'bg-purple-600 text-white font-bold transform scale-105'
                          : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {event}
                    </button>
                  ))}
                </div>


                {/* Selected events hidden for cleaner mobile display - data still saves to database */}
              </div>

              {/* Languages */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Languages *</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    "English", "Spanish", "French", "German", "Italian", "Portuguese", 
                    "Dutch", "Russian", "Mandarin", "Japanese", "Korean", "Arabic",
                    "Hindi", "Thai", "Vietnamese", "Swedish", "Norwegian", "Danish",
                    "Polish", "Czech", "Hungarian", "Greek", "Turkish", "Hebrew"
                  ].map((language: string) => (
                    <div key={language} className="flex items-center space-x-2">
                      <Checkbox
                        id={`language-${language}`}
                        checked={formData.languages.includes(language)}
                        onCheckedChange={() => toggleItem('languages', language)}
                      />
                      <Label htmlFor={`language-${language}`} className="text-sm">{language}</Label>
                    </div>
                  ))}
                </div>


                <div className="flex flex-wrap gap-2">
                  {formData.languages.map(language => (
                    <span
                      key={language}
                      className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {language}
                      <button
                        type="button"
                        onClick={() => removeItem('languages', language)}
                        className="text-yellow-600 hover:text-yellow-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                </div>
              </div>



              {/* Military Status */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Military Status</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isVeteran"
                    checked={formData.isVeteran}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVeteran: !!checked }))}
                  />
                  <Label htmlFor="isVeteran">I am a Veteran</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActiveDuty"
                    checked={formData.isActiveDuty}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActiveDuty: !!checked }))}
                  />
                  <Label htmlFor="isActiveDuty">I am Active Duty</Label>
                </div>
              </div>

              {/* Family Travel */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Family Travel</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="travelingWithChildren"
                    checked={formData.travelingWithChildren}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, travelingWithChildren: !!checked }))}
                  />
                  <Label htmlFor="travelingWithChildren">I travel with children</Label>
                </div>
              </div>

              {/* Final Selection Count Warning */}
              <div className="text-center">
                <div className={`text-lg font-bold ${getTotalSelections() >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                  Final Count: {getTotalSelections()}/10 minimum selections
                </div>
                {getTotalSelections() < 10 && (
                  <p className="text-sm text-red-600 mt-1 font-medium">
                    Please select at least 10 total items from interests, activities, and events for better matching
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white font-bold py-4 text-lg shadow-lg"
                >
                  {isSubmitting ? "Creating Your Nearby Traveler Account..." : "Create Nearby Traveler Account"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}