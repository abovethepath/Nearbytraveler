// Using Anthropic Claude (claude-sonnet-4-6) consistently with rest of codebase
import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_MODEL = "claude-sonnet-4-6";

export interface PhotoAnalysisResult {
  tags: string[];
  category: string;
  description: string;
  location?: string;
  confidence: number;
}

export async function analyzePhoto(base64Image: string): Promise<PhotoAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return {
      tags: ['travel', 'photo'],
      category: 'other',
      description: 'Travel photo - AI analysis not available',
      confidence: 0.1
    };
  }

  try {
    // Strip data URL prefix if present (e.g. data:image/jpeg;base64,)
    let mediaType = "image/jpeg";
    let data = base64Image;
    if (base64Image.includes("base64,")) {
      const match = base64Image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mediaType = match[1];
        data = match[2];
      }
    }

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          {
            type: "image" as const,
            source: { type: "base64" as const, media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data },
          },
          {
            type: "text" as const,
            text: `Analyze this travel photo and provide detailed tagging information. Return your response as a JSON object with the following structure only (no markdown):

{
  "tags": ["tag1", "tag2", ...],
  "category": "nature|urban|food|people|activity|architecture|transport|culture|nightlife|shopping",
  "description": "1-2 sentence description",
  "location": "landmark or place name if recognizable",
  "confidence": 0.85
}

Focus on travel-relevant tags. Be specific but accurate.`,
          },
        ],
      }],
    });
    const textBlock = response.content.find((b): b is { type: "text"; text: string } => b.type === "text");
    const analysisText = textBlock?.text?.trim();
    if (!analysisText) throw new Error('No analysis received from AI');
    const analysis = JSON.parse(analysisText);

    const result: PhotoAnalysisResult = {
      tags: Array.isArray(analysis.tags) ? analysis.tags.slice(0, 10) : [],
      category: analysis.category || 'other',
      description: analysis.description || 'Travel photo',
      location: analysis.location || undefined,
      confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5))
    };

    return result;
  } catch (error) {
    console.error('AI photo analysis error:', error);
    // Return fallback analysis
    return {
      tags: ['travel', 'photo'],
      category: 'other',
      description: 'Travel photo',
      confidence: 0.1
    };
  }
}

export function categorizePhotos(photos: any[]): { [category: string]: any[] } {
  const categorized: { [category: string]: any[] } = {};
  
  photos.forEach(photo => {
    const category = photo.aiCategory || 'uncategorized';
    if (!categorized[category]) {
      categorized[category] = [];
    }
    categorized[category].push(photo);
  });

  return categorized;
}

export function getPhotosByTag(photos: any[], tag: string): any[] {
  return photos.filter(photo => 
    photo.aiTags && photo.aiTags.includes(tag)
  );
}

export function getSortedPhotosByConfidence(photos: any[]): any[] {
  return photos.sort((a, b) => (b.aiConfidence || 0) - (a.aiConfidence || 0));
}

export function getTopTags(photos: any[], limit: number = 10): { tag: string; count: number }[] {
  const tagCounts: { [tag: string]: number } = {};
  
  photos.forEach(photo => {
    if (photo.aiTags) {
      photo.aiTags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}