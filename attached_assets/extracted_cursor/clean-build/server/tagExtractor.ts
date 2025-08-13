// Automatic tag extraction from travel notes
export function extractTagsFromNotes(notes: string): string[] {
  if (!notes || typeof notes !== 'string') {
    return [];
  }

  // Clean and normalize the notes
  const cleanNotes = notes.toLowerCase().trim();
  
  // Common words to filter out (stop words)
  const stopWords = new Set([
    'i', 'want', 'to', 'go', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'for', 
    'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 
    'above', 'below', 'between', 'among', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can',
    'may', 'might', 'must', 'shall', 'this', 'that', 'these', 'those', 'my', 'your', 'his',
    'her', 'its', 'our', 'their', 'me', 'you', 'him', 'her', 'us', 'them', 'we', 'they'
  ]);

  // Extract meaningful phrases and activities
  const tags: string[] = [];
  
  // Pattern 1: "walk/visit/see/go to [location/activity]" 
  const activityPatterns = [
    /(?:walk|visit|see|go to|check out|explore|experience)\s+(?:the\s+)?([a-zA-Z0-9\s]+?)(?:\s|$|[.,!?])/g,
    /(?:attend|watch|see)\s+(?:a\s+|the\s+)?([a-zA-Z0-9\s]+?)(?:\s(?:concert|show|game|event|performance))/g,
    /(?:try|eat|have)\s+(?:some\s+|the\s+)?([a-zA-Z0-9\s]+?)(?:\s(?:food|restaurant|cuisine|meal))/g,
    /(?:meet|connect with|find)\s+([a-zA-Z0-9\s]+?)(?:\s(?:people|locals|travelers|friends))/g
  ];

  activityPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(cleanNotes)) !== null) {
      const extracted = match[1].trim();
      if (extracted.length > 2 && extracted.length < 30) {
        tags.push(extracted);
      }
    }
  });

  // Pattern 2: Extract specific landmarks, venues, activities
  const landmarks = [
    'highline', 'high line', 'central park', 'times square', 'brooklyn bridge', 'statue of liberty',
    'golden gate', 'hollywood sign', 'venice beach', 'santa monica', 'beverly hills',
    'millennium park', 'navy pier', 'wrigley field', 'lincoln park zoo',
    'south beach', 'art deco', 'wynwood', 'little havana', 'everglades',
    'space needle', 'pike place', 'waterfront', 'queen anne', 'capitol hill'
  ];

  landmarks.forEach(landmark => {
    if (cleanNotes.includes(landmark)) {
      tags.push(landmark);
    }
  });

  // Pattern 3: Extract concert/event names
  const concertPattern = /([a-zA-Z0-9\s&]+?)\s+concert/gi;
  let concertMatch;
  while ((concertMatch = concertPattern.exec(cleanNotes)) !== null) {
    const artist = concertMatch[1].trim();
    if (artist.length > 1 && artist.length < 25) {
      tags.push(`${artist} concert`);
    }
  }

  // Pattern 4: Extract food/restaurant types
  const foodPattern = /(?:try|eat|have|find)\s+(?:some\s+|good\s+)?([a-zA-Z\s]+?)(?:\s(?:food|cuisine|restaurant|bar|cafe))/g;
  let foodMatch;
  while ((foodMatch = foodPattern.exec(cleanNotes)) !== null) {
    const foodType = foodMatch[1].trim();
    if (foodType.length > 2 && foodType.length < 20 && !stopWords.has(foodType)) {
      tags.push(`${foodType} food`);
    }
  }

  // Pattern 5: Extract activities (verbs + objects)
  const activityWords = cleanNotes.split(/\s+/);
  for (let i = 0; i < activityWords.length - 1; i++) {
    const word1 = activityWords[i];
    const word2 = activityWords[i + 1];
    
    // Skip stop words
    if (stopWords.has(word1) || stopWords.has(word2)) continue;
    
    // Common activity verbs
    if (['walk', 'visit', 'see', 'explore', 'try', 'attend', 'watch', 'meet', 'find'].includes(word1)) {
      const combo = `${word1} ${word2}`.replace(/[.,!?]/g, '');
      if (combo.length > 4 && combo.length < 25) {
        tags.push(combo);
      }
    }
  }

  // Clean up and deduplicate tags
  const cleanedTags = [...new Set(tags)]
    .map(tag => tag.replace(/[.,!?;:]/g, '').trim())
    .filter(tag => tag.length > 2 && tag.length < 30)
    .filter(tag => !stopWords.has(tag))
    .slice(0, 10); // Limit to 10 tags max

  console.log(`Extracted tags from "${notes}":`, cleanedTags);
  return cleanedTags;
}

// Test the function with sample notes
export function testTagExtraction() {
  const testCases = [
    "I want to walk the highline",
    "I want to meet new people",
    "go to U2 Concert",
    "try some Italian food and visit Central Park",
    "explore the Space Needle and Pike Place Market"
  ];

  testCases.forEach(note => {
    console.log(`\nInput: "${note}"`);
    console.log(`Tags:`, extractTagsFromNotes(note));
  });
}