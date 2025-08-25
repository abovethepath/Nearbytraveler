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
  const [customInterestInput, setCustomInterestInput] = useState('');
  const [customActivityInput, setCustomActivityInput] = useState('');
  const [customEventInput, setCustomEventInput] = useState('');
  const [customLanguageInput, setCustomLanguageInput] = useState('');

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

  const addCustomItem = (type: string, value: string, clearInput: () => void) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (type === 'interest') {
      if (!formData.interests.includes(trimmed)) {
        setFormData(prev => ({ ...prev, interests: [...prev.interests, trimmed] }));
        clearInput();
      }
    } else if (type === 'activity') {
      if (!formData.activities.includes(trimmed)) {
        setFormData(prev => ({ ...prev, activities: [...prev.activities, trimmed] }));
        clearInput();
      }
    } else if (type === 'event') {
      if (!formData.events.includes(trimmed)) {
        setFormData(prev => ({ ...prev, events: [...prev.events, trimmed] }));
        clearInput();
      }
    } else if (type === 'language') {
      if (!formData.languages.includes(trimmed)) {
        setFormData(prev => ({ ...prev, languages: [...prev.languages, trimmed] }));
        clearInput();
      }
    }
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
        languagesSpoken: formData.languages,
        // Since user is currently traveling, set start date to today
        travelStartDate: new Date().toISOString().split('T')[0]
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-2xl border-2 border-gray-200 bg-white/95 backdrop-blur-md">
          <CardHeader className="text-center bg-gray-50 rounded-t-lg pb-8">
            <div className="flex justify-start mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/join')}
                className="text-blue-600 hover:text-blue-800 border-blue-300 hover:border-blue-500 font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
            <CardTitle className="text-4xl font-bold text-black mb-3">
              Complete Your Traveling Profile ✈️
            </CardTitle>
            <CardDescription className="text-xl text-black font-medium">
              Connect with locals and travelers in your current destination
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-black">Personal Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-black">Date of Birth *</Label>
                    <div className="text-sm text-blue-600 mb-2">
                      Can be hidden from public view later while still being used for matching
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-black">Month</Label>
                        <Select 
                          value={formData.dateOfBirth ? formData.dateOfBirth.split('-')[1] : ''}
                          onValueChange={(month) => {
                            const [year, , day] = formData.dateOfBirth ? formData.dateOfBirth.split('-') : ['', '', ''];
                            setFormData(prev => ({ ...prev, dateOfBirth: `${year || ''}-${month}-${day || ''}` }));
                          }}
                        >
                          <SelectTrigger className="text-sm border-2 border-gray-300">
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
                        <Label className="text-xs text-black">Day</Label>
                        <Select 
                          value={formData.dateOfBirth ? formData.dateOfBirth.split('-')[2] : ''}
                          onValueChange={(day) => {
                            const [year, month] = formData.dateOfBirth ? formData.dateOfBirth.split('-') : ['', ''];
                            setFormData(prev => ({ ...prev, dateOfBirth: `${year || ''}-${month || ''}-${day}` }));
                          }}
                        >
                          <SelectTrigger className="text-sm border-2 border-gray-300">
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
                        <Label className="text-xs text-black">Year</Label>
                        <Select 
                          value={formData.dateOfBirth ? formData.dateOfBirth.split('-')[0] : ''}
                          onValueChange={(year) => {
                            const [, month, day] = formData.dateOfBirth ? formData.dateOfBirth.split('-') : ['', '', ''];
                            setFormData(prev => ({ ...prev, dateOfBirth: `${year}-${month || ''}-${day || ''}` }));
                          }}
                        >
                          <SelectTrigger className="text-sm border-2 border-gray-300">
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
                  </div>

                  <div>
                    <Label className="text-black">Gender</Label>
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
                  <Label className="text-black">Sexual Preference * (Select all that apply)</Label>
                  <div className="text-sm text-blue-600 mb-3">
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
                          className="border-2 border-gray-300"
                        />
                        <Label 
                          htmlFor={`sexual-${preference}`}
                          className="text-sm font-medium text-black cursor-pointer"
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
                  <Label className="text-black">Bio *</Label>
                  <div className="text-sm text-black mb-2">
                    Minimum 50 characters, maximum 500 characters
                  </div>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself, your travel experiences, and what you're looking for in your destination..."
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
                <h3 className="text-2xl font-bold text-black">Location Information</h3>

                <div>
                  <Label className="text-black">Hometown Location *</Label>
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
                  <Label className="text-black">Current Travel Location *</Label>
                  <div className="text-sm text-blue-600 mb-2">
                    Where are you traveling right now?
                  </div>
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
                    placeholder={{ country: "Select travel destination country", city: "Select travel destination city", state: "Select state/region" }}
                    required
                  />
                </div>

                <div>
                  <Label className="text-black">Travel End Date (Optional)</Label>
                  <div className="text-sm text-black mb-2">
                    When do you plan to leave this destination? Leave blank if unsure.
                  </div>
                  <Input
                    type="date"
                    value={formData.travelEndDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, travelEndDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Top Choices - Interests */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-black">Top Choices</h3>
                  <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    {getTotalSelections()}/10 minimum
                  </div>
                </div>
                <p className="text-black mb-4">
                  Select at least 10 total items across interests, activities, events, and languages. 
                  You can always add more later from within the app.
                </p>

                {/* Quick action buttons */}
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAllTopChoices}
                    className="text-xs"
                  >
                    Select All Top Choices
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearAllTopChoices}
                    className="text-xs"
                  >
                    Clear Top Choices
                  </Button>
                </div>

                <div>
                  <Label className="text-black">Interests ({formData.interests.length} selected)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {MOST_POPULAR_INTERESTS.map((interest) => (
                      <div key={interest} className="flex items-center space-x-2">
                        <Checkbox
                          id={`interest-${interest}`}
                          checked={formData.interests.includes(interest)}
                          onCheckedChange={() => toggleItem('interests', interest)}
                          className="border-2 border-gray-300"
                        />
                        <Label 
                          htmlFor={`interest-${interest}`}
                          className="text-sm text-black cursor-pointer"
                        >
                          {interest}
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 flex gap-2">
                    <Input
                      value={customInterestInput}
                      onChange={(e) => setCustomInterestInput(e.target.value)}
                      placeholder="Add custom interest..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => addCustomItem('interest', customInterestInput, () => setCustomInterestInput(''))}
                      disabled={!customInterestInput.trim()}
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-black">Activities ({formData.activities.length} selected)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {getAllActivities().slice(0, 15).map((activity) => (
                      <div key={activity} className="flex items-center space-x-2">
                        <Checkbox
                          id={`activity-${activity}`}
                          checked={formData.activities.includes(activity)}
                          onCheckedChange={() => toggleItem('activities', activity)}
                          className="border-2 border-gray-300"
                        />
                        <Label 
                          htmlFor={`activity-${activity}`}
                          className="text-sm text-black cursor-pointer"
                        >
                          {activity}
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 flex gap-2">
                    <Input
                      value={customActivityInput}
                      onChange={(e) => setCustomActivityInput(e.target.value)}
                      placeholder="Add custom activity..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => addCustomItem('activity', customActivityInput, () => setCustomActivityInput(''))}
                      disabled={!customActivityInput.trim()}
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-black">Events ({formData.events.length} selected)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {getAllEvents().slice(0, 12).map((event) => (
                      <div key={event} className="flex items-center space-x-2">
                        <Checkbox
                          id={`event-${event}`}
                          checked={formData.events.includes(event)}
                          onCheckedChange={() => toggleItem('events', event)}
                          className="border-2 border-gray-300"
                        />
                        <Label 
                          htmlFor={`event-${event}`}
                          className="text-sm text-black cursor-pointer"
                        >
                          {event}
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 flex gap-2">
                    <Input
                      value={customEventInput}
                      onChange={(e) => setCustomEventInput(e.target.value)}
                      placeholder="Add custom event type..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => addCustomItem('event', customEventInput, () => setCustomEventInput(''))}
                      disabled={!customEventInput.trim()}
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-black">Languages Spoken ({formData.languages.length} selected)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {getAllLanguages().slice(0, 12).map((language) => (
                      <div key={language} className="flex items-center space-x-2">
                        <Checkbox
                          id={`language-${language}`}
                          checked={formData.languages.includes(language)}
                          onCheckedChange={() => toggleItem('languages', language)}
                          className="border-2 border-gray-300"
                        />
                        <Label 
                          htmlFor={`language-${language}`}
                          className="text-sm text-black cursor-pointer"
                        >
                          {language}
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 flex gap-2">
                    <Input
                      value={customLanguageInput}
                      onChange={(e) => setCustomLanguageInput(e.target.value)}
                      placeholder="Add custom language..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => addCustomItem('language', customLanguageInput, () => setCustomLanguageInput(''))}
                      disabled={!customLanguageInput.trim()}
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-black">Additional Information (Optional)</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isVeteran"
                      checked={formData.isVeteran}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVeteran: !!checked }))}
                      className="border-2 border-gray-300"
                    />
                    <Label htmlFor="isVeteran" className="text-sm text-black">
                      I am a military veteran
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActiveDuty"
                      checked={formData.isActiveDuty}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActiveDuty: !!checked }))}
                      className="border-2 border-gray-300"
                    />
                    <Label htmlFor="isActiveDuty" className="text-sm text-black">
                      I am currently active military duty
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="travelingWithChildren"
                      checked={formData.travelingWithChildren}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, travelingWithChildren: !!checked }))}
                      className="border-2 border-gray-300"
                    />
                    <Label htmlFor="travelingWithChildren" className="text-sm text-black">
                      I am traveling with children
                    </Label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting || getTotalSelections() < 10}
                  className="w-full py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? 'Creating Profile...' : `Complete Registration (${getTotalSelections()}/10)`}
                </Button>
                {getTotalSelections() < 10 && (
                  <p className="text-red-600 text-sm mt-2 text-center">
                    Please select at least {10 - getTotalSelections()} more items to continue
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}