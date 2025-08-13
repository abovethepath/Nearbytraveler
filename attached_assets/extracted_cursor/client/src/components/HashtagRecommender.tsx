import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Hash, Sparkles, Copy, RefreshCw } from "lucide-react";

interface HashtagRecommendation {
  hashtags: string[];
  category: string;
  reasoning: string;
}

interface HashtagRecommenderProps {
  type: 'experience' | 'event' | 'memory';
  prefillData?: {
    title?: string;
    description?: string;
    city?: string;
    state?: string;
    country?: string;
    category?: string;
    tags?: string[];
  };
  onHashtagsGenerated?: (hashtags: string[]) => void;
}

export function HashtagRecommender({ 
  type, 
  prefillData = {}, 
  onHashtagsGenerated 
}: HashtagRecommenderProps) {
  const [content, setContent] = useState(prefillData.description || "");
  const [title, setTitle] = useState(prefillData.title || "");
  const [city, setCity] = useState(prefillData.city || "");
  const [state, setState] = useState(prefillData.state || "");
  const [country, setCountry] = useState(prefillData.country || "");
  const [category, setCategory] = useState(prefillData.category || "");
  const [recommendations, setRecommendations] = useState<HashtagRecommendation | null>(null);
  const [copiedHashtags, setCopiedHashtags] = useState<string[]>([]);
  
  const { toast } = useToast();

  const generateHashtags = useMutation({
    mutationFn: async () => {
      const endpoint = `/api/hashtags/${type}`;
      const body = type === 'event' 
        ? { title, description: content, city, state, country, category }
        : type === 'memory'
        ? { description: content, destination: `${city}, ${country}`, tags: prefillData.tags || [], city, country }
        : { experience: content, city, state, country, category };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error('Failed to generate hashtags');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setRecommendations(data);
      if (onHashtagsGenerated) {
        onHashtagsGenerated(data.hashtags);
      }
      toast({
        title: "Hashtags Generated!",
        description: `Generated ${data.hashtags.length} relevant hashtags`,
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate hashtags. Please try again.",
        variant: "destructive",
      });
    }
  });

  const copyHashtag = (hashtag: string) => {
    navigator.clipboard.writeText(hashtag);
    setCopiedHashtags(prev => [...prev, hashtag]);
    setTimeout(() => {
      setCopiedHashtags(prev => prev.filter(h => h !== hashtag));
    }, 2000);
    
    toast({
      title: "Copied!",
      description: `${hashtag} copied to clipboard`,
    });
  };

  const copyAllHashtags = () => {
    if (!recommendations) return;
    
    const hashtagString = recommendations.hashtags.join(' ');
    navigator.clipboard.writeText(hashtagString);
    
    toast({
      title: "All Hashtags Copied!",
      description: `${recommendations.hashtags.length} hashtags copied to clipboard`,
    });
  };

  const canGenerate = content.trim().length > 10 && city.trim().length > 0 && country.trim().length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="h-5 w-5" />
          AI Hashtag Recommender
          <Badge variant="secondary" className="ml-2">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Philadelphia"
            />
          </div>
          <div>
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g., Pennsylvania"
            />
          </div>
          <div>
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g., United States"
            />
          </div>
        </div>

        {type === 'event' && (
          <div>
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title..."
            />
          </div>
        )}

        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={
              type === 'experience' ? "e.g., food, nightlife, culture" :
              type === 'event' ? "e.g., music, food, arts, sports" :
              "e.g., adventure, culture, food"
            }
          />
        </div>

        <div>
          <Label htmlFor="content">
            {type === 'experience' ? 'Experience Description *' :
             type === 'event' ? 'Event Description *' :
             'Memory Description *'}
          </Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              type === 'experience' ? "Describe the local experience..." :
              type === 'event' ? "Describe what the event is about..." :
              "Describe your travel memory..."
            }
            rows={4}
            className="resize-none"
          />
          <div className="text-xs text-muted-foreground mt-1">
            {content.length}/500 characters (minimum 10 required)
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={() => generateHashtags.mutate()}
          disabled={!canGenerate || generateHashtags.isPending}
          className="w-full"
        >
          {generateHashtags.isPending ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating Hashtags...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate AI Hashtags
            </>
          )}
        </Button>

        {/* Results */}
        {recommendations && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Recommended Hashtags</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={copyAllHashtags}
                className="flex items-center gap-2"
              >
                <Copy className="h-3 w-3" />
                Copy All
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {recommendations.hashtags.map((hashtag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                  onClick={() => copyHashtag(hashtag)}
                >
                  {hashtag}
                  {copiedHashtags.includes(hashtag) ? (
                    <span className="ml-1 text-green-600">✓</span>
                  ) : (
                    <Copy className="h-3 w-3 ml-1 opacity-50" />
                  )}
                </Badge>
              ))}
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2">AI Reasoning:</h4>
              <p className="text-sm text-muted-foreground">{recommendations.reasoning}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default HashtagRecommender;