import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getApiBaseUrl } from "@/lib/queryClient";
import { getProfileImageUrl } from "@/components/simple-avatar";
import { Users, Search, X, Check, MessageCircle } from "lucide-react";

interface GroupDMDialogProps {
  open: boolean;
  onClose: () => void;
  currentUserId: number;
  initialUser?: { id: number; username: string; firstName?: string; name?: string; profileImage?: string };
}

interface UserResult {
  id: number;
  username: string;
  firstName?: string;
  name?: string;
  profileImage?: string;
  hometownCity?: string;
}

export default function GroupDMDialog({
  open,
  onClose,
  currentUserId,
  initialUser,
}: GroupDMDialogProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<UserResult[]>(
    initialUser ? [initialUser] : []
  );

  const displayName = (u: UserResult) =>
    u.firstName || u.name?.split(" ")[0] || u.username;

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

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/meetup-chatrooms/group-dm", {
        name: groupName.trim() || undefined,
        userIds: selectedUsers.map((u) => u.id),
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Group chat created!", description: "Opening now…" });
      onClose();
      navigate(`/meetup-chat/${data.chatroomId}`);
    },
    onError: () =>
      toast({ title: "Couldn't create group chat", variant: "destructive" }),
  });

  const toggleUser = (user: UserResult) => {
    if (user.id === currentUserId) return;
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
            Start a group chat
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4 pt-4">
          {/* Group name */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Group name <span className="font-normal text-gray-400">(optional)</span>
            </Label>
            <Input
              placeholder="e.g. Weekend crew, LA trip…"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="mt-1 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              maxLength={60}
            />
          </div>

          {/* Selected people */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              People ({selectedUsers.length} selected)
            </p>
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedUsers.map((u) => (
                  <Badge
                    key={u.id}
                    className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 gap-1 pl-2 pr-1 py-0.5"
                  >
                    {displayName(u)}
                    <button
                      onClick={() => toggleUser(u)}
                      className="ml-0.5 hover:text-orange-900 dark:hover:text-orange-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search people to add…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {searchQuery.trim().length >= 2 && (
              <div className="space-y-0.5 max-h-52 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-800">
                {isFetching && (
                  <p className="text-sm text-gray-400 px-3 py-2">Searching…</p>
                )}
                {!isFetching && filtered.length === 0 && !selectedUsers.find(u => searchResults.find(r => r.id === u.id)) && (
                  <p className="text-sm text-gray-400 px-3 py-2">No users found.</p>
                )}
                {[...selectedUsers.filter(u => searchResults.find(r => r.id === u.id)), ...filtered].map((u) => (
                  <button
                    key={u.id}
                    onClick={() => toggleUser(u)}
                    className={`w-full flex items-center gap-3 px-3 py-2 transition-colors text-left ${
                      isSelected(u.id)
                        ? "bg-orange-50 dark:bg-orange-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={getProfileImageUrl(u) || undefined} />
                      <AvatarFallback className="bg-orange-500 text-white text-xs">
                        {displayName(u)[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isSelected(u.id) ? "text-orange-700 dark:text-orange-300" : "text-gray-900 dark:text-white"}`}>
                        {displayName(u)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{u.username}{u.hometownCity ? ` · ${u.hometownCity}` : ""}
                      </p>
                    </div>
                    {isSelected(u.id) && <Check className="w-4 h-4 text-orange-500 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 pt-2 shrink-0 border-t border-gray-100 dark:border-gray-800">
          <Button
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => createMutation.mutate()}
            disabled={selectedUsers.length === 0 || createMutation.isPending}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {createMutation.isPending
              ? "Creating…"
              : `Create group with ${selectedUsers.length + 1} ${selectedUsers.length + 1 === 2 ? "person" : "people"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
