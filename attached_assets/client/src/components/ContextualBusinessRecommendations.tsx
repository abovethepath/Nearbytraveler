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
        {/* Grid layout matching events widget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {data.recommendations.map((recommendation, index) => (
            <Card
              key={`${recommendation.businessId}-${index}-${recommendation.title.substring(0, 10)}`}
              className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 min-h-[400px] flex flex-col"
              onClick={() => window.open(`/deals?businessId=${recommendation.businessId}`, '_blank')}
            >
              {/* Business Photo Header - matches event card structure */}
              <div 
                className="relative h-32 bg-cover bg-center"
                style={{
                  backgroundImage: recommendation.imageUrl ? `url('${recommendation.imageUrl}')` : `url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-xs bg-white/90 dark:bg-gray-800/90 dark:text-white backdrop-blur-sm">{recommendation.category || 'Business'}</Badge>
                </div>
                {recommendation.discountPercentage && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="destructive" className="text-xs">
                      {recommendation.discountPercentage}% OFF
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-4 flex-1 flex flex-col">
                <div className="mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">{recommendation.title}</h3>
                </div>
                
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {recommendation.businessName} • {recommendation.businessType}
                </p>
                
                {recommendation.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{recommendation.description}</p>
                )}

                <div className="space-y-1 text-xs text-gray-500 dark:text-gray-300 flex-1">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-500 dark:text-gray-300">{recommendation.location}</span>
                  </div>
                  
                  {/* Match Score */}
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="text-gray-500 dark:text-gray-300">
                      {Math.round(recommendation.relevanceScore * 100)}% match • {getScoreLabel(recommendation.relevanceScore)}
                    </span>
                  </div>

                  {/* Pricing */}
                  {(recommendation.originalPrice || recommendation.discountedPrice) && (
                    <div className="flex items-center gap-2 mt-2">
                      {recommendation.discountedPrice && recommendation.originalPrice ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-green-600">
                            {formatPrice(recommendation.discountedPrice)}
                          </span>
                          <span className="text-xs text-gray-500 line-through">
                            {formatPrice(recommendation.originalPrice)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatPrice(recommendation.originalPrice || recommendation.discountedPrice || 0)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Contextual Tags */}
                  {recommendation.contextualTags && recommendation.contextualTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {recommendation.contextualTags.slice(0, 2).map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs px-1 py-0 h-4 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                          {tag}
                        </Badge>
                      ))}
                      {recommendation.contextualTags.length > 2 && (
                        <Badge variant="outline" className="text-xs px-1 py-0 h-4 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600">
                          +{recommendation.contextualTags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Valid Until */}
                  {recommendation.validUntil && (
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-orange-500 dark:text-orange-400" />
                      <span className="text-xs text-orange-600 dark:text-orange-400">Valid until {new Date(recommendation.validUntil).toLocaleDateString()}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-blue-600 font-medium dark:text-blue-400">
                      <TrendingUp className="w-3 h-3 inline mr-1 dark:text-blue-400" />
                      {getScoreLabel(recommendation.relevanceScore)}
                    </span>
                    <Button 
                      size="sm" 
                      className="h-6 px-2 text-xs hover:scale-105 active:scale-95 transition-transform bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/deals?businessId=${recommendation.businessId}`, '_blank');
                      }}
                    >
                      View Deal
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ContextualBusinessRecommendations;