import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Star, ThumbsUp, Shield, User, MessageCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/App';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Reference {
  id: number;
  reviewerId: number;
  revieweeId: number;
  experience: 'positive' | 'neutral' | 'negative';
  content: string;
  createdAt: string;
  reviewer: {
    id: number;
    name: string;
    username: string;
    profileImage: string | null;
  };
}

export function ReferenceSystem({ isOwnProfile = false, userId }: { isOwnProfile?: boolean; userId?: number }) {
  const { user } = useAuth();
  const [showWriteReference, setShowWriteReference] = useState(false);
  const [showPrivateReference, setShowPrivateReference] = useState(false);
  const [isEditingReference, setIsEditingReference] = useState(false);
  const [referenceData, setReferenceData] = useState({
    experience: 'positive' as const,
    content: ''
  });
  const [privateReferenceData, setPrivateReferenceData] = useState({
    category: 'feedback' as const,
    content: ''
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: referencesData } = useQuery({
    queryKey: [`/api/users/${userId}/references`],
    enabled: !!(userId)
  });

  const references = (referencesData as any)?.references || [];
  const referenceCounts = (referencesData as any)?.counts || { total: 0, positive: 0, negative: 0, neutral: 0 };

  // Check if user has already written a reference for this person
  const { data: existingReferenceData } = useQuery({
    queryKey: [`/api/user-references/check`, user?.id, userId],
    queryFn: async () => {
      if (!user?.id || !userId || isOwnProfile) return { exists: false, reference: null };
      const response = await fetch(`/api/user-references/check/${user.id}/${userId}`);
      if (!response.ok) throw new Error('Failed to check existing reference');
      const data = await response.json();
      console.log('🔍 REFERENCE CHECK RESULT:', { 
        reviewerId: user.id, 
        revieweeId: userId, 
        exists: data.exists, 
        hasReference: !!data.reference,
        data 
      });
      return data;
    },
    enabled: !!(user?.id && userId && !isOwnProfile)
  });

  const submitReference = useMutation({
    mutationFn: async (data: { experience: string; content: string }) => {
      if (!data.content || data.content.trim().length === 0) {
        throw new Error('Reference content is required');
      }

      if (!user?.id || !userId) {
        throw new Error('User authentication required');
      }

      const method = isEditingReference ? 'PUT' : 'POST';
      const url = isEditingReference 
        ? `/api/user-references/${existingReferenceData?.reference?.id}`
        : '/api/user-references';

      const response = await apiRequest(method, url, {
        revieweeId: userId,
        reviewerId: user.id,
        experience: data.experience,
        content: data.content.trim()
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Reference submission error:', errorData);
        throw new Error(errorData || 'Failed to submit reference');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/references`] });
      queryClient.invalidateQueries({ queryKey: [`/api/user-references/check`, user?.id, userId] });
      setShowWriteReference(false);
      setIsEditingReference(false);
      setReferenceData({ experience: 'positive', content: '' });
      toast({
        title: isEditingReference ? '✅ Reference Updated!' : '✅ Reference Submitted!',
        description: isEditingReference ? 'Your reference has been updated and is now visible on their profile.' : 'Your reference has been posted and is now visible on their profile.',
        duration: 5000,
      });
    },
    onError: (error: any) => {
      console.error('Reference submission error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to submit reference. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const submitPrivateReference = useMutation({
    mutationFn: async (data: { category: string; content: string }) => {
      if (!data.content || data.content.trim().length === 0) {
        throw new Error('Message content is required');
      }

      if (!user?.id) {
        throw new Error('User authentication required');
      }

      const response = await apiRequest('POST', '/api/support/private-reference', {
        userId: user.id,
        targetUserId: userId,
        category: data.category,
        content: data.content.trim(),
        anonymous: true
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Private reference submission error:', errorData);
        throw new Error(errorData || 'Failed to submit private message');
      }

      return response.json();
    },
    onSuccess: () => {
      setShowPrivateReference(false);
      setPrivateReferenceData({ category: 'feedback', content: '' });
      toast({
        title: '✅ Private Reference Sent!',
        description: 'Your confidential message has been sent to our support team for review.',
        duration: 5000,
      });
    },
    onError: (error: any) => {
      console.error('Private reference submission error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to send private reference. Please try again.',
        variant: 'destructive',
      });
    }
  });

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

  const handleSubmitReference = () => {
    if (!referenceData.content.trim() || referenceData.content.trim().length < 10) {
      toast({
        title: "Validation Error",
        description: "Please write at least 10 characters for your reference.",
        variant: "destructive",
      });
      return;
    }
    submitReference.mutate(referenceData);
  };

  const handleWriteReference = () => {
    if (!user?.id) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to write a reference.',
        variant: 'destructive'
      });
      return;
    }

    if (existingReferenceData?.hasReference && existingReferenceData.reference) {
      setIsEditingReference(true);
      setReferenceData({
        experience: existingReferenceData.reference.experience || 'positive',
        content: existingReferenceData.reference.content || ''
      });
    } else {
      setIsEditingReference(false);
      setReferenceData({ experience: 'positive', content: '' });
    }
    setShowWriteReference(!showWriteReference);
  };

  const handlePrivateReference = () => {
    if (!user?.id) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to send a private reference.',
        variant: 'destructive'
      });
      return;
    }
    setShowPrivateReference(!showPrivateReference);
  };

  const handleSubmitPrivateReference = () => {
    if (!privateReferenceData.content.trim() || privateReferenceData.content.trim().length < 10) {
      toast({
        title: "Validation Error",
        description: "Please write at least 10 characters for your message.",
        variant: "destructive",
      });
      return;
    }
    submitPrivateReference.mutate(privateReferenceData);
  };

  return (
    <div className="space-y-6">
      {/* References Summary Card */}
      <Card className="border border-black dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Community References
            </CardTitle>
            {!isOwnProfile && (
              <div className="flex gap-2">
                <Button
                  onClick={handleWriteReference}
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600"
                >
                  {(() => {
                    const buttonText = showWriteReference ? 'Cancel' : (existingReferenceData?.hasReference ? 'Edit Reference' : 'Write Reference');
                    console.log('🔧 BUTTON TEXT LOGIC:', { 
                      showWriteReference, 
                      hasReferenceValue: existingReferenceData?.hasReference, 
                      existingData: existingReferenceData,
                      buttonText 
                    });
                    return buttonText;
                  })()}
                </Button>
                <Button
                  onClick={handlePrivateReference}
                  size="sm"
                  variant="outline"
                  className="border-orange-300 hover:bg-orange-50"
                >
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {showPrivateReference ? 'Cancel' : 'Private Reference'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Total References Count at Top */}
          <div className="text-center mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{referenceCounts.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total References</div>
          </div>
          
          {/* Positive, Neutral, Negative in Mobile-Friendly Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {referenceCounts.positive}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Positive</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                {referenceCounts.neutral}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Neutral</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-red-600">
                {referenceCounts.negative}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Negative</div>
            </div>
          </div>

          {showWriteReference && (
            <div className="space-y-4 p-6 border-2 border-gray-300 rounded-lg bg-white dark:bg-white shadow-xl mb-6 opacity-100 relative z-10">
              <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-900">{isEditingReference ? 'Edit Your Reference' : 'Write a Reference'}</h4>
              {isEditingReference && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                  You can only have one reference per person. Updating this will replace your previous reference.
                </p>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-700 block">
                  Experience Type *
                </label>
                <select
                  value={referenceData.experience}
                  onChange={(e) => setReferenceData(prev => ({ ...prev, experience: e.target.value as any }))}
                  className="w-full p-3 border rounded-md bg-white dark:bg-white dark:border-gray-300 dark:text-gray-900 min-h-[48px]"
                  required
                >
                  <option value="positive">👍 Positive Experience</option>
                  <option value="neutral">😐 Neutral Experience</option>
                  <option value="negative">👎 Negative Experience</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-700 block">
                  Your Reference *
                </label>
                <textarea
                  value={referenceData.content}
                  onChange={(e) => setReferenceData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full p-3 border rounded-md bg-white dark:bg-white dark:border-gray-300 dark:text-gray-900 min-h-[120px] resize-none"
                  placeholder="Share your experience with this person... (minimum 10 characters)"
                  required
                  minLength={10}
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 dark:text-gray-500 text-right">
                  {referenceData.content.length}/500 characters
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={() => {
                    setShowWriteReference(false);
                    setIsEditingReference(false);
                    setReferenceData({ experience: 'positive', content: '' });
                  }}
                  variant="outline"
                  className="w-full sm:w-auto min-h-[48px]"
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReference}
                  disabled={submitReference.isPending || !referenceData.content.trim() || referenceData.content.trim().length < 10}
                  className="w-full sm:w-auto min-h-[48px] bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600"
                  type="button"
                >
                  {submitReference.isPending ? 'Submitting...' : (isEditingReference ? 'Update Reference' : 'Submit Reference')}
                </Button>
              </div>
            </div>
          )}

          {showPrivateReference && (
            <div className="space-y-4 p-6 border-2 border-orange-300 rounded-lg bg-white dark:bg-white shadow-xl mb-6 opacity-100 relative z-10">
              <h4 className="font-semibold text-lg text-orange-700 dark:text-orange-300 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
Private Reference to Support Team
              </h4>
              <p className="text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-md">
                Only support sees this. If you have an issue with someone, use this button. Your message will be sent anonymously to our support team for review.
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-700 block">
                  Message Category *
                </label>
                <select
                  value={privateReferenceData.category}
                  onChange={(e) => setPrivateReferenceData(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full p-3 border rounded-md bg-white dark:bg-white dark:border-gray-300 dark:text-gray-900 min-h-[48px]"
                  required
                >
                  <option value="feedback">💬 General Feedback</option>
                  <option value="safety">⚠️ Safety Concern</option>
                  <option value="inappropriate">🚫 Inappropriate Behavior</option>
                  <option value="spam">📧 Spam/Fake Profile</option>
                  <option value="other">❓ Other Issue</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-700 block">
                  Your Message *
                </label>
                <textarea
                  value={privateReferenceData.content}
                  onChange={(e) => setPrivateReferenceData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full p-3 border rounded-md bg-white dark:bg-white dark:border-gray-300 dark:text-gray-900 min-h-[120px] resize-none"
                  placeholder="Please describe your concern or feedback... (minimum 10 characters)"
                  required
                  minLength={10}
                  maxLength={1000}
                />
                <div className="text-xs text-gray-500 dark:text-gray-500 text-right">
                  {privateReferenceData.content.length}/1000 characters
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={() => {
                    setShowPrivateReference(false);
                    setPrivateReferenceData({ category: 'feedback', content: '' });
                  }}
                  variant="outline"
                  className="w-full sm:w-auto min-h-[48px]"
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitPrivateReference}
                  disabled={submitPrivateReference.isPending || !privateReferenceData.content.trim() || privateReferenceData.content.trim().length < 10}
                  className="w-full sm:w-auto min-h-[48px] bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  type="button"
                >
                  {submitPrivateReference.isPending ? 'Sending...' : 'Send Private Reference'}
                </Button>
              </div>
            </div>
          )}

          {references.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No references yet</p>
              <p className="text-sm">
                {isOwnProfile 
                  ? "Connect with community members to receive your first reference"
                  : "Be the first to write a reference for this member"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {references.map((reference: Reference) => (
                <div key={reference.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {reference.reviewer?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold">@{reference.reviewer?.username || 'Unknown User'}</div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-1 py-0 flex-shrink-0 ml-2 ${getExperienceColor(reference.experience)} border-current`}
                        >
                          {reference.experience}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(reference.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">{reference.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}