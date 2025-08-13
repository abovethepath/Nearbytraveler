import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, Gift, TrendingUp, DollarSign, Search, Award, Settings } from "lucide-react";
import { format } from "date-fns";

interface ReferralData {
  id: number;
  referrerId: number;
  referredUserId: number | null;
  referralCode: string;
  referredEmail: string | null;
  referredName: string | null;
  status: string;
  referralSource: string | null;
  completedAt: string | null;
  rewardEarned: boolean;
  rewardType: string | null;
  notes: string | null;
  createdAt: string;
  referrerUsername: string;
  referredUsername: string | null;
}

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalRewards: number;
  conversionRate: number;
  topReferrers: Array<{
    userId: number;
    username: string;
    referralCount: number;
    rewardsEarned: number;
  }>;
}

export default function AdminReferrals() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<ReferralData | null>(null);
  const [rewardConfig, setRewardConfig] = useState({
    type: "",
    amount: "",
    description: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch referral statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/referrals/stats'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/referrals/stats");
      return response.json() as Promise<ReferralStats>;
    }
  });

  // Fetch all referrals
  const { data: referrals, isLoading } = useQuery({
    queryKey: ['/api/admin/referrals'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/referrals");
      return response.json() as Promise<ReferralData[]>;
    }
  });

  // Update referral status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ referralId, status, rewardType }: { referralId: number; status: string; rewardType?: string }) => {
      return await apiRequest("PUT", `/api/admin/referrals/${referralId}`, { status, rewardType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/referrals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/referrals/stats'] });
      toast({
        title: "Referral updated",
        description: "Referral status has been updated successfully.",
      });
    }
  });

  // Grant reward mutation
  const grantRewardMutation = useMutation({
    mutationFn: async (data: { referralId: number; rewardType: string; amount: string; description: string }) => {
      return await apiRequest("POST", `/api/admin/referrals/${data.referralId}/reward`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/referrals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/referrals/stats'] });
      setShowRewardDialog(false);
      setRewardConfig({ type: "", amount: "", description: "" });
      toast({
        title: "Reward granted",
        description: "Reward has been granted successfully.",
      });
    }
  });

  const filteredReferrals = referrals?.filter(referral => {
    const matchesSearch = 
      referral.referrerUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.referralCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.referredEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.referredName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || referral.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-500",
      signed_up: "bg-blue-500", 
      completed_profile: "bg-green-500",
      first_connection: "bg-orange-500",
      first_event: "bg-orange-500"
    };
    return (
      <Badge className={`${statusColors[status as keyof typeof statusColors] || "bg-gray-500"} text-white`}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Referral Management</h1>
          <p className="text-gray-600">Monitor and manage user referrals and rewards</p>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReferrals}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedReferrals}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRewards}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Referrers */}
      {stats?.topReferrers && stats.topReferrers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topReferrers.slice(0, 5).map((referrer, index) => (
                <div key={referrer.userId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <span className="font-medium">{referrer.username}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {referrer.referralCount} referrals • {referrer.rewardsEarned} rewards
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>All Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search referrals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="signed_up">Signed Up</SelectItem>
                <SelectItem value="completed_profile">Completed Profile</SelectItem>
                <SelectItem value="first_connection">First Connection</SelectItem>
                <SelectItem value="first_event">First Event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Referrals Table */}
          {isLoading ? (
            <div className="text-center py-8">Loading referrals...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Referred User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReferrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell className="font-medium">{referral.referrerUsername}</TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">{referral.referralCode}</code>
                    </TableCell>
                    <TableCell>
                      {referral.referredUsername || referral.referredEmail || referral.referredName || "Not signed up"}
                    </TableCell>
                    <TableCell>{getStatusBadge(referral.status)}</TableCell>
                    <TableCell>{referral.referralSource || "Unknown"}</TableCell>
                    <TableCell>
                      {referral.rewardEarned ? (
                        <Badge className="bg-green-500 text-white">
                          {referral.rewardType || "Rewarded"}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(referral.createdAt), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Select
                          value={referral.status}
                          onValueChange={(status) => updateStatusMutation.mutate({ referralId: referral.id, status })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="signed_up">Signed Up</SelectItem>
                            <SelectItem value="completed_profile">Completed Profile</SelectItem>
                            <SelectItem value="first_connection">First Connection</SelectItem>
                            <SelectItem value="first_event">First Event</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {!referral.rewardEarned && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedReferral(referral);
                              setShowRewardDialog(true);
                            }}
                          >
                            <Gift className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reward Dialog */}
      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Reward</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rewardType">Reward Type</Label>
              <Select value={rewardConfig.type} onValueChange={(value) => setRewardConfig({...rewardConfig, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reward type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credits">Platform Credits</SelectItem>
                  <SelectItem value="premium">Premium Features</SelectItem>
                  <SelectItem value="badge">Special Badge</SelectItem>
                  <SelectItem value="discount">Discount Code</SelectItem>
                  <SelectItem value="cash">Cash Reward</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="amount">Amount/Value</Label>
              <Input
                id="amount"
                value={rewardConfig.amount}
                onChange={(e) => setRewardConfig({...rewardConfig, amount: e.target.value})}
                placeholder="e.g., $10, 100 credits, 1 month"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={rewardConfig.description}
                onChange={(e) => setRewardConfig({...rewardConfig, description: e.target.value})}
                placeholder="Additional notes about the reward..."
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (selectedReferral) {
                    grantRewardMutation.mutate({
                      referralId: selectedReferral.id,
                      rewardType: rewardConfig.type,
                      amount: rewardConfig.amount,
                      description: rewardConfig.description
                    });
                  }
                }}
                disabled={!rewardConfig.type || grantRewardMutation.isPending}
              >
                Grant Reward
              </Button>
              <Button variant="outline" onClick={() => setShowRewardDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}