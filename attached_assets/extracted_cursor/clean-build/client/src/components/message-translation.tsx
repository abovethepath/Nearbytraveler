import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Languages, X, Copy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MessageTranslationProps {
  messageText: string;
  messageId: number;
  isOwnMessage: boolean;
}

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "tr", name: "Turkish" },
  { code: "nl", name: "Dutch" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "no", name: "Norwegian" },
  { code: "fi", name: "Finnish" }
];

export default function MessageTranslation({ messageText, messageId, isOwnMessage }: MessageTranslationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [translation, setTranslation] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const { toast } = useToast();

  const translateMutation = useMutation({
    mutationFn: async ({ text, targetLanguage }: { text: string; targetLanguage: string }) => {
      const response = await fetch("/api/messages/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          targetLanguage
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setTranslation(data.translatedText);
      setShowTranslation(true);
      setIsOpen(false);
    },
    onError: () => {
      toast({
        title: "Translation Error",
        description: "Failed to translate message. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleTranslate = () => {
    if (!selectedLanguage) {
      toast({
        title: "Language Required",
        description: "Please select a target language for translation.",
        variant: "destructive"
      });
      return;
    }

    const targetLanguageName = LANGUAGES.find(lang => lang.code === selectedLanguage)?.name || selectedLanguage;
    translateMutation.mutate({ 
      text: messageText, 
      targetLanguage: targetLanguageName 
    });
  };

  const copyTranslation = () => {
    if (translation) {
      navigator.clipboard.writeText(translation);
      toast({
        title: "Copied",
        description: "Translation copied to clipboard",
      });
    }
  };

  const closeTranslation = () => {
    setShowTranslation(false);
    setTranslation(null);
  };

  return (
    <div className="relative">
      {/* Translation Button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ${
              isOwnMessage 
                ? "text-blue-100 hover:text-white hover:bg-blue-600" 
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Languages className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-3">
            <div className="font-medium text-sm">Translate Message</div>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    {language.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                onClick={handleTranslate}
                disabled={!selectedLanguage || translateMutation.isPending}
                size="sm"
                className="flex-1 bg-travel-blue hover:bg-blue-700"
              >
                {translateMutation.isPending ? "Translating..." : "Translate"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Translation Bubble */}
      {showTranslation && translation && (
        <Card className={`mt-2 border-2 ${
          isOwnMessage 
            ? "border-blue-200 bg-blue-50" 
            : "border-orange-200 bg-orange-50"
        }`}>
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Languages className="h-3 w-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-600">
                    Translation ({LANGUAGES.find(lang => lang.code === selectedLanguage)?.name})
                  </span>
                </div>
                <p className="text-sm text-gray-800">{translation}</p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  onClick={copyTranslation}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  onClick={closeTranslation}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}