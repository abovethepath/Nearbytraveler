import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Calendar, MapPin, Users, AlertCircle, Check, Edit2, Tag, Mic, MicOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isNativeIOSApp } from "@/lib/nativeApp";

// Web Speech API types
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

interface AiEventDraft {
  title: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  venueName?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipcode?: string;
  category?: string;
  theme?: string;
  restrictions?: string[];
  maxParticipants?: number;
  isRecurring?: boolean;
  recurrenceType?: string;
  tags?: string[];
  privacy?: "public" | "friends" | "invite_only";
  costEstimate?: string;
  missing?: string[];
  notes?: string;
  confidence?: number;
}

interface AIQuickCreateEventProps {
  onDraftReady: (draft: AiEventDraft) => void;
  defaultCity?: string;
}

export function AIQuickCreateEvent({ onDraftReady, defaultCity }: AIQuickCreateEventProps) {
  const [inputText, setInputText] = useState("");
  const [draft, setDraft] = useState<AiEventDraft | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  // Check if speech recognition is supported
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognitionAPI);
  }, []);

  const startListening = async () => {
    const inNativeIOS = isNativeIOSApp();
    const SpeechRecognitionAPI = window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    // In native iOS app: try native bridge first (expo-speech-recognition)
    if (inNativeIOS && typeof (window as any).ReactNativeWebView?.postMessage === "function") {
      try {
        setIsListening(true);
        setInlineError(null);
        (window as any).__onNativeSpeechResult__ = (text: string) => {
          if (text) setInputText(prev => prev + (prev ? " " : "") + text);
        };
        (window as any).__onNativeSpeechError__ = (err: string) => {
          setIsListening(false);
          const msg = "Tap the text area below, then use the microphone on your keyboard to dictate.";
          setInlineError(msg);
          toast({ title: "Use keyboard dictation", description: msg, variant: "destructive" });
        };
        (window as any).__onNativeSpeechEnd__ = () => setIsListening(false);
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: "START_SPEECH_RECOGNITION" }));
        toast({ title: "Listening...", description: "Speak your event details. Tap the mic again to stop." });
        return;
      } catch {
        // Fall through to Web Speech API
      }
    }

    if (!SpeechRecognitionAPI) {
      const msg = inNativeIOS
        ? "Tap the text area below, then use the microphone on your keyboard to dictate."
        : "Voice input isn't supported. Please type your event details or use keyboard dictation.";
      setInlineError(msg);
      toast({ title: "Voice not available", description: msg, variant: "destructive" });
      return;
    }

    try {
      // Call recognition.start() directly - let Speech API request permission (avoids double-prompt on iOS)
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0]?.transcript;
          if (transcript && result.isFinal) {
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
        recognitionRef.current = null;

        const inNativeIOS = isNativeIOSApp();
        let errorMessage: string;
        if (inNativeIOS) {
          errorMessage = "Voice isn't supported in the app. Tap the text area below, then use the microphone on your keyboard to dictate.";
        } else if (event.error === "not-allowed") {
          errorMessage = "Microphone access was denied. Enable microphone in Settings, then try again.";
        } else if (event.error === "no-speech") {
          errorMessage = "No speech detected. Try again or type your event details.";
        } else if (event.error === "network") {
          errorMessage = "Network error. Check your connection or type your event details.";
        } else if (event.error === "audio-capture") {
          errorMessage = "Microphone not available. Please type your event details.";
        } else {
          errorMessage = "Voice input isn't available. Please type your event details instead.";
        }

        setInlineError(errorMessage);
        toast({
          title: "Voice unavailable",
          description: errorMessage,
          variant: "destructive"
        });
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (startErr) {
        console.error("recognition.start error:", startErr);
        setIsListening(false);
        recognitionRef.current = null;
        const msg = isNativeIOSApp()
          ? "Tap the text area below, then use the microphone on your keyboard to dictate."
          : "Could not start listening. Please allow microphone access or type your event details.";
        setInlineError(msg);
        toast({ title: "Voice unavailable", description: msg, variant: "destructive" });
        return;
      }
      setIsListening(true);

      toast({
        title: "Listening...",
        description: "Speak your event details. Tap the mic again to stop.",
      });
    } catch (error) {
      console.error("Speech recognition initialization error:", error);
      setIsListening(false);
      recognitionRef.current = null;
      const msg = isNativeIOSApp()
        ? "Tap the text area below, then use the microphone on your keyboard to dictate."
        : "Voice input isn't available. Please type your event details instead.";
      setInlineError(msg);
      toast({ title: "Voice unavailable", description: msg, variant: "destructive" });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
    } else if (isNativeIOSApp() && typeof (window as any).ReactNativeWebView?.postMessage === "function") {
      (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: "STOP_SPEECH_RECOGNITION" }));
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

  const generateDraftMutation = useMutation({
    mutationFn: async (text: string) => {
      setInlineError(null);
      const body = {
        text,
        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        defaultCity
      };
      try {
        const res = await apiRequest("POST", "/api/ai/event-draft", body);
        const data = await res.json();
        return data as AiEventDraft;
      } catch (err: any) {
        const msg = err?.message || "";
        if (msg.includes("fetch") || err?.name === "TypeError") {
          throw new Error("Cannot reach the server. Check your connection and try again.");
        }
        if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
          throw new Error("Please sign in to use AI event generation.");
        }
        if (msg.includes("422") || msg.includes("400")) {
          try {
            const colonIdx = msg.indexOf(": ");
            const jsonPart = colonIdx >= 0 ? msg.slice(colonIdx + 2).trim() : "";
            const parsed = jsonPart ? JSON.parse(jsonPart) : {};
            const serverErr = parsed?.error;
            if (typeof serverErr === "string") {
              if (serverErr.toLowerCase().includes("temporarily unavailable") || serverErr.toLowerCase().includes("not configured")) {
                throw new Error("AI features aren't configured. Please fill out the form below manually.");
              }
              throw new Error(serverErr);
            }
          } catch (parseErr: any) {
            throw parseErr;
          }
        }
        if (msg.includes("500") || msg.includes("timed out")) {
          throw new Error("Server temporarily unavailable. Try again in a moment.");
        }
        throw new Error(msg || "Failed to generate event. Please try again.");
      }
    },
    onSuccess: (data) => {
      setInlineError(null);
      setDraft(data);
      setIsEditing(false);
      if (data.missing && data.missing.length > 0) {
        toast({
          title: "Almost there!",
          description: `Please fill in: ${data.missing.join(", ")}`,
        });
      }
    },
    onError: (error: Error) => {
      const message = error.message || "Couldn't generate event. Please try again.";
      setInlineError(message);
      toast({
        title: "Couldn't understand that",
        description: message,
        variant: "destructive"
      });
    }
  });

  const handleGenerate = () => {
    setInlineError(null);
    if (inputText.trim().length < 10) {
      const msg = "Please describe your event with more detail (at least 10 characters).";
      setInlineError(msg);
      toast({
        title: "Need more details",
        description: msg,
        variant: "destructive"
      });
      return;
    }
    generateDraftMutation.mutate(inputText);
  };

  const handleUseDraft = () => {
    if (draft) {
      onDraftReady(draft);
    }
  };

  const updateDraftField = (field: keyof AiEventDraft, value: any) => {
    if (draft) {
      setDraft({ ...draft, [field]: value });
    }
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return "Not set";
    try {
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  const examplePrompts = [
    "Friday Feb 7, 8pm at my place 123 Main St. Rooftop Taco Night. 21+, BYOB.",
    "Beach cleanup Saturday morning 9am at Venice Beach. Family friendly, bring water!",
    "Weekly poker night every Thursday 7pm. $20 buy-in. Max 8 players."
  ];

  return (
    <div className="space-y-4">
      {!draft ? (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-base font-medium">
                <Sparkles className="w-4 h-4 text-orange-500" />
                Describe your event in your own words
              </Label>
              {(speechSupported || isNativeIOSApp()) && (
                <Button
                  type="button"
                  variant={isListening ? "destructive" : "outline"}
                  size="sm"
                  onClick={toggleListening}
                  disabled={generateDraftMutation.isPending}
                  className={`gap-1 ${isListening ? "animate-pulse" : ""}`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      Voice
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="relative">
              <Textarea
                placeholder={isListening ? "Listening... speak now!" : "Tell us about your event: What is it? When? Where? Any restrictions or themes?"}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (inlineError) setInlineError(null);
                }}
                className={`min-h-[120px] resize-none ${isListening ? "border-red-500 border-2" : ""}`}
                disabled={generateDraftMutation.isPending}
              />
              {isListening && (
                <div className="absolute top-2 right-2 flex items-center gap-1 text-red-500 text-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  Recording
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {(speechSupported || isNativeIOSApp())
                ? "Type or tap Voice to speak your event details. Include: date, time, location, event name. In the app, you can also tap the text area and use the keyboard mic to dictate."
                : "Include: date, time, location/address, event name, and any special requirements. Tip: Tap the mic on your keyboard for voice dictation!"
              }
            </p>
          </div>

          {inlineError && (
            <div
              className="rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950/50 dark:border-red-500 p-4 text-red-800 dark:text-red-200 text-sm flex items-start gap-2"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base">
                  {inlineError.toLowerCase().includes("microphone") || inlineError.toLowerCase().includes("voice") ? "Voice unavailable" : "Couldn't generate event"}
                </p>
                <p className="mt-1">{inlineError}</p>
              </div>
              <button
                type="button"
                onClick={() => setInlineError(null)}
                className="flex-shrink-0 p-1 rounded hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300"
                aria-label="Dismiss"
              >
                <span className="sr-only">Dismiss</span>×
              </button>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={generateDraftMutation.isPending || inputText.length < 10}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            {generateDraftMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Event Draft
              </>
            )}
          </Button>

          <div className="pt-4 mt-2">
            <p className="text-xs text-gray-400 mb-2">Try something like:</p>
            <div className="space-y-2">
              {examplePrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInputText(prompt)}
                  className="block w-full text-left text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 py-1 leading-relaxed"
                  style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <Card className="border-2 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                Event Preview
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  {isEditing ? "Done" : "Edit"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDraft(null);
                    setInputText("");
                  }}
                >
                  Start Over
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <Label>Event Title</Label>
                  <Input
                    value={draft.title || ""}
                    onChange={(e) => updateDraftField("title", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={draft.description || ""}
                    onChange={(e) => updateDraftField("description", e.target.value)}
                    className="min-h-[60px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={draft.startDateTime?.slice(0, 16) || ""}
                      onChange={(e) => updateDraftField("startDateTime", e.target.value + ":00")}
                    />
                  </div>
                  <div>
                    <Label>End Time (optional)</Label>
                    <Input
                      type="datetime-local"
                      value={draft.endDateTime?.slice(0, 16) || ""}
                      onChange={(e) => updateDraftField("endDateTime", e.target.value + ":00")}
                    />
                  </div>
                </div>
                <div>
                  <Label>Venue Name</Label>
                  <Input
                    value={draft.venueName || ""}
                    onChange={(e) => updateDraftField("venueName", e.target.value)}
                    placeholder="e.g., Rooftop Bar, Central Park"
                  />
                </div>
                <div>
                  <Label>Street Address</Label>
                  <Input
                    value={draft.street || ""}
                    onChange={(e) => updateDraftField("street", e.target.value)}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>City</Label>
                    <Input
                      value={draft.city || ""}
                      onChange={(e) => updateDraftField("city", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      value={draft.state || ""}
                      onChange={(e) => updateDraftField("state", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Max Participants</Label>
                  <Input
                    type="number"
                    value={draft.maxParticipants || ""}
                    onChange={(e) => updateDraftField("maxParticipants", parseInt(e.target.value) || undefined)}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{draft.title}</h3>
                  {draft.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{draft.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium">When</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {formatDateTime(draft.startDateTime)}
                        {draft.endDateTime && ` - ${formatDateTime(draft.endDateTime)}`}
                      </p>
                      {draft.isRecurring && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Repeats {draft.recurrenceType}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Where</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {draft.venueName && <span className="block">{draft.venueName}</span>}
                        {draft.street && <span className="block">{draft.street}</span>}
                        {(draft.city || draft.state) && (
                          <span className="block">
                            {[draft.city, draft.state].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {draft.maxParticipants && (
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-orange-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Capacity</p>
                        <p className="text-gray-600 dark:text-gray-400">
                          Max {draft.maxParticipants} people
                        </p>
                      </div>
                    </div>
                  )}

                  {draft.costEstimate && (
                    <div className="flex items-start gap-2">
                      <Tag className="w-4 h-4 text-orange-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Cost</p>
                        <p className="text-gray-600 dark:text-gray-400">{draft.costEstimate}</p>
                      </div>
                    </div>
                  )}
                </div>

                {draft.restrictions && draft.restrictions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {draft.restrictions.map((r, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {r}
                      </Badge>
                    ))}
                  </div>
                )}

                {draft.theme && (
                  <div className="text-sm">
                    <span className="font-medium">Theme:</span>{" "}
                    <span className="text-gray-600 dark:text-gray-400">{draft.theme}</span>
                  </div>
                )}
              </div>
            )}

            {draft.missing && draft.missing.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">Missing information:</p>
                  <p className="text-amber-700 dark:text-amber-300">{draft.missing.join(", ")}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Click "Edit" above or fill these in on the next screen
                  </p>
                </div>
              </div>
            )}

            {draft.notes && (
              <div className="text-xs text-gray-500 italic">
                Note: {draft.notes}
              </div>
            )}

            <Button
              onClick={handleUseDraft}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              disabled={!draft.title}
            >
              <Check className="w-4 h-4 mr-2" />
              Use This Draft & Continue
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
