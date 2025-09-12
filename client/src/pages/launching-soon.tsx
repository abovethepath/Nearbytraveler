import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Rocket, Mail, User, ArrowLeft, Phone } from "lucide-react";
import Logo from "@/components/logo";
import { useLocation } from "wouter";

const waitlistSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
});

type WaitlistForm = z.infer<typeof waitlistSchema>;

export default function LaunchingSoon() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<WaitlistForm>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const waitlistMutation = useMutation({
    mutationFn: async (data: WaitlistForm) => {
      console.log("🚨 MUTATION FUNCTION CALLED!", data);
      const response = await apiRequest("POST", "/api/waitlist", data);
      console.log("🚨 API RESPONSE:", response);
      return response;
    },
    onSuccess: () => {
      console.log("🚨 MUTATION SUCCESS!");
      setIsSubmitted(true);
      toast({
        title: "Thank you!",
        description: "We'll reach out to you when we launch.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.log("🚨 MUTATION ERROR:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to join waitlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WaitlistForm) => {
    console.log("🚨 FORM SUBMITTED!", data);
    console.log("🚨 MUTATION STARTING...");
    waitlistMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-2">
        <div className="max-w-md w-full">
          <Card className="border-2 border-green-200 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-between items-start mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/")}
                  className="text-gray-600 hover:text-gray-800"
                  data-testid="button-back-home"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <div className="flex-1 flex justify-center">
                  <Logo className="h-32 sm:h-40 md:h-48 w-auto" />
                </div>
                <div className="w-20"></div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-700">
                Thank You!
              </CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                We'll reach out to you soon when we launch.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                You're now on our exclusive launch list. We'll send you an email as soon as Nearby Traveler is ready for you to explore.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>What's next?</strong> We're putting the finishing touches on the platform. Expect to hear from us within the next few weeks!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-2">
      <div className="max-w-md w-full">
        <Card className="border-2 border-orange-200 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-between items-start mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="text-gray-600 hover:text-gray-800"
                data-testid="button-back-home-form"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="flex-1 flex justify-center">
                <Logo className="h-32 sm:h-40 md:h-48 w-auto" />
              </div>
              <div className="w-20"></div>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Rocket className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              We're Launching Soon!
            </CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Join our waitlist to be the first to know when Nearby Traveler is ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Your Name
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your full name" 
                          {...field}
                          data-testid="input-waitlist-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your email address" 
                          type="email"
                          {...field}
                          data-testid="input-waitlist-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your phone number" 
                          type="tel"
                          {...field}
                          data-testid="input-waitlist-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-orange-600 to-blue-600 hover:from-orange-700 hover:to-blue-700 text-white font-semibold py-3"
                  disabled={waitlistMutation.isPending}
                  data-testid="button-join-waitlist"
                >
                  {waitlistMutation.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Joining...</span>
                    </div>
                  ) : (
                    "Join Waitlist"
                  )}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                We respect your privacy. Your information will only be used to notify you about our launch.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}