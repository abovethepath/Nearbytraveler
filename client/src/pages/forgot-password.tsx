import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

const forgotPasswordSchema = z.object({
  emailOrUsername: z.string().min(1, "Please enter your email or username"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetData, setResetData] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      emailOrUsername: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      try {
        const response = await apiRequest("POST", "/api/auth/forgot-password", data);
        const result = await response.json();
        return result;
      } catch (error: any) {
        console.error("Forgot password error:", error);
        throw new Error(error.message || "Failed to process password reset request");
      }
    },
    onSuccess: (data) => {
      setIsSubmitted(true);
      setResetData(data);
      toast({
        title: "Reset Link Sent",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    forgotPasswordMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white dark:bg-gray-800">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-6">
              <img 
                src="/new-logo.png" 
                alt="Nearby Traveler" 
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Check Your Email</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300 mt-2">
              A password reset link has been sent if an account with that email or username exists.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              If you don't see the email, check your spam folder or try again.
            </p>
            
            {resetData?.resetLink && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                  🔧 Development Mode
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mb-3">
                  For testing, you can use this direct reset link:
                </p>
                <Link href={resetData.resetLink.replace('http://localhost:5000', '')}>
                  <Button variant="outline" size="sm" className="w-full text-xs bg-white dark:bg-gray-700 dark:text-white dark:border-blue-600 dark:hover:bg-gray-600">
                    Use Reset Link Now
                  </Button>
                </Link>
              </div>
            )}
            
            <div className="flex flex-col space-y-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsSubmitted(false)}
                className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Try Again
              </Button>
              <Link href="/signin">
                <Button 
                  variant="ghost" 
                  className="w-full text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white dark:bg-gray-800">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-6">
            <img 
              src="/new-logo.png" 
              alt="Nearby Traveler" 
              className="h-16 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Forgot Password</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300 mt-2">
            Enter your email or username and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="emailOrUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-200">Email or Username</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter your email or username"
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-semibold py-3 h-12 shadow-lg"
                disabled={forgotPasswordMutation.isPending}
              >
                {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center">
            <Link href="/signin">
              <Button 
                variant="ghost" 
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
