import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, User, ChevronDown, ChevronUp } from "lucide-react";

interface SecretExperience {
  id: number;
  experience: string;
  username: string;
  likes: number;
}

interface SecretExperiencesWidgetProps {
  city: string;
  state?: string;
  country: string;
}

export function SecretExperiencesWidget({ city, state, country }: SecretExperiencesWidgetProps) {
  const [showAll, setShowAll] = useState(false);
  const [expandedExperiences, setExpandedExperiences] = useState<Record<number, boolean>>({});


  // Clean authentication works - no debug needed

  const { data: experiences = [], isLoading } = useQuery({
    queryKey: ['/api/secret-experiences', city, state, country],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (state) params.set('state', state);
      if (country) params.set('country', country);
      
      const url = `/api/secret-experiences/${encodeURIComponent(city)}/${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch secret experiences');
      }
      return response.json();
    }
  });

  // Activities loaded successfully

  const displayedExperiences = showAll ? experiences : experiences.slice(0, 2);
  const hasMore = experiences.length > 2;

  const toggleExperience = (experienceId: number) => {
    setExpandedExperiences(prev => ({
      ...prev,
      [experienceId]: !prev[experienceId]
    }));
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">
            Secret Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading secret activities...</div>
        </CardContent>
      </Card>
    );
  }

  if (experiences.length === 0) {
    return (
      <Card className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">
            Secret Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No secret activities shared yet. Be the first local to share a hidden gem!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
    >
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">
          Secret Activities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayedExperiences.map((experience: SecretExperience) => {
          const isExpanded = expandedExperiences[experience.id];
          const shouldTruncate = experience.experience.length > 120; // Force 2 lines max
          
          return (
            <div 
              key={experience.id} 
              className="border-l-4 border-gray-500 dark:border-gray-400 pl-4 py-2 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-r-lg"
            >
              <div 
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (shouldTruncate) {
                    toggleExperience(experience.id);
                  }
                }}
              >
                <p className={`text-gray-800 dark:text-white font-medium leading-relaxed ${
                  shouldTruncate && !isExpanded ? 'line-clamp-2' : ''
                }`}>
                  {experience.experience}
                </p>
                {shouldTruncate && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExperience(experience.id);
                    }}
                    className="text-xs text-black dark:text-white mt-1 hover:underline cursor-pointer"
                  >
                    {isExpanded ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                  <span 
                    className="text-xs text-gray-800 dark:text-white font-medium cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/profile/${experience.id}`;
                    }}
                  >
                    {experience.username}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        
        {hasMore && (
          <div className="pt-2 border-t dark:border-gray-600">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowAll(!showAll);
              }}
              className="w-full text-xs text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show More ({experiences.length - 2} more)
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}