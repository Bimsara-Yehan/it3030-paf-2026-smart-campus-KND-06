import { TicketCategory, TicketPriority } from '../types/ticket';

export interface AIPrediction {
  category?: TicketCategory;
  priority?: TicketPriority;
  reason: string;
}

// Enhanced keyword matching with exact word matching and partial matching
function matchKeyword(text: string, keyword: string): boolean {
  // Try exact word boundary match first (for single and multi-word keywords)
  try {
    // Escape special regex characters in keyword
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    return regex.test(text);
  } catch (e) {
    // Fallback to includes match if regex fails
    return text.toLowerCase().includes(keyword.toLowerCase());
  }
}

// Count all matching keywords for a category
function countMatches(text: string, keywords: string[]): number {
  let count = 0;
  for (const keyword of keywords) {
    if (matchKeyword(text, keyword)) {
      count++;
    }
  }
  return count;
}

// Priority order for tie-breaking (higher number = higher priority)
const PRIORITY_RANK: Record<TicketPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const KEYWORD_RULES = [
  {
    category: 'SECURITY' as TicketCategory,
    priority: 'CRITICAL' as TicketPriority,
    reason: 'Security issue detected',
    keywords: ['security']
  },
  {
    category: 'IT_SUPPORT' as TicketCategory,
    priority: 'HIGH' as TicketPriority,
    reason: 'IT support issue detected',
    keywords: ['it', 'wifi']
  },
  {
    category: 'MAINTENANCE' as TicketCategory,
    priority: 'HIGH' as TicketPriority,
    reason: 'Maintenance issue detected',
    keywords: ['maintenance']
  },
  {
    category: 'CLEANING' as TicketCategory,
    priority: 'MEDIUM' as TicketPriority,
    reason: 'Cleaning issue detected',
    keywords: ['cleaning']
  },
  {
    category: 'OTHER' as TicketCategory,
    priority: 'MEDIUM' as TicketPriority,
    reason: 'General issue',
    keywords: ['other']
  }
];

export function predictTicketDetails(text: string): AIPrediction | null {
  if (!text || text.trim().length < 5) {
    return null;
  }

  const normalizedText = text.toLowerCase();
  let bestMatch: AIPrediction | null = null;
  let bestMatchCount = 0;
  let bestPriority = 0;

  // Find all matching categories and their scores
  for (const rule of KEYWORD_RULES) {
    const matchCount = countMatches(normalizedText, rule.keywords);
    const priorityRank = PRIORITY_RANK[rule.priority];

    // Update best match if:
    // 1. More keyword matches found, OR
    // 2. Same keyword matches but higher priority
    if (matchCount > 0) {
      if (matchCount > bestMatchCount || 
          (matchCount === bestMatchCount && priorityRank > bestPriority)) {
        bestMatchCount = matchCount;
        bestPriority = priorityRank;
        bestMatch = {
          category: rule.category,
          priority: rule.priority,
          reason: rule.reason
        };
      }
    }
  }

  return bestMatch;
}
