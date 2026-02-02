import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, getApiBaseUrl } from '@/lib/queryClient';
import { Users, UserPlus, Baby, Link, Copy, X, Check, Mail, MessageSquare, MessageCircle } from 'lucide-react';
import { TravelCrewChat } from './TravelCrewChat';

interface Companion {
  id: number;
  label: string;
  ageBracket?: string;
  notesPrivate?: string;
}

interface CrewMember {
  id: number;
  userId: number;
  role: string;
  username: string;
  name?: string;
  profileImage?: string;
}

interface CrewCompanion {
  id: number;
  companionId: number;
  label: string;
  ageBracket?: string;
}

interface TravelCrewProps {
  travelPlanId: number;
  userId: number;
  isOwner: boolean;
}

export function TravelCrew({ travelPlanId, userId, isOwner }: TravelCrewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddCompanion, setShowAddCompanion] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [newCompanion, setNewCompanion] = useState({ label: '', ageBracket: '', notesPrivate: '' });
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: crewData, isLoading } = useQuery({
    queryKey: ['/api/travel-plans', travelPlanId, 'crew'],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/travel-plans/${travelPlanId}/crew`);
      if (!res.ok) return { members: [], companions: [] };
      return res.json();
    }
  });

  const { data: userCompanions = [] } = useQuery<Companion[]>({
    queryKey: ['/api/companions'],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/companions`);
      if (!res.ok) return [];
      return res.json();
    }
  });

  const createCompanionMutation = useMutation({
    mutationFn: async (data: { label: string; ageBracket?: string; notesPrivate?: string }) => {
      return apiRequest('POST', '/api/companions', data).then(r => r.json());
    },
    onSuccess: (newCompanion) => {
      queryClient.invalidateQueries({ queryKey: ['/api/companions'] });
      addCompanionToCrewMutation.mutate(newCompanion.id);
      setShowAddCompanion(false);
      setNewCompanion({ label: '', ageBracket: '', notesPrivate: '' });
    },
    onError: () => toast({ title: 'Failed to add companion', variant: 'destructive' })
  });

  const addCompanionToCrewMutation = useMutation({
    mutationFn: async (companionId: number) => {
      return apiRequest('POST', `/api/travel-plans/${travelPlanId}/crew/companions`, { companionId }).then(r => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/travel-plans', travelPlanId, 'crew'] });
      toast({ title: 'Companion added to trip!' });
    },
    onError: () => toast({ title: 'Failed to add companion to trip', variant: 'destructive' })
  });

  const removeCompanionMutation = useMutation({
    mutationFn: async (companionId: number) => {
      return apiRequest('DELETE', `/api/travel-plans/${travelPlanId}/crew/companions/${companionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/travel-plans', travelPlanId, 'crew'] });
      toast({ title: 'Companion removed from trip' });
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      return apiRequest('DELETE', `/api/travel-plans/${travelPlanId}/crew/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/travel-plans', travelPlanId, 'crew'] });
      toast({ title: 'Member removed from crew' });
    }
  });

  const createInviteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/travel-plans/${travelPlanId}/crew/invite`, {}).then(r => r.json());
    },
    onSuccess: (data) => {
      setInviteLink(data.inviteUrl);
      setShowInvite(true);
    },
    onError: () => toast({ title: 'Failed to create invite link', variant: 'destructive' })
  });

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Invite link copied!' });
  };

  const shareViaEmail = () => {
    window.open(`mailto:?subject=Join my trip!&body=I'd love for you to join my travel crew! Click here to join: ${encodeURIComponent(inviteLink)}`);
  };

  const shareViaSMS = () => {
    window.open(`sms:?body=Join my travel crew! ${encodeURIComponent(inviteLink)}`);
  };

  const members: CrewMember[] = crewData?.members || [];
  const crewCompanions: CrewCompanion[] = crewData?.companions || [];

  const availableCompanions = userCompanions.filter(
    c => !crewCompanions.some(cc => cc.companionId === c.id)
  );

  const ageBrackets = [
    { value: '0-4', label: 'Infant/Toddler (0-4)' },
    { value: '5-9', label: 'Young Child (5-9)' },
    { value: '10-13', label: 'Older Child (10-13)' },
    { value: '14-17', label: 'Teen (14-17)' },
    { value: 'adult', label: 'Adult' }
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Travel Crew</h3>
        </div>
        <div className="flex gap-2">
          {(members.length > 0 || isOwner) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChat(true)}
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Chat
            </Button>
          )}
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => createInviteMutation.mutate()}
              disabled={createInviteMutation.isPending}
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              <Link className="w-4 h-4 mr-1" />
              Invite
            </Button>
          )}
        </div>
      </div>

      {members.length === 0 && crewCompanions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="mb-2">No crew members yet</p>
          {isOwner && (
            <p className="text-sm">Add friends or companions traveling with you</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {members.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Friends</h4>
              <div className="space-y-2">
                {members.map(member => (
                  <div key={member.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-3">
                      {member.profileImage ? (
                        <img src={member.profileImage} className="w-8 h-8 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-orange-600 text-sm font-medium">
                            {(member.name || member.username || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-gray-900 dark:text-white">{member.name || member.username}</span>
                      {member.role === 'owner' && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">Organizer</span>
                      )}
                    </div>
                    {isOwner && member.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMemberMutation.mutate(member.userId)}
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {crewCompanions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Companions</h4>
              <div className="space-y-2">
                {crewCompanions.map(comp => (
                  <div key={comp.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Baby className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-gray-900 dark:text-white">{comp.label}</span>
                      {comp.ageBracket && (
                        <span className="text-xs text-gray-500">({comp.ageBracket})</span>
                      )}
                    </div>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCompanionMutation.mutate(comp.companionId)}
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isOwner && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Dialog open={showAddCompanion} onOpenChange={setShowAddCompanion}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Companion (Kids/Family)
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-gray-900">
              <DialogHeader>
                <DialogTitle>Add Companion</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {availableCompanions.length > 0 && (
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300 mb-2 block">Add existing companion</Label>
                    <div className="space-y-2">
                      {availableCompanions.map(c => (
                        <Button
                          key={c.id}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            addCompanionToCrewMutation.mutate(c.id);
                            setShowAddCompanion(false);
                          }}
                        >
                          <Baby className="w-4 h-4 mr-2" />
                          {c.label} {c.ageBracket && `(${c.ageBracket})`}
                        </Button>
                      ))}
                    </div>
                    <div className="my-4 flex items-center gap-2">
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                      <span className="text-sm text-gray-500">or create new</span>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Name/Label</Label>
                  <Input
                    placeholder="e.g., Sophie, Kid 1, Dad"
                    value={newCompanion.label}
                    onChange={e => setNewCompanion(prev => ({ ...prev, label: e.target.value }))}
                  />
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Age Bracket (optional)</Label>
                  <Select value={newCompanion.ageBracket || 'none'} onValueChange={v => setNewCompanion(prev => ({ ...prev, ageBracket: v === 'none' ? '' : v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select age bracket" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      {ageBrackets.map(b => (
                        <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Private Notes (optional)</Label>
                  <Input
                    placeholder="Allergies, special needs, etc."
                    value={newCompanion.notesPrivate}
                    onChange={e => setNewCompanion(prev => ({ ...prev, notesPrivate: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">Only visible to you</p>
                </div>

                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => createCompanionMutation.mutate(newCompanion)}
                  disabled={!newCompanion.label.trim() || createCompanionMutation.isPending}
                >
                  Add Companion
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>Invite to Travel Crew</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Share this link with friends to invite them to join your trip:
            </p>

            <div className="flex gap-2">
              <Input value={inviteLink} readOnly className="flex-1" />
              <Button onClick={copyInviteLink} variant="outline">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={shareViaEmail}>
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button variant="outline" className="flex-1" onClick={shareViaSMS}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Text
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Link expires in 7 days
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {showChat && (
        <TravelCrewChat
          travelPlanId={travelPlanId}
          userId={userId}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}
