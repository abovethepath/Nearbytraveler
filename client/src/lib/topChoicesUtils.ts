// Utility function to identify "Top Choices for Most Locals and Travelers" interests
// These popular interests should receive blue-orange gradient styling across the entire platform

import { MOST_POPULAR_INTERESTS } from "@shared/base-options";

export const getTopChoicesInterests = (): string[] => {
  return MOST_POPULAR_INTERESTS;
};

export const isTopChoiceInterest = (interest: string): boolean => {
  return getTopChoicesInterests().includes(interest);
};

export const getTopChoiceInterestStyle = (interest: string): string => {
  return isTopChoiceInterest(interest) 
    ? 'bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600' 
    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700';
};

// Semantic color styles for different tag types
export const getInterestStyle = (interest: string): string => {
  return isTopChoiceInterest(interest) 
    ? 'bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0 hover:from-blue-600 hover:to-orange-600'
    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700';
};

export const getActivityStyle = (): string => {
  return 'bg-gradient-to-r from-orange-500 to-blue-500 text-white border-0 hover:from-orange-600 hover:to-blue-600';
};

export const getEventStyle = (): string => {
  return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700';
};

// Utility function to properly capitalize text
export const capitalizeText = (text: string): string => {
  // List of abbreviations that should remain uppercase
  const abbreviations = ['SXSW', 'NYC', 'LA', 'SF', 'UK', 'USA', 'EU', 'DJ', 'VIP', 'CEO', 'CTO', 'AI', 'AR', 'VR', 'NFT', 'API', 'UI', 'UX', 'SEO', 'SEM', 'PR', 'HR', 'IT', 'B2B', 'B2C', 'FAQ', 'DIY', 'GPS', 'USB', 'PDF', 'HTML', 'CSS', 'JS', 'SQL', 'HTTP', 'HTTPS', 'FTP', 'SSH', 'AWS', 'GCP', 'IoT', 'AI/ML', 'R&D', 'Q&A', 'CEO/CTO', 'UI/UX'];
  
  // Check if the entire text is an abbreviation
  if (abbreviations.includes(text.toUpperCase())) {
    return text.toUpperCase();
  }
  
  // Split by spaces and process each word
  return text.split(' ').map(word => {
    // Check if word is an abbreviation
    if (abbreviations.includes(word.toUpperCase())) {
      return word.toUpperCase();
    }
    
    // Check for words with special characters like & or /
    if (word.includes('&') || word.includes('/')) {
      return word.split(/([&/])/).map(part => {
        if (part === '&' || part === '/') return part;
        if (abbreviations.includes(part.toUpperCase())) return part.toUpperCase();
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }).join('');
    }
    
    // Regular word capitalization
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
};

// Color variations for city-based styling - no hover effects, uniform sizing
const cityColors = [
  'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
  'bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
  'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700',
  'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-700',
  'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-700',
  'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900 dark:text-teal-200 dark:border-teal-700',
  'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700',
  'bg-red-50 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700'
];

// Get color style for city activities with alternating colors
export const getCityActivityStyle = (cityName: string, activity: string): string => {
  // Use top choice style if it's a popular activity - no hover effects, uniform sizing
  if (isTopChoiceInterest(activity)) {
    return 'bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0';
  }
  
  // Generate a consistent color index based on city name for alternating colors
  const cityIndex = cityName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = cityIndex % cityColors.length;
  
  return cityColors[colorIndex];
};