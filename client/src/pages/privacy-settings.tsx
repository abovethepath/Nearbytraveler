import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Shield, ArrowLeft, Loader2, User, Users, Eye } from "lucide-react";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function PrivacySettingsPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Local state for the form
  const [selectedPreference, setSelectedPreference] = useState<string>(user?.displayNamePreference || "username");

  // Early return if no user
  if (!isAuthenticated || !user?.id) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Update display preference mutation
  const updateDisplayPreferenceMutation = useMutation({
    mutationFn: async (displayNamePreference: string) => {
      const response = await apiRequest("PUT", "/api/users/display-preference", { displayNamePreference });
      return response.json();
    },
    onSuccess: (data) => {
      // Update the user in auth context if needed
      toast({
        title: "Display Preference Updated",
        description: "Your display name preference has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to update display preference",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (selectedPreference === user.displayNamePreference) {
      toast({
        title: "No Changes",
        description: "Your display preference is already set to this option.",
      });
      return;
    }

    updateDisplayPreferenceMutation.mutate(selectedPreference);
  };

  const getPreviewName = (preference: string) => {
    switch (preference) {
      case 'username':
        return user.username;
      case 'first_name':
        return user.name?.split(' ')[0] || user.username;
      case 'full_name':
        return user.name || user.username;
      default:
        return user.username;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/settings")}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Shield className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Settings</h1>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Display Name Preference
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose how your name appears to other users across all meetups and interactions.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Current Preview */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Preview</span>
                </div>
                <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  Others will see you as: <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                    {getPreviewName(selectedPreference)}
                  </span>
                </p>
              </div>

              {/* Radio Group for Display Preferences */}
              <RadioGroup 
                value={selectedPreference} 
                onValueChange={setSelectedPreference}
                className="space-y-4"
              >
                {/* Username Option */}
                <div className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <RadioGroupItem value="username" id="username" className="mt-1" data-testid="radio-username" />
                  <div className="flex-1">
                    <Label htmlFor="username" className="text-base font-medium cursor-pointer">
                      Username Only
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Show only your username (e.g., '{user.username}') - recommended for travelers for privacy and safety
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Most Private</span>
                    </div>
                  </div>
                </div>

                {/* First Name Option */}
                <div className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <RadioGroupItem value="first_name" id="first_name" className="mt-1" data-testid="radio-first-name" />
                  <div className="flex-1">
                    <Label htmlFor="first_name" className="text-base font-medium cursor-pointer">
                      First Name
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Show your first name (e.g., '{user.name?.split(' ')[0] || user.username}') - good balance of personalization and privacy
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Balanced</span>
                    </div>
                  </div>
                </div>

                {/* Full Name Option */}
                <div className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <RadioGroupItem value="full_name" id="full_name" className="mt-1" data-testid="radio-full-name" />
                  <div className="flex-1">
                    <Label htmlFor="full_name" className="text-base font-medium cursor-pointer">
                      Full Name
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Show your complete name (e.g., '{user.name || user.username}') - most personal but less private
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Most Personal</span>
                    </div>
                  </div>
                </div>
              </RadioGroup>

              {/* Privacy Notice */}
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium mb-1">Privacy Tip</p>
                    <p>
                      We recommend using 'Username Only' for safety when traveling. You can always change this setting later from your account settings.
                    </p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <Button 
                onClick={handleSave}
                disabled={updateDisplayPreferenceMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:from-blue-600 hover:to-orange-600"
                data-testid="button-save-preference"
              >
                {updateDisplayPreferenceMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Display Preference'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}