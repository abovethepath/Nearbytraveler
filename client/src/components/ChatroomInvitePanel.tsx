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
import { Check, UserPlus, Search, X, Users, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

interface ChatroomInvitePanelProps {
  open: boolean;
  onClose: () => void;
  chatroomType: string;
  chatroomId: number;
  chatroomName: string;
  currentUserId: number;
  dmPartnerId?: number;
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

interface Connection {
  id: number;
  connectedUser?: {
    id: number;
    username: string;
    firstName?: string;
    name?: string;
    profileImage?: string;
    hometownCity?: string;
    userType?: string;
  };
}

export default function ChatroomInvitePanel({
  open,
  onClose,
  chatroomType,
  chatroomId,
  chatroomName,
  currentUserId,
  dmPartnerId,
}: ChatroomInvitePanelProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<UserResult[]>([]);

  const displayName = (u: UserResult) =>
    (u.firstName || "").split(" ")[0] || u.name?.split(" ")[0] || u.username;

  // Load user's connections (primary source)
  const { data: connectionsRaw = [], isLoading: connectionsLoading } = useQuery<Connection[]>({
    queryKey: [`/api/connections/${currentUserId}`],
    enabled: open && !!currentUserId,
  });

  const connections: UserResult[] = connectionsRaw
    .map((c) => c.connectedUser)
    .filter((u): u is NonNullable<Connection['connectedUser']> => !!u && u.id !== currentUserId);

  // Search fallback for non-connections
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

  const displayList: UserResult[] = searchQuery.trim().length >= 2
    ? searchResults.filter((u) => u.id !== currentUserId)
    : connections;

  // Add people — for DM type, creates a new group chatroom; otherwise sends invite notification
  const addMutation = useMutation({
    mutationFn: async (userIds: number[]) => {
      if (chatroomType === "dm") {
        const allIds = Array.from(new Set([
          ...(dmPartnerId ? [dmPartnerId] : []),
          ...userIds,
        ]));
        const res = await apiRequest("POST", "/api/meetup-chatrooms/group-dm", {
          name: chatroomName || "Group Chat",
          userIds: allIds,
        });
        return { ...(await res.json()), isGroupDm: true };
      }
      const res = await apiRequest(
        "POST",
        `/api/chatrooms/${chatroomType}/${chatroomId}/invite-users`,
        { userIds, chatroomName }
      );
      return res.json();
    },
    onSuccess: (data) => {
      if (data.isGroupDm) {
        toast({
          title: "Group chat created!",
          description: "A new group chat has been started with everyone.",
        });
        onClose();
        navigate(`/meetup-chatroom-chat/${data.chatroomId}?title=${encodeURIComponent(data.name)}&subtitle=Group+chat`);
      } else {
        const invited = data.sent ?? selectedUsers.length;
        toast({
          title: `Invite${invited === 1 ? "" : "s"} sent!`,
          description: `${invited} ${invited === 1 ? "person" : "people"} will see a personal invite in their notifications.`,
        });
        setSelectedUsers([]);
        setSearchQuery("");
      }
    },
    onError: () => toast({ title: "Couldn't send invites", variant: "destructive" }),
  });

  const toggleUser = (user: UserResult) => {
    setSelectedUsers((prev) => {
      const already = prev.find((u) => u.id === user.id);
      if (already) return prev.filter((u) => u.id !== user.id);
      return [...prev, user];
    });
  };

  const isSelected = (id: number) => selectedUsers.some((u) => u.id === id);

  const filtered = displayList.filter((u) => !isSelected(u.id));

  const isDm = chatroomType === "dm";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setSelectedUsers([]); setSearchQuery(""); onClose(); } }}>
      <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 max-w-md w-full max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0 border-b border-gray-100 dark:border-gray-800">
          <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            {isDm ? "Start group chat" : `Add people to "${chatroomName}"`}
          </DialogTitle>
          {isDm && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              The original DM stays untouched. A new group chat will be created.
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4 pt-4">
          {/* Selected chips */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
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

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={connections.length > 0 ? "Search connections or anyone…" : "Search by name or username…"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Section label */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {searchQuery.trim().length >= 2 ? "Search results" : "Your connections"}
          </p>

          {/* User list */}
          {connectionsLoading && searchQuery.trim().length < 2 ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
            </div>
          ) : isFetching && searchQuery.trim().length >= 2 ? (
            <p className="text-sm text-gray-400 px-1 py-2">Searching…</p>
          ) : (
            <div className="space-y-1 max-h-60 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-800">
              {filtered.length === 0 && (
                <p className="text-sm text-gray-400 px-3 py-3">
                  {searchQuery.trim().length >= 2 ? "No users found." : "No connections yet."}
                </p>
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
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => addMutation.mutate(selectedUsers.map((u) => u.id))}
              disabled={addMutation.isPending}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {addMutation.isPending
                ? isDm ? "Creating group…" : "Sending invite…"
                : isDm
                  ? `Create group with ${selectedUsers.length + 1} ${selectedUsers.length + 1 === 1 ? "person" : "people"}`
                  : `Invite ${selectedUsers.length} ${selectedUsers.length === 1 ? "person" : "people"}`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
