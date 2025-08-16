import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Clock, Zap, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const instantDealSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  discountType: z.enum(["percentage", "fixed_amount", "buy_one_get_one", "free_service", "free_item_with_purchase", "combo_deal", "other"]),
  discountValue: z.string().min(1, "Discount value is required"),
  startDate: z.string().optional(),
  validFor: z.enum(["1", "2", "3", "4", "5", "8", "12", "24"], { required_error: "Please select validity period" }),
  maxRedemptions: z.string().optional(),
  targetAudience: z.enum(["locals", "travelers", "both"])
});

type InstantDealFormData = z.infer<typeof instantDealSchema>;

interface InstantDealCreatorProps {
  businessId: number;
  businessName?: string;
  businessLocation: {
    city: string;
    state?: string;
    country: string;
  };
  onDealCreated: () => void;
}

export default function InstantDealCreator({ businessId, businessName, businessLocation, onDealCreated }: InstantDealCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<InstantDealFormData>({
    resolver: zodResolver(instantDealSchema),
    defaultValues: {
      title: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      startDate: new Date().toISOString().slice(0, 16),
      validFor: "2",
      maxRedemptions: "",
      targetAudience: "both"
    }
  });

  const createInstantDealMutation = useMutation({
    mutationFn: async (data: InstantDealFormData) => {
      const startTime = data.startDate ? new Date(data.startDate) : new Date();
      const validUntil = new Date(startTime.getTime() + (parseInt(data.validFor) * 60 * 60 * 1000)); // Hours to milliseconds
      
      const dealData = {
        title: businessName ? `${businessName} - ${data.title}` : data.title,
        description: data.description,
        category: "instant_deal", // Special category for instant deals
        discountType: data.discountType,
        discountValue: data.discountValue,
        targetAudience: [data.targetAudience],
        city: businessLocation.city,
        state: businessLocation.state || "",
        country: businessLocation.country,
        validFrom: startTime.toISOString(),
        validUntil: validUntil.toISOString(),
        maxRedemptions: data.maxRedemptions ? parseInt(data.maxRedemptions) : undefined,
        maxRedemptionsPerUser: 1, // Instant deals are typically once per customer
        tags: "instant,flash,limited_time"
      };

      return apiRequest('POST', '/api/business-offers', dealData);
    },
    onSuccess: () => {
      toast({
        title: "Instant Deal Created! ⚡",
        description: "Your flash deal is now live and will expire automatically.",
        variant: "default",
      });
      form.reset();
      setIsOpen(false);
      onDealCreated();
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/business-offers'] });
      queryClient.invalidateQueries({ queryKey: [`/api/business-offers/business/${businessId}`] });
    },
    onError: (error) => {
      toast({
        title: "Error Creating Instant Deal",
        description: error instanceof Error ? error.message : "Failed to create instant deal",
        variant: "destructive",
      });
    }
  });

  const getDiscountTypeLabel = (type: string) => {
    switch (type) {
      case "percentage": return "Percentage Off";
      case "fixed_amount": return "Fixed Amount Off";
      case "buy_one_get_one": return "BOGO";
      case "free_service": return "Free Service";
      case "free_item_with_purchase": return "Free Item w/ Purchase";
      case "combo_deal": return "Combo Deal";
      case "other": return "Other/Custom";
      default: return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed border-orange-300 hover:border-orange-400">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-orange-100 p-3 mb-3">
              <Zap className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Create Instant Deal</h3>
            <p className="text-sm text-gray-600 text-center">
              Flash deals that expire in 1-24 hours to drive immediate foot traffic
            </p>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-600" />
            Create Instant Deal
          </DialogTitle>
          <DialogDescription>
            Create a time-sensitive flash deal to attract customers right now
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createInstantDealMutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deal Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Flash Sale - 30% Off All Items!" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Limited time offer! Get 30% off all menu items. Show this deal to your server. Valid for the next few hours only!"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date & Time</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Deal will become active at this time (leave current time for immediate activation)</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">% Off</SelectItem>
                        <SelectItem value="fixed_amount">$ Off</SelectItem>
                        <SelectItem value="buy_one_get_one">BOGO</SelectItem>
                        <SelectItem value="free_service">Free Service</SelectItem>
                        <SelectItem value="free_item_with_purchase">Free Item w/ Purchase</SelectItem>
                        <SelectItem value="combo_deal">Combo Deal</SelectItem>
                        <SelectItem value="other">Other/Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input placeholder="30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="validFor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Valid For
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 Hour</SelectItem>
                      <SelectItem value="2">2 Hours</SelectItem>
                      <SelectItem value="3">3 Hours</SelectItem>
                      <SelectItem value="4">4 Hours</SelectItem>
                      <SelectItem value="5">5 Hours</SelectItem>
                      <SelectItem value="8">8 Hours</SelectItem>
                      <SelectItem value="12">12 Hours</SelectItem>
                      <SelectItem value="24">24 Hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Target
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="locals">Locals</SelectItem>
                        <SelectItem value="travelers">Travelers</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxRedemptions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Uses</FormLabel>
                    <FormControl>
                      <Input placeholder="50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createInstantDealMutation.isPending}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {createInstantDealMutation.isPending ? "Creating..." : "Create Deal"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}