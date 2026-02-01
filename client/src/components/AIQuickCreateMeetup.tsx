import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, MapPin, Clock, AlertCircle, Check, Edit2, Mic, MicOff, Zap } from "lucide-react";
import { getApiBaseUrl } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface AiMeetupDraft {
  title: string;
  description?: string;
  meetingPoint?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  zipcode?: string;
  responseTime?: string;
  organizerNotes?: string;
  missing?: string[];
  confidence?: number;
}

interface AIQuickCreateMeetupProps {
  onDraftReady: (draft: AiMeetupDraft) => void;
  defaultCity?: string;
  onCancel?: () => void;
}

export function AIQuickCreateMeetup({ onDraftReady, defaultCity, onCancel }: AIQuickCreateMeetupProps) {
  const [inputText, setInputText] = useState("");
  const [draft, setDraft] = useState<AiMeetupDraft | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognitionAPI);
  }, []);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast({
        title: "Voice not available",
        description: "Voice input isn't supported in this app. Please type your meetup details instead.",
        variant: "destructive"
      });
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          }
        }

        if (finalTranscript) {
          setInputText(prev => prev + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event);
        setIsListening(false);
        
        let errorMessage = "Voice input isn't available. Please type your meetup details instead.";
        if (event.error === 'not-allowed') {
          errorMessage = "Microphone access was denied. Please enable microphone permissions or type your meetup details.";
        } else if (event.error === 'no-speech') {
          errorMessage = "No speech detected. Please try again or type your meetup details.";
        } else if (event.error === 'network') {
          errorMessage = "Network error. Please check your connection or type your meetup details.";
        }
        
        toast({
          title: "Voice unavailable",
          description: errorMessage,
          variant: "destructive"
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      
      toast({
        title: "Listening...",
        description: "Speak your meetup idea. Tap the mic again when done.",
      });
    } catch (error) {
      console.error("Speech recognition setup error:", error);
      toast({
        title: "Voice unavailable",
        description: "Voice input isn't available. Please type your meetup details instead.",
        variant: "destructive"
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const parseMutation = useMutation({
    mutationFn: async (text: string) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user?.id) {
            headers["x-user-id"] = user.id.toString();
          }
        } catch (e) {
          console.error("Failed to parse user data:", e);
        }
      }
      
      const response = await fetch(`${getApiBaseUrl()}/api/ai/meetup-draft`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          text,
          userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          defaultCity
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process description");
      }
      
      return response.json() as Promise<AiMeetupDraft>;
    },
    onSuccess: (data) => {
      setDraft(data);
      setIsEditing(false);
      toast({
        title: "Got it!",
        description: "Review your meetup details below.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Couldn't understand that",
        description: error.message || "Please try describing your meetup differently.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = () => {
    if (inputText.trim().length < 5) {
      toast({
        title: "Need more details",
        description: "Please describe what you want to do - like 'grab coffee at Starbucks on Main' or 'play volleyball at the beach'",
        variant: "destructive"
      });
      return;
    }
    parseMutation.mutate(inputText.trim());
  };

  const handleUseDraft = () => {
    if (draft) {
      onDraftReady(draft);
    }
  };

  const updateDraftField = (field: keyof AiMeetupDraft, value: any) => {
    if (draft) {
      setDraft({ ...draft, [field]: value });
    }
  };

  const RESPONSE_TIME_LABELS: Record<string, string> = {
    "1hour": "1 hour",
    "2hours": "2 hours",
    "3hours": "3 hours",
    "6hours": "6 hours",
    "12hours": "12 hours",
    "24hours": "24 hours"
  };

  return (
    <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white dark:from-gray-800 dark:to-gray-900 dark:border-orange-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-orange-500" />
          <span className="text-gray-900 dark:text-gray-100">Let's Meet Now - AI Voice</span>
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Tap the mic and describe your meetup idea - AI will fill in the details!
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!draft ? (
          <>
            <div className="relative">
              <Textarea
                placeholder='Try: "Coffee at the Starbucks on Main Street, looking for someone in the next hour" or "Beach volleyball in Santa Monica this afternoon, call me if interested"'
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[100px] pr-12 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                disabled={parseMutation.isPending}
              />
              {speechSupported && (
                <Button
                  type="button"
                  size="icon"
                  variant={isListening ? "destructive" : "outline"}
                  className="absolute right-2 bottom-2"
                  onClick={toggleListening}
                  disabled={parseMutation.isPending}
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={!inputText.trim() || parseMutation.isPending}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                {parseMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Understanding...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Meetup
                  </>
                )}
              </Button>
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                <Check className="mr-1 h-3 w-3" /> Draft Ready
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit2 className="mr-1 h-3 w-3" />
                {isEditing ? "Done Editing" : "Edit"}
              </Button>
            </div>

            {draft.missing && draft.missing.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  <p className="font-medium">Missing details:</p>
                  <p>{draft.missing.join(", ")}</p>
                </div>
              </div>
            )}

            <div className="grid gap-3">
              <div className="space-y-1">
                <Label className="text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Zap className="h-4 w-4 text-orange-500" />
                  Title
                </Label>
                {isEditing ? (
                  <Input
                    value={draft.title || ""}
                    onChange={(e) => updateDraftField("title", e.target.value)}
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                ) : (
                  <p className="text-gray-800 dark:text-gray-200 font-medium">{draft.title}</p>
                )}
              </div>

              {(draft.description || isEditing) && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Description</Label>
                  {isEditing ? (
                    <Textarea
                      value={draft.description || ""}
                      onChange={(e) => updateDraftField("description", e.target.value)}
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  ) : (
                    <p className="text-gray-700 dark:text-gray-300">{draft.description}</p>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  Meeting Point
                </Label>
                {isEditing ? (
                  <Input
                    value={draft.meetingPoint || ""}
                    onChange={(e) => updateDraftField("meetingPoint", e.target.value)}
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Where to meet"
                  />
                ) : (
                  <p className="text-gray-700 dark:text-gray-300">{draft.meetingPoint || "Not specified"}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">City</Label>
                  {isEditing ? (
                    <Input
                      value={draft.city || ""}
                      onChange={(e) => updateDraftField("city", e.target.value)}
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  ) : (
                    <p className="text-gray-700 dark:text-gray-300">{draft.city || "Not specified"}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">State</Label>
                  {isEditing ? (
                    <Input
                      value={draft.state || ""}
                      onChange={(e) => updateDraftField("state", e.target.value)}
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  ) : (
                    <p className="text-gray-700 dark:text-gray-300">{draft.state || ""}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Clock className="h-4 w-4 text-purple-500" />
                  Response Window
                </Label>
                {isEditing ? (
                  <Select
                    value={draft.responseTime || "2hours"}
                    onValueChange={(value) => updateDraftField("responseTime", value)}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1hour">1 hour</SelectItem>
                      <SelectItem value="2hours">2 hours</SelectItem>
                      <SelectItem value="3hours">3 hours</SelectItem>
                      <SelectItem value="6hours">6 hours</SelectItem>
                      <SelectItem value="12hours">12 hours</SelectItem>
                      <SelectItem value="24hours">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-gray-700 dark:text-gray-300">
                    {RESPONSE_TIME_LABELS[draft.responseTime || "2hours"]}
                  </p>
                )}
              </div>

              {(draft.organizerNotes || isEditing) && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Notes (contact info, how to find you)</Label>
                  {isEditing ? (
                    <Textarea
                      value={draft.organizerNotes || ""}
                      onChange={(e) => updateDraftField("organizerNotes", e.target.value)}
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="Call me at... / I'll be wearing... / Look for me near..."
                    />
                  ) : (
                    <p className="text-gray-700 dark:text-gray-300">{draft.organizerNotes}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleUseDraft}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Check className="mr-2 h-4 w-4" />
                Use This Draft
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDraft(null);
                  setInputText("");
                }}
              >
                Start Over
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
