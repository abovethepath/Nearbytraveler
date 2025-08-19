import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SimpleAvatar } from '@/components/simple-avatar';
import { MessageSquare, Users, ChevronDown, ChevronUp } from 'lucide-react';

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

const getExperienceColor = (experience: string) => {
  switch (experience) {
    case 'positive':
      return 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30';
    case 'negative':
      return 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30';
    default:
      return 'text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30';
  }
};

function ReferencesWidgetNew({ userId }: ReferencesWidgetProps) {
  const [expandedReference, setExpandedReference] = useState<number | null>(null);
  const [showAllReferences, setShowAllReferences] = useState(false);
  
  const { data: referencesData = { references: [], counts: { total: 0, positive: 0, negative: 0, neutral: 0 } } } = useQuery({
    queryKey: [`/api/users/${userId}/references`],
  });

  const references = referencesData.references || [];
  const counts = referencesData.counts || { total: 0, positive: 0, negative: 0, neutral: 0 };
  const referenceCount = references.length;
  const displayedReferences = showAllReferences ? references : references.slice(0, 3);

  const toggleReference = (referenceId: number) => {
    setExpandedReference(expandedReference === referenceId ? null : referenceId);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 references-widget" data-component="references">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h5 className="text-lg font-semibold dark:text-white">References</h5>
        </div>
        <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 text-xs px-2 py-1 rounded-md">
          {referenceCount}
        </span>
      </div>
      
      <div className="space-y-3">
        {referenceCount === 0 ? (
          <div className="text-center py-4">
            <Users className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">No references yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              References from connections will appear here
            </p>
          </div>
        ) : (
          <>
            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="text-center">
                <div className="text-sm font-medium text-green-700 dark:text-green-300">
                  {counts.positive}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Positive</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                  {counts.neutral}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Neutral</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-red-700 dark:text-red-300">
                  {counts.negative}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Negative</div>
              </div>
            </div>

            {/* Recent References */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-800 dark:text-gray-200 mb-1">Recent References</h4>
              {displayedReferences.map((reference) => {
                const isExpanded = expandedReference === reference.id;
                return (
                  <div
                    key={reference.id}
                    className="flex items-start space-x-2 p-2 rounded-lg border bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  >
                    <SimpleAvatar 
                      user={reference.reviewer?.id ? reference.reviewer : null} 
                      size="sm" 
                      className="flex-shrink-0 w-6 h-6"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                          @{reference.reviewer?.username || 'Unknown User'}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-md border ${getExperienceColor(reference.experience)} border-current flex-shrink-0 ml-2`}>
                          {reference.experience}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className={`text-xs text-gray-700 dark:text-gray-300 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                          {reference.content}
                        </p>
                        {reference.content.length > 100 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-0"
                            onClick={() => toggleReference(reference.id)}
                          >
                            {isExpanded ? (
                              <>Show Less <ChevronUp className="w-3 h-3 ml-1" /></>
                            ) : (
                              <>Read More <ChevronDown className="w-3 h-3 ml-1" /></>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View All/Show Less Button */}
            {referenceCount > 3 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 bg-transparent text-xs h-7"
                onClick={() => setShowAllReferences(!showAllReferences)}
              >
                {showAllReferences ? (
                  <>
                    Show Recent Only
                    <ChevronUp className="w-3 h-3 ml-1" />
                  </>
                ) : (
                  <>
                    View All {referenceCount} References
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ReferencesWidgetNew;