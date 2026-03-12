import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getApiBaseUrl } from "@/lib/queryClient";
import { getProfileImageUrl } from "@/components/simple-avatar";
import { Copy, Check, Link2, UserPlus, Search, X, Users } from "lucide-react";

interface ChatroomInvitePanelProps {
  open: boolean;
  onClose: () => void;
  chatroomId: number;
  chatroomName: string;
  currentUserId: number;
}

interface UserResult {
  id: number;
  username: string;
  firstName?: string;
  name?: string;
  profileImage?: string;
  hometownCity?: string;
  userType?: string;
}

export default function ChatroomInvitePanel({
  open,
  onClose,
  chatroomId,
  chatroomName,
  currentUserId,
}: ChatroomInvitePanelProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<UserResult[]>([]);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const displayName = (u: UserResult) =>
    u.firstName || u.name?.split(" ")[0] || u.username;

  // Search users
  const { data: searchResults = [], isFetching } = useQuery<UserResult[]>({
    queryKey: ["/api/users/search", searchQuery],
    queryFn: async () => {
      if (searchQuery.trim().length < 2) return [];
      const res = await fetch(
        `${getApiBaseUrl()}/api/users/search?q=${encodeURIComponent(searchQuery)}&limit=15`,
        { credentials: "include" }
      );
      if (!res.ok) return [];
      return res.json();
    },
    enabled: searchQuery.trim().length >= 2,
  });

  // Generate invite link
  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/meetup-chatrooms/${chatroomId}/invite-token`
      );
      return res.json();
    },
    onSuccess: (data) => setInviteUrl(data.inviteUrl),
    onError: () =>
      toast({ title: "Couldn't generate link", variant: "destructive" }),
  });

  const handleCopyLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied!", description: "Share it with anyone." });
    } catch {
      toast({ title: "Couldn't copy", variant: "destructive" });
    }
  };

  // Add selected users directly
  const addMutation = useMutation({
    mutationFn: async (userIds: number[]) => {
      const res = await apiRequest("POST", `/api/meetup-chatrooms/${chatroomId}/add-members`, {
        userIds,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: `${data.added} ${data.added === 1 ? "person" : "people"} added`,
        description: "They can now chat in this group.",
      });
      setSelectedUsers([]);
      setSearchQuery("");
    },
    onError: () =>
      toast({ title: "Couldn't add people", variant: "destructive" }),
  });

  const toggleUser = (user: UserResult) => {
    setSelectedUsers((prev) => {
      const already = prev.find((u) => u.id === user.id);
      if (already) return prev.filter((u) => u.id !== user.id);
      return [...prev, user];
    });
  };

  const isSelected = (id: number) => selectedUsers.some((u) => u.id === id);

  const filtered = searchResults.filter(
    (u) => u.id !== currentUserId && !isSelected(u.id)
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-md w-full max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0 border-b border-gray-100 dark:border-gray-800">
          <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            Invite to "{chatroomName}"
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-5 pt-4">
          {/* ── Invite Link ─────────────────────────────────── */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <Link2 className="w-4 h-4" />
              Invite link
            </p>
            {inviteUrl ? (
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={inviteUrl}
                  className="text-xs bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleCopyLink}
                  className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full border-orange-400 text-orange-600 dark:text-orange-400 dark:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                onClick={() => inviteMutation.mutate()}
                disabled={inviteMutation.isPending}
              >
                <Link2 className="w-4 h-4 mr-2" />
                {inviteMutation.isPending ? "Generating…" : "Create invite link"}
              </Button>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
              Anyone with this link can join the chat.
            </p>
          </div>

          {/* ── Add People ──────────────────────────────────── */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" />
              Add people directly
            </p>

            {/* Selected chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedUsers.map((u) => (
                  <Badge
                    key={u.id}
                    className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 gap-1 pl-2 pr-1 py-0.5"
                  >
                    {displayName(u)}
                    <button onClick={() => toggleUser(u)} className="ml-0.5 hover:text-orange-900 dark:hover:text-orange-100">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or username…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Results */}
            {searchQuery.trim().length >= 2 && (
              <div className="space-y-1 max-h-48 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-800">
                {isFetching && (
                  <p className="text-sm text-gray-400 px-3 py-2">Searching…</p>
                )}
                {!isFetching && filtered.length === 0 && (
                  <p className="text-sm text-gray-400 px-3 py-2">No users found.</p>
                )}
                {filtered.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => toggleUser(u)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={getProfileImageUrl(u) || undefined} />
                      <AvatarFallback className="bg-orange-500 text-white text-xs">
                        {displayName(u)[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {displayName(u)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{u.username}{u.hometownCity ? ` · ${u.hometownCity}` : ""}
                      </p>
                    </div>
                    {isSelected(u.id) && <Check className="w-4 h-4 text-orange-500 shrink-0" />}
                  </button>
                ))}
                {selectedUsers.map((u) => (
                  <button
                    key={`sel-${u.id}`}
                    onClick={() => toggleUser(u)}
                    className="w-full flex items-center gap-3 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 transition-colors text-left"
                  >
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={getProfileImageUrl(u) || undefined} />
                      <AvatarFallback className="bg-orange-500 text-white text-xs">
                        {displayName(u)[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-300 truncate">
                        {displayName(u)}
                      </p>
                    </div>
                    <Check className="w-4 h-4 text-orange-500 shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {selectedUsers.length > 0 && (
              <Button
                className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => addMutation.mutate(selectedUsers.map((u) => u.id))}
                disabled={addMutation.isPending}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {addMutation.isPending
                  ? "Adding…"
                  : `Add ${selectedUsers.length} ${selectedUsers.length === 1 ? "person" : "people"}`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
