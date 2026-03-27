import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getApiBaseUrl } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SimpleAvatar } from "@/components/simple-avatar";
import { useLocation } from "wouter";
import { useAuth } from "@/App";
import { MessageCircle, Trash2, ExternalLink, ChevronDown } from "lucide-react";

interface HostingOffer {
  id: number;
  userId: number;
  offerType: string;
  title: string;
  description: string;
  maxGuests: number;
  availableFrom: string;
  availableTo: string;
  username: string;
  name: string;
  firstName: string;
  profileImage: string | null;
  hometownCity: string;
  couchsurfingProfileUrl: string | null;
}

export function HostingWidget({ communityId }: { communityId: number }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<"hosting" | "seeking">("hosting");
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"hosting" | "seeking">("hosting");
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", maxGuests: 1, availableFrom: "", availableTo: "" });

  const { data: offers = [] } = useQuery<HostingOffer[]>({
    queryKey: [`/api/communities/${communityId}/hosting`],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/communities/${communityId}/hosting`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", `/api/communities/${communityId}/hosting`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${communityId}/hosting`] });
      setShowForm(false);
      setForm({ title: "", description: "", maxGuests: 1, availableFrom: "", availableTo: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (offerId: number) => apiRequest("DELETE", `/api/communities/${communityId}/hosting/${offerId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/communities/${communityId}/hosting`] }),
  });

  const hostingOffers = offers.filter(o => o.offerType !== "seeking");
  const seekingOffers = offers.filter(o => o.offerType === "seeking");
  const displayed = tab === "hosting" ? hostingOffers : seekingOffers;

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const openForm = (type: "hosting" | "seeking") => {
    setFormType(type);
    setForm({
      title: type === "hosting" ? "I can host" : "Looking for a host",
      description: "",
      maxGuests: 1,
      availableFrom: "",
      availableTo: "",
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.availableFrom || !form.availableTo) return;
    createMutation.mutate({
      offerType: formType === "hosting" ? "couch" : "seeking",
      title: form.title,
      description: form.description,
      maxGuests: form.maxGuests,
      availableFrom: form.availableFrom,
      availableTo: form.availableTo,
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <span>🛋️</span> Hosting & Requests
        </h3>

        {/* Safety disclaimer */}
        <button
          type="button"
          onClick={() => setShowDisclaimer(!showDisclaimer)}
          className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-0.5 hover:underline"
        >
          <span>⚠️</span> Safety notice
          <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showDisclaimer ? "rotate-180" : ""}`} />
        </button>
        {showDisclaimer && (
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
            Hosting and surfing arrangements are made between members directly. NearbyTraveler is not responsible for any hosting arrangements, interactions, or outcomes. Always meet in public first, trust your instincts, and practice safe hosting.
          </p>
        )}
      </div>

      {/* Tab pills */}
      <div className="flex gap-1 p-2 mx-2 mt-2 rounded-lg bg-gray-100 dark:bg-gray-900 text-xs font-medium">
        <button
          onClick={() => setTab("hosting")}
          className={`flex-1 px-3 py-1.5 rounded-md transition-colors ${tab === "hosting" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"}`}
        >
          Available Hosts ({hostingOffers.length})
        </button>
        <button
          onClick={() => setTab("seeking")}
          className={`flex-1 px-3 py-1.5 rounded-md transition-colors ${tab === "seeking" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"}`}
        >
          Need a Host ({seekingOffers.length})
        </button>
      </div>

      {/* Cards */}
      <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
        {displayed.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
            {tab === "hosting" ? "No hosts available yet. Be the first!" : "No requests yet."}
          </p>
        ) : (
          displayed.map((offer) => (
            <div key={offer.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
              <SimpleAvatar user={{ id: offer.userId, username: offer.username, profileImage: offer.profileImage }} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">@{offer.username}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{offer.hometownCity}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  {formatDate(offer.availableFrom)} – {formatDate(offer.availableTo)}
                  {offer.offerType !== "seeking" && ` · ${offer.maxGuests} guest${offer.maxGuests > 1 ? "s" : ""}`}
                </p>
                {offer.description && (
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{offer.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  {offer.userId === user?.id ? (
                    <button
                      onClick={() => deleteMutation.mutate(offer.id)}
                      className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => setLocation(`/messages?target=${offer.userId}`)}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                    >
                      <MessageCircle className="w-3 h-3" /> Connect
                    </button>
                  )}
                  {offer.couchsurfingProfileUrl && (
                    <a
                      href={offer.couchsurfingProfileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-green-600 dark:text-green-400 hover:underline flex items-center gap-0.5"
                    >
                      <ExternalLink className="w-3 h-3" /> CS Profile
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action buttons */}
      <div className="p-3 pt-1 flex gap-2">
        <Button size="sm" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs" onClick={() => openForm("hosting")}>
          + I'm Hosting
        </Button>
        <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs" onClick={() => openForm("seeking")}>
          + I Need a Host
        </Button>
      </div>

      {/* Form modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-sm bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-base">
              {formType === "hosting" ? "🛋️ Offer Hosting" : "🎒 Request a Host"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="text-sm" />
            <textarea
              placeholder={formType === "hosting" ? "Brief note about your space..." : "Brief note about your trip..."}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value.slice(0, 200) }))}
              maxLength={200}
              rows={2}
              className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm resize-none"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">From</label>
                <Input type="date" value={form.availableFrom} onChange={e => setForm(f => ({ ...f, availableFrom: e.target.value }))} className="text-sm" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">To</label>
                <Input type="date" value={form.availableTo} onChange={e => setForm(f => ({ ...f, availableTo: e.target.value }))} className="text-sm" />
              </div>
            </div>
            {formType === "hosting" && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Max guests</label>
                <Input type="number" min={1} max={10} value={form.maxGuests} onChange={e => setForm(f => ({ ...f, maxGuests: parseInt(e.target.value) || 1 }))} className="text-sm w-20" />
              </div>
            )}
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || !form.availableFrom || !form.availableTo}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createMutation.isPending ? "Posting..." : "Post"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
