import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Star, ThumbsUp, ThumbsDown, Shield, User, Calendar, MessageCircle } from 'lucide-react';
import { useAuth } from '@/App';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Reference {
  id: number;
  fromUserId: number;
  toUserId: number;
  fromUser: {
    username: string;
    name: string;
    profileImage?: string;
  };
  referenceType: 'positive' | 'negative' | 'neutral';
  category: 'hosting' | 'surfing' | 'meetup' | 'travel_buddy' | 'local_guide';
  rating: number;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  helpfulVotes: number;
  userHelpfulVote?: boolean;
}

interface Verification {
  id: number;
  userId: number;
  verificationType: 'email' | 'phone' | 'government_id' | 'address' | 'social_media';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
  verifiedBy?: string;
}

export function ReferenceSystem({ isOwnProfile = false, userId }: { isOwnProfile?: boolean; userId?: number }) {
  const { user } = useAuth();
  const [showWriteReference, setShowWriteReference] = useState(false);
  const [newReference, setNewReference] = useState({
    referenceType: 'positive' as const,
    category: 'meetup' as const,
    rating: 5,
    title: '',
    content: '',
    isPublic: true
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: references = [] } = useQuery({
    queryKey: [`/api/references/${userId || user?.id}`],
    enabled: !!(userId || user?.id)
  });

  const { data: verifications = [] } = useQuery({
    queryKey: [`/api/verifications/${userId || user?.id}`],
    enabled: !!(userId || user?.id)
  });

  const { data: referenceStats } = useQuery({
    queryKey: [`/api/references/${userId || user?.id}/stats`],
    enabled: !!(userId || user?.id)
  });

  const createReferenceMutation = useMutation({
    mutationFn: async (data: typeof newReference) => {
      return apiRequest(`/api/references`, {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          toUserId: userId
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/references/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/references/${userId}/stats`] });
      setShowWriteReference(false);
      setNewReference({
        referenceType: 'positive',
        category: 'meetup',
        rating: 5,
        title: '',
        content: '',
        isPublic: true
      });
      toast({
        title: "Reference submitted",
        description: "Your reference has been posted and will help other community members",
      });
    },
    onError: (error) => {
      console.error('Error creating reference:', error);
      toast({
        title: "Error",
        description: "Failed to submit reference",
        variant: "destructive",
      });
    },
  });

  const voteHelpfulMutation = useMutation({
    mutationFn: async ({ referenceId, isHelpful }: { referenceId: number; isHelpful: boolean }) => {
      return apiRequest(`/api/references/${referenceId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ isHelpful }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/references/${userId}`] });
      toast({
        title: "Vote recorded",
        description: "Thank you for helping the community",
      });
    },
  });

  const categoryLabels = {
    hosting: 'Hosting Experience',
    surfing: 'Staying with Host',
    meetup: 'Social Meetup',
    travel_buddy: 'Travel Companion',
    local_guide: 'Local Guide Services'
  };

  const referenceTypeColors = {
    positive: 'bg-green-100 text-green-800 border-green-200',
    neutral: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    negative: 'bg-red-100 text-red-800 border-red-200'
  };

  const getVerificationIcon = (type: string) => {
    switch (type) {
      case 'email': return '📧';
      case 'phone': return '📱';
      case 'government_id': return '🆔';
      case 'address': return '🏠';
      case 'social_media': return '📲';
      default: return '✓';
    }
  };

  const handleCreateReference = () => {
    if (!newReference.title || !newReference.content) {
      toast({
        title: "Missing information",
        description: "Please fill in title and content",
        variant: "destructive",
      });
      return;
    }
    createReferenceMutation.mutate(newReference);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const averageRating = references.length > 0 
    ? (references.reduce((sum: number, ref: Reference) => sum + ref.rating, 0) / references.length).toFixed(1)
    : '0.0';

  const verifiedCount = verifications.filter((v: Verification) => v.verificationStatus === 'verified').length;

  return (
    <div className="space-y-6">
      {/* Verification Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Shield className={`h-6 w-6 ${verifiedCount > 0 ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="font-semibold">
                {verifiedCount} of 5 verifications completed
              </span>
            </div>
            {verifiedCount >= 3 && (
              <Badge className="bg-green-100 text-green-800">
                Highly Verified
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {['email', 'phone', 'government_id', 'address', 'social_media'].map((type) => {
              const verification = verifications.find((v: Verification) => v.verificationType === type);
              const isVerified = verification?.verificationStatus === 'verified';
              
              return (
                <div key={type} className={`p-3 rounded-lg border ${isVerified ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getVerificationIcon(type)}</span>
                    <span className="text-sm font-medium capitalize">
                      {type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="mt-1">
                    {isVerified ? (
                      <Badge className="bg-green-600 text-white text-xs">Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Not verified</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* References Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Community References
            </CardTitle>
            {!isOwnProfile && (
              <Button
                onClick={() => setShowWriteReference(!showWriteReference)}
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600"
              >
                {showWriteReference ? 'Cancel' : 'Write Reference'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{references.length}</div>
              <div className="text-sm text-gray-500">Total References</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl font-bold text-yellow-600">{averageRating}</span>
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="text-sm text-gray-500">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {references.filter((r: Reference) => r.referenceType === 'positive').length}
              </div>
              <div className="text-sm text-gray-500">Positive</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {references.filter((r: Reference) => r.referenceType === 'negative').length}
              </div>
              <div className="text-sm text-gray-500">Negative</div>
            </div>
          </div>

          {showWriteReference && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 mb-6">
              <h4 className="font-semibold">Write a Reference</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Reference Type</label>
                  <select
                    value={newReference.referenceType}
                    onChange={(e) => setNewReference(prev => ({ ...prev, referenceType: e.target.value as any }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="positive">Positive</option>
                    <option value="neutral">Neutral</option>
                    <option value="negative">Negative</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select
                    value={newReference.category}
                    onChange={(e) => setNewReference(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full p-2 border rounded-md"
                  >
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Rating (1-5 stars)</label>
                <div className="flex items-center gap-2 mt-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setNewReference(prev => ({ ...prev, rating: i + 1 }))}
                      className="p-1"
                    >
                      <Star
                        className={`h-6 w-6 ${i < newReference.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">{newReference.rating}/5</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={newReference.title}
                  onChange={(e) => setNewReference(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief summary of your experience"
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Your Experience</label>
                <Textarea
                  value={newReference.content}
                  onChange={(e) => setNewReference(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Share your experience to help other community members..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newReference.isPublic}
                  onChange={(e) => setNewReference(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="isPublic" className="text-sm">
                  Make this reference public (recommended for community safety)
                </label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateReference}
                  disabled={createReferenceMutation.isPending}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  {createReferenceMutation.isPending ? 'Submitting...' : 'Submit Reference'}
                </Button>
                <Button
                  onClick={() => setShowWriteReference(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <>
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
                      {reference.fromUser.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold">@{reference.fromUser.username}</div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-1 py-0 flex-shrink-0 ml-2 ${
                            reference.experience === 'positive' ? 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30' :
                              reference.experience === 'negative' ? 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-green-900/30' :
                              'text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-green-900/30'
                          } border-current`}
                        >
                          {reference.experience}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {categoryLabels[reference.category]} • {new Date(reference.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={referenceTypeColors[reference.referenceType]}>
                        {reference.referenceType}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {renderStars(reference.rating)}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">{reference.title}</h4>
                    <p className="text-gray-600 dark:text-gray-400">{reference.content}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => voteHelpfulMutation.mutate({ 
                          referenceId: reference.id, 
                          isHelpful: true 
                        })}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>Helpful ({reference.helpfulVotes})</span>
                      </button>
                    </div>
                    <div className="text-xs text-gray-400">
                      Reference #{reference.id}
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </>
        </CardContent>
      </Card>
    </div>
  );
}