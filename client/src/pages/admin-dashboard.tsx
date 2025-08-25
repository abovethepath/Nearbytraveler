import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, Building2, DollarSign, Settings, TrendingUp, AlertTriangle } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalBusinesses: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  newUsersThisMonth: number;
  subscriptionRevenue: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  userType: string;
  location: string;
  phoneNumber: string;
  createdAt: string;
  isActive: boolean;
  subscriptionStatus?: string;
}

interface BusinessSubscription {
  id: number;
  businessName: string;
  email: string;
  status: string;
  monthlyRevenue: number;
  createdAt: string;
  trialEndDate?: string;
  nextBillingDate?: string;
}

interface PricingConfig {
  monthlyPriceCents: number;
  trialDays: number;
  stripeEnabled: boolean;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [pricingForm, setPricingForm] = useState({
    monthlyPrice: "50.00",
    trialDays: "7"
  });

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    retry: 1
  });

  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    retry: 1
  });

  // Fetch business subscriptions
  const { data: businesses, isLoading: businessesLoading } = useQuery<BusinessSubscription[]>({
    queryKey: ["/api/admin/businesses"],
    retry: 1
  });

  // Fetch current pricing config
  const { data: pricingConfig } = useQuery<PricingConfig>({
    queryKey: ["/api/admin/pricing-config"],
    retry: 1
  });

  // Update pricing mutation
  const updatePricingMutation = useMutation({
    mutationFn: (data: { monthlyPriceCents: number; trialDays: number }) =>
      apiRequest("PUT", "/api/admin/pricing-config", data),
    onSuccess: () => {
      toast({
        title: "Pricing Updated",
        description: "Business subscription pricing has been updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing-config"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update pricing configuration",
        variant: "destructive"
      });
    }
  });

  // Toggle Stripe mode mutation
  const toggleStripeMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      apiRequest("PUT", "/api/admin/stripe-mode", { enabled }),
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: data.enabled ? "Stripe Enabled" : "Free Mode Enabled",
        description: data.enabled 
          ? "Businesses will now be charged for subscriptions" 
          : "All businesses get free access"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing-config"] });
    }
  });

  const handlePricingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const monthlyPriceCents = Math.round(parseFloat(pricingForm.monthlyPrice) * 100);
    const trialDays = parseInt(pricingForm.trialDays);
    
    updatePricingMutation.mutate({ monthlyPriceCents, trialDays });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (statsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your Nearby Traveler platform</p>
        </div>
        <Badge variant={pricingConfig?.stripeEnabled ? "default" : "secondary"} className="text-lg px-4 py-2">
          {pricingConfig?.stripeEnabled ? "💳 Stripe Mode" : "🆓 Free Mode"}
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.newUsersThisMonth || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Businesses</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBusinesses || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeSubscriptions || 0} active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.monthlyRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From business subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12%</div>
            <p className="text-xs text-muted-foreground">
              User growth this month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pricing" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pricing">Pricing & Settings</TabsTrigger>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="businesses">Business Accounts</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Subscription Pricing
                </CardTitle>
                <CardDescription>
                  Set monthly pricing for business subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePricingSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyPrice">Monthly Price (USD)</Label>
                    <Input
                      id="monthlyPrice"
                      type="number"
                      step="0.01"
                      min="1"
                      value={pricingForm.monthlyPrice}
                      onChange={(e) => setPricingForm(prev => ({
                        ...prev,
                        monthlyPrice: e.target.value
                      }))}
                      placeholder="50.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Current: {formatCurrency(pricingConfig?.monthlyPriceCents || 5000)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trialDays">Free Trial Days</Label>
                    <Input
                      id="trialDays"
                      type="number"
                      min="0"
                      max="30"
                      value={pricingForm.trialDays}
                      onChange={(e) => setPricingForm(prev => ({
                        ...prev,
                        trialDays: e.target.value
                      }))}
                      placeholder="7"
                    />
                    <p className="text-xs text-muted-foreground">
                      Current: {pricingConfig?.trialDays || 7} days
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={updatePricingMutation.isPending}
                    className="w-full"
                  >
                    {updatePricingMutation.isPending ? "Updating..." : "Update Pricing"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Payment Mode
                </CardTitle>
                <CardDescription>
                  Control whether businesses are charged or get free access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">
                        {pricingConfig?.stripeEnabled ? "Stripe Payment Mode" : "Free Access Mode"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {pricingConfig?.stripeEnabled 
                          ? "Businesses are charged for subscriptions"
                          : "All businesses get free access to build user base"
                        }
                      </p>
                    </div>
                    <Button
                      variant={pricingConfig?.stripeEnabled ? "destructive" : "default"}
                      onClick={() => toggleStripeMutation.mutate(!pricingConfig?.stripeEnabled)}
                      disabled={toggleStripeMutation.isPending}
                    >
                      {pricingConfig?.stripeEnabled ? "Enable Free Mode" : "Enable Stripe"}
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Free Mode:</strong> Great for building user base before monetization</p>
                  <p><strong>Stripe Mode:</strong> Charge businesses {formatCurrency(pricingConfig?.monthlyPriceCents || 5000)}/month</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Complete user database with registration details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">@{user.username}</div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className="text-sm font-mono">{user.phoneNumber || 'N/A'}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            user.userType === 'business' ? 'default' : 
                            user.userType === 'local' ? 'secondary' : 'outline'
                          }>
                            {user.userType}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{user.location}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'destructive'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="businesses">
          <Card>
            <CardHeader>
              <CardTitle>Business Subscriptions</CardTitle>
              <CardDescription>
                Monitor business accounts and subscription status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {businessesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Trial End</TableHead>
                      <TableHead>Next Billing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {businesses?.map((business) => (
                      <TableRow key={business.id}>
                        <TableCell className="font-medium">{business.businessName}</TableCell>
                        <TableCell>{business.email}</TableCell>
                        <TableCell>
                          <Badge variant={
                            business.status === 'active' ? 'default' : 
                            business.status === 'trialing' ? 'secondary' : 'destructive'
                          }>
                            {business.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(business.monthlyRevenue)}</TableCell>
                        <TableCell>{business.trialEndDate ? formatDate(business.trialEndDate) : 'N/A'}</TableCell>
                        <TableCell>{business.nextBillingDate ? formatDate(business.nextBillingDate) : 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>
                Track subscription revenue and growth metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats?.monthlyRevenue || 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats?.activeSubscriptions || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency((stats?.monthlyRevenue || 0) * 12)}
                    </div>
                    <p className="text-sm text-muted-foreground">Annual Run Rate</p>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p><strong>Note:</strong> Revenue shown is gross revenue before Stripe processing fees (~2.9% + 30¢ per transaction)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}