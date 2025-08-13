import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Clock, TrendingUp, Sparkles } from 'lucide-react';

interface ContextualFactor {
  locationMatch: number;
  interestMatch: number;
  timeRelevance: number;
  weatherRelevance: number;
  travelContext: number;
  socialProof: number;
  personalHistory: number;
}

interface BusinessRecommendation {
  businessId: number;
  businessName: string;
  businessType: string;
  title: string;
  description: string;
  location: string;
  category: string;
  originalPrice?: number;
  discountedPrice?: number;
  discountPercentage?: number;
  validUntil?: string;
  imageUrl?: string;
  relevanceScore: number;
  contextualFactors: ContextualFactor;
  recommendationReason: string;
  contextualTags: string[];
}

interface ContextualRecommendationsResponse {
  userId: number;
  context: {
    location: string;
    isTraverling: boolean;
    interests: number;
    activities: number;
  };
  recommendations: BusinessRecommendation[];
  meta: {
    total: number;
    averageScore: number;
  };
}

interface ContextualBusinessRecommendationsProps {
  userId: number;
  limit?: number;
}

export function ContextualBusinessRecommendations({ userId, limit = 8 }: ContextualBusinessRecommendationsProps) {
  const { data, isLoading, error } = useQuery<ContextualRecommendationsResponse>({
    queryKey: [`/api/contextual-recommendations/${userId}`, { limit }],
    retry: false,
  });

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-blue-600 bg-blue-100';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent Match';
    if (score >= 0.6) return 'Good Match';
    if (score >= 0.4) return 'Fair Match';
    return 'Basic Match';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Sparkles className="h-5 w-5" />
            Contextual Business Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Sparkles className="h-5 w-5" />
            Contextual Business Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-gray-900 dark:text-white">Unable to load recommendations</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Please try again later</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Sparkles className="h-5 w-5" />
            Contextual Business Recommendations
            <Badge variant="outline" className="ml-auto">
              AI-Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-gray-900 dark:text-white">No personalized recommendations available</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Complete your profile and interests to get tailored business recommendations
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Sparkles className="h-5 w-5" />
          Contextual Business Recommendations
          <Badge variant="outline" className="ml-auto">
            AI-Powered • {data.meta.total} Results
          </Badge>
        </CardTitle>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span>📍 {data.context.location}</span>
            <span>🎯 {data.context.interests} interests</span>
            <span>⭐ Avg Score: {data.meta.averageScore}</span>
            <span>{data.context.isTraverling ? '✈️ Traveling' : '🏠 Local'}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.recommendations.map((recommendation, index) => (
            <div
              key={`${recommendation.businessId}-${index}-${recommendation.title.substring(0, 10)}`}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {recommendation.title}
                    </h3>
                    <Badge className={getScoreColor(recommendation.relevanceScore)}>
                      {Math.round(recommendation.relevanceScore * 100)}% • {getScoreLabel(recommendation.relevanceScore)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    {recommendation.businessName} • {recommendation.businessType}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span>{recommendation.location}</span>
                    <Badge variant="outline" className="text-xs">
                      {recommendation.category}
                    </Badge>
                  </div>
                </div>
                
                {recommendation.imageUrl && (
                  <img 
                    src={recommendation.imageUrl} 
                    alt={recommendation.title}
                    className="w-16 h-16 object-cover rounded-lg ml-4"
                  />
                )}
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                {recommendation.description}
              </p>

              {/* Pricing */}
              {(recommendation.originalPrice || recommendation.discountedPrice) && (
                <div className="flex items-center gap-2 mb-3">
                  {recommendation.discountedPrice && recommendation.originalPrice ? (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-green-600">
                        {formatPrice(recommendation.discountedPrice)}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(recommendation.originalPrice)}
                      </span>
                      {recommendation.discountPercentage && (
                        <Badge variant="destructive" className="text-xs">
                          {recommendation.discountPercentage}% OFF
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatPrice(recommendation.originalPrice || recommendation.discountedPrice || 0)}
                    </span>
                  )}
                </div>
              )}

              {/* Contextual Tags */}
              {recommendation.contextualTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {recommendation.contextualTags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Recommendation Reason */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <TrendingUp className="h-4 w-4 inline mr-1" />
                  {recommendation.recommendationReason}
                </p>
              </div>

              {/* Contextual Factors (Mini Score Breakdown) */}
              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div className="text-center">
                  <div className="font-medium text-gray-900 dark:text-white">Location</div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {Math.round(recommendation.contextualFactors.locationMatch * 100)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900 dark:text-white">Interest</div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {Math.round(recommendation.contextualFactors.interestMatch * 100)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900 dark:text-white">Context</div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {Math.round(recommendation.contextualFactors.travelContext * 100)}%
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  View Details
                </Button>
                <Button size="sm" variant="outline">
                  Save
                </Button>
                {recommendation.discountedPrice && (
                  <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700">
                    Claim Offer
                  </Button>
                )}
              </div>

              {/* Valid Until */}
              {recommendation.validUntil && (
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="h-3 w-3" />
                  Valid until {new Date(recommendation.validUntil).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ContextualBusinessRecommendations;