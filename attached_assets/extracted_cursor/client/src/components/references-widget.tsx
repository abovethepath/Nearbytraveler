import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Users, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SimpleAvatar } from "@/components/simple-avatar";
import { useLocation } from "wouter";

interface Reference {
  id: number;
  reviewerId: number;
  revieweeId: number;
  experience: "positive" | "neutral" | "negative";
  content: string;
  createdAt: string;
  reviewer: {
    id: number;
    name: string;
    username: string;
    profileImage: string | null;
  };
}

interface ReferencesWidgetProps {
  userId: number;
}

export default function ReferencesWidget({ userId }: ReferencesWidgetProps) {
  const [, setLocation] = useLocation();

  const { data: references = [], isLoading: referencesLoading } = useQuery<Reference[]>({
    queryKey: [`/api/users/${userId}/references`],
  });

  const referenceCount = references.length;
  const recentReferences = references.slice(0, 3);

  const getExperienceColor = (experience: string) => {
    switch (experience) {
      case "positive":
        return "text-green-600 dark:text-green-400 border-green-600 dark:border-green-400";
      case "negative":
        return "text-red-600 dark:text-red-400 border-red-600 dark:border-red-400";
      default:
        return "text-yellow-600 dark:text-yellow-400 border-yellow-600 dark:border-yellow-400";
    }
  };

  if (referencesLoading) {
    return (
      <Card className="h-full bg-gradient-to-br from-blue-50 via-blue-50 to-orange-50 dark:bg-gradient-to-br dark:from-blue-900/20 dark:via-blue-900/20 dark:to-orange-900/20 border-blue-200 dark:border-blue-600">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-lg text-blue-800 dark:text-blue-200">References</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 references-widget" data-component="references">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-lg text-blue-800 dark:text-blue-200">References</CardTitle>
          </div>
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-600">
            {referenceCount}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {referenceCount === 0 ? (
          <div className="text-center py-6">
            <Users className="w-12 h-12 text-blue-300 dark:text-blue-600 mx-auto mb-3" />
            <p className="text-sm text-blue-500 dark:text-blue-400 mb-2">No references yet</p>
            <p className="text-xs text-blue-400 dark:text-blue-500">
              References from connections will appear here
            </p>
          </div>
        ) : (
          <>
            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-600">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                  {references.filter(r => r.experience === "positive").length}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Positive</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                  {references.filter(r => r.experience === "neutral").length}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Neutral</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                  {references.filter(r => r.experience === "negative").length}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Negative</div>
              </div>
            </div>

            {/* Recent References */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Recent References</h4>
              {recentReferences.map((reference) => (
                <div
                  key={reference.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border bg-blue-50/70 dark:bg-blue-900/30 border-blue-200 dark:border-blue-600"
                >
                  <SimpleAvatar 
                    user={reference.reviewer} 
                    size="sm" 
                    className="flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        @{reference.reviewer.username}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-1.5 py-0.5 ${getExperienceColor(reference.experience)} border-current flex-shrink-0 ml-2`}
                      >
                        {reference.experience}
                      </Badge>
                    </div>
                    <p className="text-base text-black dark:text-white line-clamp-2 font-bold">
                      {reference.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Button */}
            {referenceCount > 3 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-700/50 bg-transparent"
                onClick={() => setLocation('/references')}
              >
                View All References
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}