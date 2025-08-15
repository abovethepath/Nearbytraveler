import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Zap, Clock, MapPin, Users, Coffee, Plus, DollarSign, Tag, Calendar, Percent } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/App';
import { authStorage } from '@/lib/auth';
import { format, addDays, addHours } from 'date-fns';
import type { QuickDeal, InsertQuickDeal } from '@shared/schema';

interface NewDeal {
  title: string;
  description: string;
  dealType: string;
  category: string;
  discountAmount: string;
  originalPrice: string;
  salePrice: string;
  validUntil: string;
  maxRedemptions: number;
  requiresReservation: boolean;
  dealCode: string;
  terms: string;
  availability: string;
}

export function QuickDealsWidget({ city, profileUserId, showCreateForm: externalShowCreateForm, onCloseCreateForm }: { city?: string; profileUserId?: number; showCreateForm?: boolean; onCloseCreateForm?: () => void }) {
  const { user } = useAuth();
  const [internalShowCreateForm, setInternalShowCreateForm] = useState(false);
  const showCreateForm = externalShowCreateForm || internalShowCreateForm;
  const [expandedDeal, setExpandedDeal] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user data like navbar does (authStorage is more reliable)
  const actualUser = user || authStorage.getUser();
  
  // Debug logging
  React.useEffect(() => {
    console.log('🔥 QuickDealsWidget state update:', {
      externalShowCreateForm,
      internalShowCreateForm,
      finalShowCreateForm: showCreateForm
    });
  }, [externalShowCreateForm, internalShowCreateForm, showCreateForm]);

  const [newDeal, setNewDeal] = useState<NewDeal>({
    title: '',
    description: '',
    dealType: 'discount',
    category: 'food',
    discountAmount: '',
    originalPrice: '',
    salePrice: '',
    validUntil: format(addDays(new Date(), 1), 'yyyy-MM-dd\'T\'HH:mm'),
    maxRedemptions: 50,
    requiresReservation: false,
    dealCode: '',
    terms: '',
    availability: 'today'
  });

  // Fetch existing quick deals - must be called unconditionally before any returns
  const { data: quickDeals, isLoading } = useQuery({
    queryKey: ['/api/quick-deals', city, profileUserId],
    queryFn: async () => {
      let url = '/api/quick-deals';
      const params = new URLSearchParams();
      
      if (city) params.append('city', city);
      if (profileUserId) params.append('businessId', profileUserId.toString());
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          ...(actualUser?.id && { 'x-user-id': actualUser.id.toString() })
        }
      });
      if (!response.ok) throw new Error('Failed to fetch quick deals');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
    enabled: actualUser?.userType === 'business' // Only run query for business users
  });

  // Create deal mutation
  const createDealMutation = useMutation({
    mutationFn: async (dealData: InsertQuickDeal) => {
      return apiRequest('POST', '/api/quick-deals', dealData);
    },
    onSuccess: () => {
      toast({
        title: "Deal Created!",
        description: "Your quick deal is now live and visible to customers."
      });
      setInternalShowCreateForm(false);
      if (onCloseCreateForm) onCloseCreateForm();
      setNewDeal({
        title: '',
        description: '',
        dealType: 'discount',
        category: 'food',
        discountAmount: '',
        originalPrice: '',
        salePrice: '',
        validUntil: format(addDays(new Date(), 1), 'yyyy-MM-dd\'T\'HH:mm'),
        maxRedemptions: 50,
        requiresReservation: false,
        dealCode: '',
        terms: '',
        availability: 'today'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quick-deals'] });
    },
    onError: (error) => {
      console.error('Deal creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create deal. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleCreateDeal = () => {
    if (!newDeal.title || !newDeal.description || !newDeal.discountAmount) {
      toast({
        title: "Missing Information",
        description: "Please fill in title, description, and discount amount.",
        variant: "destructive"
      });
      return;
    }

    const dealData: InsertQuickDeal = {
      businessId: actualUser!.id,
      title: newDeal.title,
      description: newDeal.description,
      dealType: newDeal.dealType,
      category: newDeal.category,
      location: `${actualUser?.hometownCity}, ${actualUser?.hometownState}`,
      street: '',
      city: actualUser?.hometownCity || '',
      state: actualUser?.hometownState || '',
      country: actualUser?.hometownCountry || 'United States',
      zipcode: '',
      discountAmount: newDeal.discountAmount,
      originalPrice: newDeal.originalPrice || null,
      salePrice: newDeal.salePrice || null,
      validFrom: new Date(),
      validUntil: new Date(newDeal.validUntil),
      maxRedemptions: newDeal.maxRedemptions,
      requiresReservation: newDeal.requiresReservation,
      dealCode: newDeal.dealCode || null,
      terms: newDeal.terms || null,
      availability: newDeal.availability,
      isActive: true,
      autoExpire: true
    };

    createDealMutation.mutate(dealData);
  };

  // Delete deal mutation
  const deleteDealMutation = useMutation({
    mutationFn: async (dealId: number) => {
      return apiRequest('DELETE', `/api/quick-deals/${dealId}`);
    },
    onSuccess: () => {
      toast({
        title: "Deal Removed",
        description: "Your deal has been removed."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quick-deals'] });
    }
  });

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'now': return 'bg-green-100 text-green-800 border-green-300';
      case 'today': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'weekend': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'week': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDealTypeIcon = (dealType: string) => {
    switch (dealType) {
      case 'discount': return <Percent className="h-3 w-3" />;
      case 'bogo': return <Tag className="h-3 w-3" />;
      case 'happy_hour': return <Coffee className="h-3 w-3" />;
      case 'flash_sale': return <Zap className="h-3 w-3" />;
      default: return <DollarSign className="h-3 w-3" />;
    }
  };

  const activateDeals = quickDeals?.filter((deal: QuickDeal) => {
    const now = new Date();
    const validUntil = new Date(deal.validUntil);
    return deal.isActive && validUntil > now && (deal.currentRedemptions || 0) < (deal.maxRedemptions || 100);
  }) || [];

  const expiredDeals = quickDeals?.filter((deal: QuickDeal) => {
    const now = new Date();
    const validUntil = new Date(deal.validUntil);
    return !deal.isActive || validUntil <= now || (deal.currentRedemptions || 0) >= (deal.maxRedemptions || 100);
  }) || [];

  // Only render for business users - AFTER all hooks have been called
  if (actualUser?.userType !== 'business') {
    return null;
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Quick Deal Now
          </h3>
          <Button
            onClick={() => setInternalShowCreateForm(!showCreateForm)}
            size="sm"
            variant="outline"
            className="flex items-center gap-1"
            data-testid="button-create-deal"
          >
            <Plus className="h-4 w-4" />
            New Deal
          </Button>
        </div>

        {/* Create Deal Form */}
        {showCreateForm && (
          <div className="border rounded-lg p-4 mb-4 bg-orange-50" data-testid="form-create-deal">
            <h4 className="font-medium mb-3">Create Quick Deal</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Deal Title</label>
                  <Input
                    value={newDeal.title}
                    onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                    placeholder="20% off lunch special"
                    data-testid="input-deal-title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Discount Amount</label>
                  <Input
                    value={newDeal.discountAmount}
                    onChange={(e) => setNewDeal({ ...newDeal, discountAmount: e.target.value })}
                    placeholder="20% off, $5 off, BOGO"
                    data-testid="input-discount-amount"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newDeal.description}
                  onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                  placeholder="Describe your deal..."
                  rows={2}
                  data-testid="textarea-deal-description"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-sm font-medium">Deal Type</label>
                  <Select value={newDeal.dealType} onValueChange={(value) => setNewDeal({ ...newDeal, dealType: value })}>
                    <SelectTrigger data-testid="select-deal-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount">Discount</SelectItem>
                      <SelectItem value="bogo">BOGO</SelectItem>
                      <SelectItem value="happy_hour">Happy Hour</SelectItem>
                      <SelectItem value="special_offer">Special Offer</SelectItem>
                      <SelectItem value="flash_sale">Flash Sale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={newDeal.category} onValueChange={(value) => setNewDeal({ ...newDeal, category: value })}>
                    <SelectTrigger data-testid="select-deal-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="drinks">Drinks</SelectItem>
                      <SelectItem value="shopping">Shopping</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Available Until</label>
                  <Input
                    type="datetime-local"
                    value={newDeal.validUntil}
                    onChange={(e) => setNewDeal({ ...newDeal, validUntil: e.target.value })}
                    data-testid="input-valid-until"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Max Uses</label>
                  <Input
                    type="number"
                    value={newDeal.maxRedemptions}
                    onChange={(e) => setNewDeal({ ...newDeal, maxRedemptions: parseInt(e.target.value) || 50 })}
                    placeholder="50"
                    data-testid="input-max-redemptions"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newDeal.requiresReservation}
                      onChange={(e) => setNewDeal({ ...newDeal, requiresReservation: e.target.checked })}
                      data-testid="checkbox-requires-reservation"
                    />
                    <span className="text-sm">Requires Reservation</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setInternalShowCreateForm(false);
                      if (onCloseCreateForm) onCloseCreateForm();
                    }}
                    data-testid="button-cancel-deal"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateDeal}
                    disabled={createDealMutation.isPending}
                    data-testid="button-save-deal"
                  >
                    {createDealMutation.isPending ? 'Creating...' : 'Create Deal'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Deals */}
        <div className="space-y-3">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          )}

          {!isLoading && activateDeals.length === 0 && expiredDeals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Zap className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No active deals</p>
              <p className="text-sm">Create your first quick deal to attract customers</p>
            </div>
          )}

          {/* Active Deals Section */}
          {activateDeals.length > 0 && (
            <>
              <h4 className="font-medium text-sm text-green-700 flex items-center gap-1">
                <Zap className="h-4 w-4" />
                Active Deals ({activateDeals.length})
              </h4>
              {activateDeals.map((deal: QuickDeal) => (
                <div key={deal.id} className="border rounded-lg p-3 bg-white" data-testid={`deal-card-${deal.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{deal.title}</h4>
                        <Badge className={`text-xs ${getAvailabilityColor(deal.availability)}`}>
                          {getDealTypeIcon(deal.dealType)}
                          {deal.discountAmount}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{deal.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {deal.currentRedemptions}/{deal.maxRedemptions} used
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Until {format(new Date(deal.validUntil), 'MMM d, h:mm a')}
                        </span>
                        {deal.requiresReservation && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Reservation Required
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteDealMutation.mutate(deal.id)}
                      disabled={deleteDealMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                      data-testid={`button-delete-deal-${deal.id}`}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Expired Deals Section */}
          {expiredDeals.length > 0 && (
            <>
              <h4 className="font-medium text-sm text-gray-500 flex items-center gap-1 mt-4">
                <Clock className="h-4 w-4" />
                Expired Deals ({expiredDeals.length})
              </h4>
              {expiredDeals.slice(0, 3).map((deal: QuickDeal) => (
                <div key={deal.id} className="border rounded-lg p-3 bg-gray-50 opacity-60" data-testid={`expired-deal-${deal.id}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-700">{deal.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      Expired
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{deal.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                    <span>{deal.currentRedemptions}/{deal.maxRedemptions} used</span>
                    <span>Expired {format(new Date(deal.validUntil), 'MMM d')}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}