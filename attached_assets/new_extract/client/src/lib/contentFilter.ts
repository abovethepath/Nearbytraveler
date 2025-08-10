// Content filtering for user-generated content
// Blocks inappropriate content while allowing legitimate travel interests

const BLOCKED_TERMS = [
  // Explicit sexual content
  'sex', 'porn', 'pornography', 'xxx', 'adult', 'erotic', 'sexual', 'nsfw',
  'escort', 'prostitute', 'brothel', 'strip club', 'sex shop', 'adult entertainment',
  'webcam', 'cam girl', 'cam boy', 'onlyfans', 'sugar daddy', 'sugar baby', 'orgy',
  
  // Inappropriate activities
  'drugs', 'marijuana', 'cocaine', 'heroin', 'meth', 'ecstasy', 'molly',
  'drug dealer', 'drug dealing', 'illegal substances', 'narcotics',
  
  // Violence and illegal activities
  'weapons', 'guns', 'firearms', 'violence', 'fighting', 'gang', 'mafia',
  'terrorist', 'terrorism', 'bomb', 'explosive', 'assassination',
  'human trafficking', 'smuggling', 'money laundering',
  
  // Hate speech
  'nazi', 'fascist', 'supremacist', 'hate group', 'genocide',
  
  // Other inappropriate content
  'gambling addiction', 'illegal gambling', 'underground fighting'
];

const ALLOWED_TERMS = [
  // Legitimate travel interests that might trigger false positives
  'nudist', 'naturist', 'nude beach', 'clothing optional',
  'wine', 'beer', 'cocktails', 'nightlife', 'bars', 'clubs',
  'adventure', 'extreme sports', 'photography', 'art galleries'
];

export function filterContent(text: string): { isAllowed: boolean; filteredText: string } {
  if (!text || typeof text !== 'string') {
    return { isAllowed: true, filteredText: text };
  }

  const normalizedText = text.toLowerCase().trim();
  
  // Check if it's an explicitly allowed term
  for (const allowedTerm of ALLOWED_TERMS) {
    if (normalizedText.includes(allowedTerm.toLowerCase())) {
      return { isAllowed: true, filteredText: text };
    }
  }
  
  // Check for blocked terms
  for (const blockedTerm of BLOCKED_TERMS) {
    if (normalizedText.includes(blockedTerm.toLowerCase())) {
      return { isAllowed: false, filteredText: '' };
    }
  }
  
  return { isAllowed: true, filteredText: text };
}

export function filterCustomEntries(customText: string): string[] {
  if (!customText || typeof customText !== 'string') {
    return [];
  }
  
  const entries = customText.split(',').map(entry => entry.trim()).filter(Boolean);
  const filteredEntries: string[] = [];
  
  for (const entry of entries) {
    const { isAllowed, filteredText } = filterContent(entry);
    if (isAllowed && filteredText) {
      filteredEntries.push(filteredText);
    }
  }
  
  return filteredEntries;
}

export function validateCustomInput(text: string): { isValid: boolean; message?: string } {
  if (!text || typeof text !== 'string') {
    return { isValid: true };
  }
  
  const entries = text.split(',').map(entry => entry.trim()).filter(Boolean);
  
  for (const entry of entries) {
    const { isAllowed } = filterContent(entry);
    if (!isAllowed) {
      return { 
        isValid: false, 
        message: `"${entry}" is not appropriate for a travel networking platform. Please use family-friendly interests and activities.`
      };
    }
  }
  
  return { isValid: true };
}