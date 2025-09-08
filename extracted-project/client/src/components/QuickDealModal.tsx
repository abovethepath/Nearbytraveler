import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Zap } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuickDealModalProps {
  onClose: () => void;
  businessId: number;
  businessLocation?: {
    city?: string;
    state?: string;
    country?: string;
    street?: string;
  };
}

export default function QuickDealModal({ onClose, businessId, businessLocation }: QuickDealModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    validFor: "2",
    availability: "now",
  });

  const createQuickDealMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const startTime = new Date();
      const validUntil = new Date(startTime.getTime() + (parseInt(data.validFor) * 60 * 60 * 1000)); // Hours to milliseconds
      
      return apiRequest("POST", "/api/quick-deals", {
        businessId,
        title: data.title,
        description: data.description,
        deal_type: data.discountType, // Use underscore for database column name
        category: 'flash_deal',
        location: businessLocation?.street || 'Business Location',
        city: businessLocation?.city || 'Los Angeles',
        state: businessLocation?.state || 'California',
        country: businessLocation?.country || 'United States',
        discountAmount: data.discountValue,
        validFrom: startTime.toISOString(),
        validUntil: validUntil.toISOString(),
        maxRedemptions: 100,
        availability: data.availability,
        isActive: true
      });
    },
    onSuccess: () => {
      toast({
        title: "Quick Deal Created! ⚡",
        description: "Your Quick Deal is now live.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quick-deals'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error Creating Quick Deal",
        description: error instanceof Error ? error.message : "Failed to create quick deal",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.discountValue.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    createQuickDealMutation.mutate(formData);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-start justify-center overflow-y-auto"
      style={{ zIndex: 10000 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-b-2xl w-full max-w-lg shadow-2xl animate-slide-down"
        style={{ marginTop: 0 }}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Quick Deal</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Flash deal that expires in hours</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-8">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Flash Sale - 20% Off"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Limited time offer..."
              required
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Discount Type</label>
              <Select 
                value={formData.discountType} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, discountType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage Off</SelectItem>
                  <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
                  <SelectItem value="buy_one_get_one">Buy One Get One</SelectItem>
                  <SelectItem value="free_service">Free Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Discount Value *</label>
              <Input
                value={formData.discountValue}
                onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                placeholder="20% or $10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Valid For</label>
              <Select 
                value={formData.validFor} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, validFor: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Hour</SelectItem>
                  <SelectItem value="2">2 Hours</SelectItem>
                  <SelectItem value="3">3 Hours</SelectItem>
                  <SelectItem value="4">4 Hours</SelectItem>
                  <SelectItem value="6">6 Hours</SelectItem>
                  <SelectItem value="8">8 Hours</SelectItem>
                  <SelectItem value="12">12 Hours</SelectItem>
                  <SelectItem value="24">24 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Availability</label>
              <Select 
                value={formData.availability} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, availability: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Available Now</SelectItem>
                  <SelectItem value="today">Today Only</SelectItem>
                  <SelectItem value="weekend">This Weekend</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createQuickDealMutation.isPending}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              {createQuickDealMutation.isPending ? 'Creating...' : 'Create Quick Deal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}