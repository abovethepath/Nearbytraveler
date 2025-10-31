import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Calendar, AlertTriangle, CheckCircle } from "lucide-react";

interface SubscriptionStatusData {
  hasSubscription: boolean;
  status?: string;
  isActive?: boolean;
  trialActive?: boolean;
  trialEnd?: string;
  nextBillingDate?: string;
  needsPayment?: boolean;
  needsSubscription?: boolean;
  trialExpired?: boolean;
  freeMode?: boolean;
}

export function SubscriptionStatus() {
  const { toast } = useToast();

  const { data: subscriptionStatus, isLoading } = useQuery<SubscriptionStatusData>({
    queryKey: ["/api/business/subscription-status"],
    retry: 1
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/business/create-subscription"),
    onSuccess: async (response) => {
      try {
        console.log('🎯 SUBSCRIPTION: Response received:', response);
        const data = await response.json();
        console.log('🎯 SUBSCRIPTION: Parsed data:', data);
        
        if (data.clientSecret) {
          // Redirect to Stripe checkout
          console.log('🎯 SUBSCRIPTION: Redirecting to Stripe checkout');
          window.location.href = `https://checkout.stripe.com/pay/${data.clientSecret}`;
        } else if (data.success) {
          toast({
            title: "Subscription Process Started", 
            description: data.message || "Your subscription process has been initiated!"
          });
          queryClient.invalidateQueries({ queryKey: ["/api/business/subscription-status"] });
        } else {
          throw new Error(data.message || 'Unexpected response format');
        }
      } catch (error) {
        console.error('🎯 SUBSCRIPTION: Error parsing response:', error);
        toast({
          title: "Subscription Error",
          description: "Failed to process subscription response",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      console.error('🎯 SUBSCRIPTION: Mutation error:', error);
      toast({
        title: "Subscription Error", 
        description: error.message || "Failed to create subscription",
        variant: "destructive"
      });
    }
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/business/cancel-subscription"),
    onSuccess: async (response) => {
      try {
        console.log('🎯 CANCEL: Response received:', response);
        const data = await response.json();
        console.log('🎯 CANCEL: Parsed data:', data);
        
        toast({
          title: "Subscription Canceled",
          description: data.message || "Your subscription has been canceled"
        });
        queryClient.invalidateQueries({ queryKey: ["/api/business/subscription-status"] });
      } catch (error) {
        console.error('🎯 CANCEL: Error parsing response:', error);
        toast({
          title: "Cancel Error",
          description: "Failed to process cancellation response",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      console.error('🎯 CANCEL: Mutation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    if (!subscriptionStatus?.hasSubscription) {
      if (subscriptionStatus?.trialActive && subscriptionStatus?.status === 'beta_free') {
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Beta Access</Badge>;
      }
      if (subscriptionStatus?.trialActive) {
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Free Trial</Badge>;
      }
      return <Badge variant="destructive">No Subscription</Badge>;
    }

    switch (subscriptionStatus.status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'trialing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Trial Period</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Payment Failed</Badge>;
      case 'canceled':
        return <Badge variant="outline">Canceled</Badge>;
      default:
        return <Badge variant="outline">{subscriptionStatus.status}</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', // CRITICAL: Always shows 4-digit year (2025, not 25)
      month: 'short', 
      day: 'numeric' 
    });
  };

  const needsAction = subscriptionStatus?.needsSubscription || subscriptionStatus?.needsPayment;

  return (
    <Card className={needsAction ? "border-orange-200 bg-orange-50" : ""} style={{ transition: 'none' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Business Subscription
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          Manage your business account subscription and billing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Beta Trial Status */}
        {subscriptionStatus?.trialActive && subscriptionStatus?.status === 'beta_free' && (
          <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg border border-green-200 dark:border-green-700">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">Beta Access - Free During Testing</p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Full access to all business features while we're in beta
              </p>
            </div>
          </div>
        )}
        
        {/* Regular Trial Status */}
        {subscriptionStatus?.trialActive && subscriptionStatus?.status !== 'beta_free' && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Free Trial Active</p>
              <p className="text-sm text-blue-700">
                Trial ends: {formatDate(subscriptionStatus.trialEnd)}
              </p>
            </div>
          </div>
        )}

        {/* Subscription Details */}
        {subscriptionStatus?.hasSubscription && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Next billing: {formatDate(subscriptionStatus.nextBillingDate)}
              </span>
            </div>
          </div>
        )}

        {/* Needs Action */}
        {needsAction && (
          <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <div>
              <p className="font-medium text-orange-900">Action Required</p>
              <p className="text-sm text-orange-700">
                {subscriptionStatus.needsSubscription 
                  ? "Subscribe to continue using business features"
                  : "Update payment method to avoid service interruption"
                }
              </p>
            </div>
          </div>
        )}

        {/* Free Mode Notice */}
        {subscriptionStatus?.freeMode && subscriptionStatus?.status !== 'canceled' && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
            <p className="text-sm text-purple-800 dark:text-purple-200 font-medium">
              Free Access Mode - Limited Time
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
              You currently have free access to all business features. Upgrade to a paid subscription ($75/month + $100 sign-up fee) for guaranteed long-term access and priority support.
            </p>
          </div>
        )}

        {/* Canceled Status Notice */}
        {subscriptionStatus?.status === 'canceled' && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-800 font-medium">
              Subscription Canceled
            </p>
            <p className="text-xs text-red-700 mt-1">
              Your business profile and offers are hidden. Restart subscription to restore access.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {subscriptionStatus?.status === 'canceled' ? (
            <Button 
              onClick={() => {
                console.log('🎯 RESTART SUBSCRIPTION: Button clicked!');
                createSubscriptionMutation.mutate();
              }}
              disabled={createSubscriptionMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white w-full"
              style={{ transition: 'none' }}
            >
              {createSubscriptionMutation.isPending 
                ? "Restarting Subscription..." 
                : "Restart Subscription ($75/month)"
              }
            </Button>
          ) : !subscriptionStatus?.hasSubscription ? (
            <Button 
              onClick={() => {
                console.log('🎯 START SUBSCRIPTION: Button clicked!');
                createSubscriptionMutation.mutate();
              }}
              disabled={createSubscriptionMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white"
              style={{ transition: 'none' }}
            >
              {createSubscriptionMutation.isPending 
                ? "Starting Subscription..." 
                : "Start Subscription ($75/month + $100 Sign Up Fee)"
              }
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              {/* In free mode, show upgrade to paid option */}
              {subscriptionStatus?.freeMode && (
                <Button 
                  onClick={() => {
                    console.log('🎯 UPGRADE TO PAID: Button clicked!');
                    createSubscriptionMutation.mutate();
                  }}
                  disabled={createSubscriptionMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white flex-1"
                  style={{ transition: 'none' }}
                >
                  {createSubscriptionMutation.isPending 
                    ? "Upgrading..." 
                    : "Upgrade to Paid Plan ($75/month + $100 Sign Up Fee)"
                  }
                </Button>
              )}
              
              {/* Show cancel button in both free mode and paid mode */}
              {(subscriptionStatus.status === 'active' || subscriptionStatus?.freeMode) && (
                <Button 
                  onClick={() => {
                    console.log('🎯 CANCEL SUBSCRIPTION: Button clicked!');
                    cancelSubscriptionMutation.mutate();
                  }}
                  disabled={cancelSubscriptionMutation.isPending}
                  className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
                  style={{ transition: 'none' }}
                >
                  {cancelSubscriptionMutation.isPending ? "Canceling..." : "Cancel Subscription"}
                </Button>
              )}
              
              {subscriptionStatus.needsPayment && (
                <Button 
                  className="bg-orange-600 hover:bg-orange-700 flex-1"
                  style={{ transition: 'none' }}
                >
                  Update Payment Method
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Pricing Info */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 mt-4">
          <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">
            Business Plan: $75/month + $100 sign-up fee • Monthly deal limits • Priority support • Analytics dashboard
          </div>
        </div>
      </CardContent>
    </Card>
  );
}