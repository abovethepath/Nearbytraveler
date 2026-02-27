import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, RefreshCw, Trash2, Link2, Calendar, Clock, CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";

interface Integration {
  id: number;
  provider: string;
  displayName: string;
  status: string;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  syncIntervalMinutes: number;
  eventCount: number;
  createdAt: string;
}

interface ExternalEvent {
  id: number;
  provider: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  venueName: string | null;
  city: string | null;
  url: string | null;
  imageUrl: string | null;
  organizerName: string | null;
  attendeeCount: number | null;
}

export default function EventIntegrations() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connectDialog, setConnectDialog] = useState<"luma" | "partiful" | null>(null);
  const [lumaApiKey, setLumaApiKey] = useState("");
  const [partifulUrl, setPartifulUrl] = useState("");
  const [displayName, setDisplayName] = useState("");

  const { data: integrations = [], isLoading: loadingIntegrations } = useQuery<Integration[]>({
    queryKey: ["/api/integrations"],
  });

  const { data: externalEvents = [], isLoading: loadingEvents } = useQuery<ExternalEvent[]>({
    queryKey: ["/api/external-events"],
  });

  const connectMutation = useMutation({
    mutationFn: async (data: { provider: string; apiKey?: string; icsUrl?: string; displayName?: string }) => {
      const res = await apiRequest("POST", "/api/integrations/connect", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Connected!", description: `Synced ${data.sync?.synced || 0} events` });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external-events"] });
      setConnectDialog(null);
      setLumaApiKey("");
      setPartifulUrl("");
      setDisplayName("");
    },
    onError: (err: any) => {
      toast({ title: "Connection failed", description: err.message || "Check your credentials", variant: "destructive" });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/integrations/${id}/sync`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Sync complete", description: `Updated ${data.synced} events` });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external-events"] });
    },
    onError: () => {
      toast({ title: "Sync failed", description: "Check your integration settings", variant: "destructive" });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/integrations/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Disconnected", description: "Integration removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/external-events"] });
    },
  });

  const handleConnect = () => {
    if (connectDialog === "luma") {
      connectMutation.mutate({ provider: "luma", apiKey: lumaApiKey, displayName: displayName || "Luma Events" });
    } else if (connectDialog === "partiful") {
      connectMutation.mutate({ provider: "partiful", icsUrl: partifulUrl, displayName: displayName || "Partiful Events" });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1c1c1e]">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setLocation("/events")} className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Event Integrations</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Connect Luma, Partiful, and more</p>
          </div>
        </div>

        <div className="grid gap-4 mb-8">
          <Card className="border border-gray-200 shadow-sm bg-white dark:bg-gray-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                Luma
              </CardTitle>
              <CardDescription>
                Import events from your Luma calendar. Requires Luma Plus for API access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {integrations.find(i => i.provider === "luma") ? (
                <IntegrationStatus
                  integration={integrations.find(i => i.provider === "luma")!}
                  onSync={() => syncMutation.mutate(integrations.find(i => i.provider === "luma")!.id)}
                  onDisconnect={() => disconnectMutation.mutate(integrations.find(i => i.provider === "luma")!.id)}
                  syncing={syncMutation.isPending}
                />
              ) : (
                <Button onClick={() => setConnectDialog("luma")} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect Luma
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm bg-white dark:bg-gray-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                Partiful
              </CardTitle>
              <CardDescription>
                Import events via calendar feed URL. Syncs once daily.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {integrations.find(i => i.provider === "partiful") ? (
                <IntegrationStatus
                  integration={integrations.find(i => i.provider === "partiful")!}
                  onSync={() => syncMutation.mutate(integrations.find(i => i.provider === "partiful")!.id)}
                  onDisconnect={() => disconnectMutation.mutate(integrations.find(i => i.provider === "partiful")!.id)}
                  syncing={syncMutation.isPending}
                />
              ) : (
                <Button onClick={() => setConnectDialog("partiful")} className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect Partiful
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {externalEvents.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Synced Events ({externalEvents.length})
            </h2>
            <div className="grid gap-3">
              {externalEvents.map((event) => (
                <Card key={event.id} className="border border-gray-200 shadow-sm bg-white dark:bg-gray-900">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                            event.provider === "luma" 
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                              : "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400"
                          }`}>
                            {event.provider}
                          </span>
                          {event.city && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">{event.city}</span>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">{event.title}</h3>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          {new Date(event.startTime).toLocaleDateString(undefined, {
                            weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
                          })}
                        </div>
                        {event.venueName && (
                          <p className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">{event.venueName}</p>
                        )}
                      </div>
                      {event.url && (
                        <a href={event.url} target="_blank" rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0">
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!loadingIntegrations && integrations.length === 0 && externalEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-1">No integrations yet</h3>
            <p className="text-sm text-gray-600 dark:text-gray-500">Connect Luma or Partiful above to import your events</p>
          </div>
        )}

        {(loadingIntegrations || loadingEvents) && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      <Dialog open={connectDialog === "luma"} onOpenChange={(open) => !open && setConnectDialog(null)}>
        <DialogContent className="bg-white dark:bg-gray-900 border-0">
          <DialogHeader>
            <DialogTitle>Connect Luma</DialogTitle>
            <DialogDescription>
              Enter your Luma API key to import events. You need Luma Plus to access the API.
              Get your key from your Luma dashboard settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">API Key</label>
              <Input
                type="password"
                placeholder="luma_xxxxxxxx..."
                value={lumaApiKey}
                onChange={(e) => setLumaApiKey(e.target.value)}
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Display Name (optional)</label>
              <Input
                placeholder="My Luma Events"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
            <Button
              onClick={handleConnect}
              disabled={!lumaApiKey || connectMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {connectMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
              ) : (
                "Connect & Sync"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={connectDialog === "partiful"} onOpenChange={(open) => !open && setConnectDialog(null)}>
        <DialogContent className="bg-white dark:bg-gray-900 border-0">
          <DialogHeader>
            <DialogTitle>Connect Partiful</DialogTitle>
            <DialogDescription>
              Paste your Partiful calendar subscription URL (ICS link).
              Find it in Partiful under Settings or Calendar Sync. Note: syncs update roughly once daily.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Calendar URL</label>
              <Input
                type="url"
                placeholder="https://partiful.com/calendar/..."
                value={partifulUrl}
                onChange={(e) => setPartifulUrl(e.target.value)}
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Display Name (optional)</label>
              <Input
                placeholder="My Partiful Events"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
            <Button
              onClick={handleConnect}
              disabled={!partifulUrl || connectMutation.isPending}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white"
            >
              {connectMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
              ) : (
                "Connect & Sync"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IntegrationStatus({
  integration,
  onSync,
  onDisconnect,
  syncing,
}: {
  integration: Integration;
  onSync: () => void;
  onDisconnect: () => void;
  syncing: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {integration.status === "active" ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <AlertCircle className="w-4 h-4 text-amber-500" />
        )}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {integration.status === "active" ? "Connected" : "Error - check credentials"}
        </span>
        <span className="text-xs text-gray-400 ml-auto">
          {integration.eventCount} events
        </span>
      </div>
      {integration.lastSyncAt && (
        <p className="text-xs text-gray-600 dark:text-gray-500">
          Last synced: {new Date(integration.lastSyncAt).toLocaleString()}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSync}
          disabled={syncing}
          className="flex-1"
        >
          {syncing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
          Sync Now
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDisconnect}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Disconnect
        </Button>
      </div>
    </div>
  );
}
