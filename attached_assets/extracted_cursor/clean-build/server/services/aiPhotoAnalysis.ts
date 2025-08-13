// Using OpenAI API for consistent AI functionality across the platform

export interface PhotoAnalysisResult {
  tags: string[];
  category: string;
  description: string;
  location?: string;
  confidence: number;
}

export async function analyzePhoto(base64Image: string): Promise<PhotoAnalysisResult> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      tags: ['travel', 'photo'],
      category: 'other',
      description: 'Travel photo - AI analysis not available',
      confidence: 0.1
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: 'You are a travel photo analysis expert. Analyze images and provide detailed tagging information in JSON format.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this travel photo and provide detailed tagging information. Return your response as a JSON object with the following structure:

{
  "tags": ["tag1", "tag2", "tag3", ...], // 5-10 specific descriptive tags
  "category": "category", // Primary category: "nature", "urban", "food", "people", "activity", "architecture", "transport", "culture", "nightlife", "shopping"
  "description": "description", // 1-2 sentence description of what's in the photo
  "location": "location or landmark name if recognizable", // Optional, only if clearly identifiable
  "confidence": 0.85 // Your confidence level (0-1) in the analysis
}

Focus on travel-relevant tags like specific activities, architectural styles, food types, natural features, cultural elements, and any recognizable landmarks. Be specific but accurate.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0]?.message?.content;
    
    if (!analysisText) {
      throw new Error('No analysis received from OpenAI');
    }

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