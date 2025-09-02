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

const forgotPasswordSchema = z.object({
  emailOrUsername: z.string().min(1, "Please enter your email or username"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);
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
      
      // Store reset link for development display
      if (data.resetLink) {
        setResetLink(data.resetLink);
        toast({
          title: "Password Reset Link Generated",
          description: "Reset link displayed below since email delivery may be delayed",
          duration: 5000,
        });
      } else {
        toast({
          title: "Reset Link Sent",
          description: data.message,
        });
      }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a password reset link to your email address if an account with that email or username exists.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resetLink ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-yellow-800">
                  🔐 Emergency Password Reset (Email Delivery Issue)
                </p>
                <p className="text-xs text-yellow-700">
                  Since emails aren't being delivered reliably, use this direct link:
                </p>
                <div className="bg-white border rounded p-2">
                  <a 
                    href={resetLink}
                    className="text-blue-600 hover:text-blue-800 text-sm break-all underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {resetLink}
                  </a>
                </div>
                <Button
                  onClick={() => window.open(resetLink, '_blank')}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  Reset Password Now
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-600 text-center">
                Didn't receive an email? Check your spam folder or try again.
              </p>
            )}
            <div className="flex flex-col space-y-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsSubmitted(false);
                  setResetLink(null);
                }}
                className="w-full"
              >
                Try Again
              </Button>
              <Link href="/signin">
                <Button variant="ghost" className="w-full">
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email or username and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="emailOrUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email or Username</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter your email or username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full"
                disabled={forgotPasswordMutation.isPending}
              >
                {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center">
            <Link href="/signin">
              <Button variant="ghost" className="text-sm">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}