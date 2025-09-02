import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, CheckCircle, Award, Users, MessageSquare, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SimpleAvatar } from './simple-avatar';

interface User {
  id: number;
  username: string;
  name: string;
  profileImage: string | null;
}

interface Vouch {
  id: number;
  vouchMessage: string;
  vouchCategory: string;
  createdAt: string;
  voucher: User;
}

interface CanVouchResponse {
  canVouch: boolean;
  reason?: string;
  vouchesReceived?: number;
}

interface VouchWidgetProps {
  userId: number;
  isOwnProfile: boolean;
  currentUserId?: number;
}

export function VouchWidget({ userId, isOwnProfile, currentUserId }: VouchWidgetProps) {
  const [vouchMessage, setVouchMessage] = useState('');
  const [vouchCategory, setVouchCategory] = useState('general');
  const [showVouchDialog, setShowVouchDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get vouches received by this user
  const { data: vouches = [] } = useQuery<Vouch[]>({
    queryKey: [`/api/users/${userId}/vouches`],
    enabled: !!userId
  });

  // Get vouches given by this user (for own profile only)
  const { data: vouchesGiven = [] } = useQuery<Vouch[]>({
    queryKey: [`/api/users/${userId}/vouches-given`],
    enabled: isOwnProfile && !!userId
  });

  // Check if current user can vouch (for viewing other profiles)
  const { data: canVouchData } = useQuery<CanVouchResponse>({
    queryKey: [`/api/users/${currentUserId}/can-vouch?targetUserId=${userId}`],
    enabled: !isOwnProfile && !!currentUserId && !!userId
  });

  // Get vouch network stats
  const { data: networkStats } = useQuery({
    queryKey: [`/api/users/${userId}/vouch-network`],
    enabled: !!userId
  });

  // Create vouch mutation
  const createVouchMutation = useMutation({
    mutationFn: async (data: { voucherUserId: number; vouchedUserId: number; vouchMessage: string; vouchCategory: string }) => {
      return apiRequest('POST', '/api/vouches', data);
    },
    onSuccess: () => {
      toast({
        title: "Vouch created successfully!",
        description: "This member has been notified that you vouched for them."
      });
      setShowVouchDialog(false);
      setVouchMessage('');
      setVouchCategory('general');
      // Refresh vouches and network stats
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/vouches`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/can-vouch`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/vouch-network`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create vouch",
        variant: "destructive"
      });
    }
  });

  const handleVouch = () => {
    if (!currentUserId || !vouchMessage.trim()) return;
    
    createVouchMutation.mutate({
      voucherUserId: currentUserId,
      vouchedUserId: userId,
      vouchMessage: vouchMessage.trim(),
      vouchCategory
    });
  };

  const vouchCategories = [
    { value: 'general', label: 'General Endorsement' },
    { value: 'trustworthy', label: 'Trustworthy' },
    { value: 'helpful', label: 'Helpful' },
    { value: 'knowledgeable', label: 'Knowledgeable' },
    { value: 'great_companion', label: 'Great Travel Companion' },
    { value: 'local_expert', label: 'Local Expert' }
  ];

  if (isOwnProfile && (vouches.length === 0 && vouchesGiven.length === 0)) {
    return (
      <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-2">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-lg text-gray-900 dark:text-white">VOUCH Credibility System</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Get vouched for by trusted members to build credibility and vouch for others
          </p>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Only vouched members can vouch for others. Make friends, connect with others and you too can get vouched for!
          </p>
        </CardContent>
      </Card>
    );
  }

  // For other profiles, show only CTA button (active or disabled based on vouch status)
  if (!isOwnProfile) {
    return (
      <div>
        {/* CTA button - always visible but disabled if user can't vouch */}
        {currentUserId && (
          <>
            {canVouchData?.canVouch ? (
              <Dialog open={showVouchDialog} onOpenChange={setShowVouchDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Vouch for This Person
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-white">Important: Only vouch for people you truly know</DialogTitle>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mt-2">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>WARNING:</strong> You should only vouch for people you have actually met and know personally. 
                        Vouching helps build trust in our community, so please use this responsibly.
                      </p>
                    </div>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-white">Why are you vouching for this person?</label>
                      <Textarea
                        placeholder="Share why you're vouching for this person (e.g., 'Met them at the coffee meetup, very trustworthy and helpful')"
                        value={vouchMessage}
                        onChange={(e) => setVouchMessage(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleVouch}
                        disabled={!vouchMessage.trim() || createVouchMutation.isPending}
                        className="flex-1"
                      >
                        {createVouchMutation.isPending ? 'Creating...' : 'Confirm Vouch'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowVouchDialog(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Card className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-600">
                <CardContent className="p-4 space-y-3">
                  <Button 
                    className="w-full bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-400 dark:border-gray-600 cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-700" 
                    size="sm" 
                    disabled
                  >
                    <CheckCircle className="h-4 w-4 mr-2 opacity-60" />
                    Vouch for This Person
                  </Button>
                  <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg p-3">
                    <p className="text-sm text-amber-800 dark:text-amber-200 text-center font-medium">
                      🔒 {canVouchData?.reason || 'You must be vouched by someone to unlock vouching'}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 text-center mt-1">
                      Get vouched by trusted members to unlock this feature!
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    );
  }

  // For own profile, show full widget
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
          <Shield className="h-5 w-5" />
          VOUCH System
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-6">
          <div className="text-4xl font-bold text-blue-900 dark:text-blue-100 mb-2">
            {vouches.length}
          </div>
          <div className="text-lg text-gray-700 dark:text-gray-200 mb-4">
            Total Vouches
          </div>
        </div>
      </CardContent>
    </Card>
  );
}