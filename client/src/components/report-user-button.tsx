import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Flag, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ReportUserButtonProps {
  userId: number;
  targetUserId: number;
  targetUsername: string;
  variant?: "default" | "outline" | "destructive" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  showText?: boolean;
}

const REPORT_REASONS = [
  { value: "harassment", label: "Harassment or bullying" },
  { value: "spam", label: "Spam or scam" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "fake_profile", label: "Fake profile" },
  { value: "scam", label: "Attempting to scam users" },
  { value: "other", label: "Other" },
];

export function ReportUserButton({ 
  userId, 
  targetUserId, 
  targetUsername, 
  variant = "ghost",
  size = "sm",
  showIcon = true,
  showText = true
}: ReportUserButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const { toast } = useToast();

  const reportUserMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/users/report`, {
        reportedUserId: targetUserId,
        reason,
        details: details.trim() || undefined
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Report Submitted",
        description: data.message || "Thank you for helping keep our community safe.",
        variant: "default"
      });
      setShowDialog(false);
      setReason("");
      setDetails("");
    },
    onError: (error: any) => {
      console.error("Report user error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit report. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleReport = () => {
    if (!reason) {
      toast({
        title: "Please select a reason",
        description: "A reason is required to submit a report.",
        variant: "destructive"
      });
      return;
    }
    reportUserMutation.mutate();
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowDialog(true);
        }}
        className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
      >
        {showIcon && <Flag className="h-4 w-4 mr-1" />}
        {showText && "Report"}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Report @{targetUsername}
            </DialogTitle>
            <DialogDescription>
              Help us keep our community safe. Reports are reviewed by our team within 24 hours.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason" className="text-sm font-medium">
                Reason for reporting <span className="text-red-500">*</span>
              </Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="details" className="text-sm font-medium">
                Additional details (optional)
              </Label>
              <Textarea
                id="details"
                placeholder="Please provide any additional information that will help us review this report..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="mt-1 resize-none"
                rows={3}
                maxLength={1000}
              />
              <p className="mt-1 text-xs text-gray-500">
                {details.length}/1000 characters
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="flex-1"
              disabled={reportUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReport}
              disabled={reportUserMutation.isPending || !reason}
              className="flex-1"
            >
              {reportUserMutation.isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
