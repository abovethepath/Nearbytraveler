import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, Instagram, Key, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AdminSettingsProps {
  user?: any;
}

export default function AdminSettings({ user }: AdminSettingsProps) {
  const [instagramToken, setInstagramToken] = useState("");
  const [facebookToken, setFacebookToken] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInstagramTokenUpdate = async () => {
    if (!instagramToken.trim()) {
      toast({
        title: "Error",
        description: "Please enter an Instagram access token",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await apiRequest("POST", "/api/admin/update-instagram-token", {
        token: instagramToken.trim()
      });

      toast({
        title: "Instagram Token Updated",
        description: "Instagram access token has been configured successfully"
      });
      
      setInstagramToken("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update Instagram token",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookTokenUpdate = async () => {
    if (!facebookToken.trim()) {
      toast({
        title: "Error", 
        description: "Please enter a Facebook access token",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await apiRequest("POST", "/api/admin/update-facebook-token", {
        token: facebookToken.trim()
      });

      toast({
        title: "Facebook Token Updated",
        description: "Facebook access token has been configured successfully"
      });
      
      setFacebookToken("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update Facebook token",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInstagramToken = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/admin/generate-instagram-token");
      const data = await response.json();
      
      if (data.authUrl) {
        // Open Instagram authorization URL in new window
        window.open(data.authUrl, '_blank');
        toast({
          title: "Instagram Authorization",
          description: "Authorization window opened. Complete Instagram login to get your token."
        });
      } else {
        toast({
          title: "Authorization Failed",
          description: data.error || "Failed to generate Instagram authorization URL",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Generation Error",
        description: "Failed to generate Instagram authorization URL",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testInstagramConnection = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/admin/test-instagram");
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Instagram Connection Test",
          description: "Instagram API connection is working properly"
        });
      } else {
        toast({
          title: "Instagram Connection Failed",
          description: data.error || "Unable to connect to Instagram API",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Test Failed",
        description: "Instagram API test failed",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Only allow admin users
  if (user?.username !== 'nearbytraveler') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-md mx-auto mt-20">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-400">
              This page is restricted to administrators only.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Admin Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure social media API tokens and system settings
          </p>
        </div>

        <Tabs defaultValue="instagram" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="instagram" className="flex items-center gap-2">
              <Instagram className="w-4 h-4" />
              Instagram
            </TabsTrigger>
            <TabsTrigger value="facebook" className="flex items-center gap-2">
              Facebook
            </TabsTrigger>
          </TabsList>

          <TabsContent value="instagram">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Instagram className="w-6 h-6 text-pink-500" />
                  Instagram API Configuration
                </CardTitle>
                <CardDescription>
                  Configure Instagram Business API access token for event posting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        App ID
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="font-mono">
                          692327996908729
                        </Badge>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        App Secret
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="font-mono">
                          ••••••••••••••••
                        </Badge>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Access Token Status
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="destructive" className="font-mono">
                          Not Configured
                        </Badge>
                        <XCircle className="w-4 h-4 text-red-500" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="instagram-token" className="text-sm font-medium">
                        Instagram Access Token
                      </Label>
                      <Input
                        id="instagram-token"
                        type="password"
                        placeholder="Enter Instagram access token..."
                        value={instagramToken}
                        onChange={(e) => setInstagramToken(e.target.value)}
                        className="font-mono"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Long-lived access token from Instagram Business API
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={generateInstagramToken}
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600"
                      >
                        <Key className="w-4 h-4 mr-2" />
                        Generate Token
                      </Button>
                      
                      <Button 
                        onClick={handleInstagramTokenUpdate}
                        disabled={loading || !instagramToken.trim()}
                        className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                      >
                        <Key className="w-4 h-4 mr-2" />
                        Update Token
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={testInstagramConnection}
                        disabled={loading}
                      >
                        Test Connection
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    How to Get Your Instagram Access Token:
                  </h4>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                    <li>Click "Generate Token" button above</li>
                    <li>Complete Instagram authorization in the popup window</li>
                    <li>Log in with @nearbytraveler Instagram account</li>
                    <li>Grant all requested permissions</li>
                    <li>Copy the authorization code from the redirect URL</li>
                    <li>Use the code to exchange for an access token</li>
                    <li>Paste the token above and click "Update Token"</li>
                  </ol>
                  <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-900/20 rounded text-xs text-orange-800 dark:text-orange-200">
                    <strong>Note:</strong> The Instagram App Secret must be configured in environment variables for token generation to work.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="facebook">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  Facebook API Configuration
                </CardTitle>
                <CardDescription>
                  Configure Facebook API access token for event posting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="facebook-token" className="text-sm font-medium">
                      Facebook Access Token
                    </Label>
                    <Input
                      id="facebook-token"
                      type="password"
                      placeholder="Enter Facebook access token..."
                      value={facebookToken}
                      onChange={(e) => setFacebookToken(e.target.value)}
                      className="font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Long-lived access token from Facebook API
                    </p>
                  </div>

                  <Button 
                    onClick={handleFacebookTokenUpdate}
                    disabled={loading || !facebookToken.trim()}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Update Facebook Token
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}